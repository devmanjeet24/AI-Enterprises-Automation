"""Simulated browser task execution (Playwright integration deferred)."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.browser_task_execution import BrowserTaskExecution
from app.models.enums import BrowserTaskExecutionStatus, BrowserTaskStatus
from app.services.browser_profile_service import get_browser_profile_or_404
from app.services.browser_task_service import get_browser_task_or_404


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


def run_browser_task(
    db: Session,
    *,
    organization_id: uuid.UUID,
    task_id: uuid.UUID,
    created_by_id: uuid.UUID,
) -> BrowserTaskExecution:
    """Run a simulated browser session and persist logs and results."""
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
            "simulated": True,
            "engine": "simulated",
            "browser_profile_slug": profile.slug,
            "browser_task_slug": task.slug,
        },
    )
    db.add(execution)
    db.flush()

    logs: list[dict[str, Any]] = []
    try:
        _append_log(
            logs,
            level="info",
            message=f"Launching simulated browser with profile '{profile.name}'",
        )
        if profile.user_agent:
            _append_log(logs, level="info", message=f"User-Agent: {profile.user_agent}")
        if profile.viewport_width and profile.viewport_height:
            _append_log(
                logs,
                level="info",
                message=f"Viewport: {profile.viewport_width}x{profile.viewport_height}",
            )

        _append_log(logs, level="info", message=f"Navigating to {task.target_url}")
        _append_log(
            logs,
            level="info",
            message=f"Executing instructions: {task.instructions or 'No instructions provided'}",
        )
        _append_log(logs, level="info", message="Simulated DOM extraction complete")

        result = {
            "simulated": True,
            "target_url": task.target_url,
            "page_title": f"Simulated page — {task.name}",
            "extracted_text": (
                f"Simulated extraction from {task.target_url}. "
                f"Instructions applied: {task.instructions or 'none'}."
            ),
            "elements_found": 3,
        }

        completed_at = datetime.now(UTC)
        execution.status = BrowserTaskExecutionStatus.COMPLETED
        execution.result = result
        execution.logs = logs
        execution.completed_at = completed_at
        execution.execution_metadata = {
            **(execution.execution_metadata or {}),
            "duration_seconds": (completed_at - started_at).total_seconds(),
            "log_count": len(logs),
        }
    except Exception as exc:
        completed_at = datetime.now(UTC)
        _append_log(logs, level="error", message=str(exc))
        execution.status = BrowserTaskExecutionStatus.FAILED
        execution.error_message = str(exc)
        execution.logs = logs
        execution.completed_at = completed_at
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Browser task execution failed",
        ) from exc

    db.commit()
    db.refresh(execution)
    return execution
