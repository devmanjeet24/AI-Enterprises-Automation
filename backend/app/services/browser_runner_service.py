"""Browser task execution via Playwright."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.browser_task_execution import BrowserTaskExecution
from app.models.enums import BrowserTaskExecutionStatus, BrowserTaskStatus
from app.schemas.browser_step import parse_browser_task_config, resolve_execution_steps
from app.services.browser_profile_service import get_browser_profile_or_404
from app.services.browser_profile_session_service import mark_profile_session_saved
from app.services.browser_step_executor import StepExecutionError
from app.services.browser_task_service import get_browser_task_or_404
from app.services.playwright_engine import format_playwright_error, run_playwright_task


def get_browser_task_execution_or_404(
    db: Session,
    *,
    execution_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> BrowserTaskExecution:
    execution = db.scalar(
        select(BrowserTaskExecution).where(
            BrowserTaskExecution.id == execution_id,
            BrowserTaskExecution.organization_id == organization_id,
        )
    )
    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Browser task execution not found",
        )
    return execution


def list_browser_task_executions(
    db: Session,
    *,
    organization_id: uuid.UUID,
    task_id: uuid.UUID | None = None,
) -> list[BrowserTaskExecution]:
    query = select(BrowserTaskExecution).where(
        BrowserTaskExecution.organization_id == organization_id,
    )
    if task_id is not None:
        query = query.where(BrowserTaskExecution.browser_task_id == task_id)
    return list(
        db.scalars(query.order_by(BrowserTaskExecution.created_at.desc())).all()
    )


def _append_log(
    logs: list[dict[str, Any]],
    *,
    level: str,
    message: str,
) -> None:
    logs.append(
        {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": level,
            "message": message,
        }
    )


def _validate_task_runnable(db: Session, *, task) -> None:
    if task.status != BrowserTaskStatus.READY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Browser task must have status 'ready' to run",
        )
    profile = get_browser_profile_or_404(
        db,
        profile_id=task.browser_profile_id,
        organization_id=task.organization_id,
    )
    if not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Browser task's profile must be active to run",
        )
    if not task.target_url or not task.target_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Browser task must have a target URL to run",
        )


def _failed_step_metadata(exc: StepExecutionError) -> dict[str, Any]:
    return {
        "index": exc.step_index,
        "action": exc.step_action,
        "selector": exc.selector,
        "message": exc.message,
    }


def run_browser_task(
    db: Session,
    *,
    organization_id: uuid.UUID,
    task_id: uuid.UUID,
    created_by_id: uuid.UUID,
) -> BrowserTaskExecution:
    """Run a Playwright browser session and persist logs and results."""
    task = get_browser_task_or_404(
        db,
        task_id=task_id,
        organization_id=organization_id,
    )
    _validate_task_runnable(db, task=task)

    profile = get_browser_profile_or_404(
        db,
        profile_id=task.browser_profile_id,
        organization_id=organization_id,
    )

    task_config = parse_browser_task_config(task.config)
    secrets = task_config.secrets or {}
    steps = resolve_execution_steps(config=task.config, target_url=task.target_url.strip())
    step_count = len(steps)

    started_at = datetime.now(UTC)
    execution = BrowserTaskExecution(
        organization_id=organization_id,
        browser_task_id=task.id,
        browser_profile_id=profile.id,
        created_by_id=created_by_id,
        status=BrowserTaskExecutionStatus.RUNNING,
        started_at=started_at,
        logs=[],
        execution_metadata={
            "simulated": False,
            "engine": "playwright",
            "step_engine": True,
            "steps_total": step_count,
            "browser_profile_slug": profile.slug,
            "browser_task_slug": task.slug,
        },
    )
    db.add(execution)
    db.flush()

    logs: list[dict[str, Any]] = []
    try:
        if task.instructions:
            _append_log(
                logs,
                level="info",
                message=f"Task notes: {task.instructions}",
            )

        def on_log(level: str, message: str) -> None:
            _append_log(logs, level=level, message=message)

        page_result = run_playwright_task(
            profile=profile,
            organization_id=organization_id,
            target_url=task.target_url.strip(),
            steps=steps,
            secrets=secrets,
            task_config=task_config,
            on_log=on_log,
        )

        if page_result.session_saved:
            mark_profile_session_saved(db, profile=profile)

        result = {
            "simulated": False,
            "target_url": page_result.target_url,
            "final_url": page_result.final_url,
            "page_title": page_result.page_title,
            "extracted_text": page_result.extracted_text,
            "extracted": page_result.extracted,
            "elements_found": page_result.elements_found,
            "steps_completed": page_result.steps_completed,
            "step_count": page_result.step_count,
        }

        completed_at = datetime.now(UTC)
        execution.status = BrowserTaskExecutionStatus.COMPLETED
        execution.result = result
        execution.logs = logs
        execution.completed_at = completed_at
        execution.execution_metadata = {
            **(execution.execution_metadata or {}),
            "steps_completed": page_result.steps_completed,
            "session_loaded": page_result.session_loaded,
            "session_saved": page_result.session_saved,
            "session_persistence_enabled": profile.session_persistence_enabled,
            "duration_seconds": (completed_at - started_at).total_seconds(),
            "log_count": len(logs),
        }
    except StepExecutionError as exc:
        completed_at = datetime.now(UTC)
        error_message = format_playwright_error(exc)
        _append_log(logs, level="error", message=error_message)
        execution.status = BrowserTaskExecutionStatus.FAILED
        execution.error_message = error_message
        execution.logs = logs
        execution.completed_at = completed_at
        execution.result = {
            "simulated": False,
            "steps_completed": exc.step_index,
            "step_count": step_count,
            "extracted": {},
        }
        execution.execution_metadata = {
            **(execution.execution_metadata or {}),
            "steps_completed": exc.step_index,
            "failed_step": _failed_step_metadata(exc),
            "duration_seconds": (completed_at - started_at).total_seconds(),
            "log_count": len(logs),
        }
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Browser task execution failed",
        ) from exc
    except Exception as exc:
        completed_at = datetime.now(UTC)
        error_message = format_playwright_error(exc)
        _append_log(logs, level="error", message=error_message)
        execution.status = BrowserTaskExecutionStatus.FAILED
        execution.error_message = error_message
        execution.logs = logs
        execution.completed_at = completed_at
        execution.execution_metadata = {
            **(execution.execution_metadata or {}),
            "duration_seconds": (completed_at - started_at).total_seconds(),
            "log_count": len(logs),
        }
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Browser task execution failed",
        ) from exc

    db.commit()
    db.refresh(execution)
    return execution
