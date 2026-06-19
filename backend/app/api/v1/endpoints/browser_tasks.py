"""Browser automation task definition and execution endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    BROWSER_TASKS_DELETE,
    BROWSER_TASKS_EXECUTE,
    BROWSER_TASKS_READ,
    BROWSER_TASKS_WRITE,
)
from app.models.user import User
from app.schemas.browser_task import (
    BrowserAnalyticsResponse,
    BrowserTaskCreateRequest,
    BrowserTaskExecutionResponse,
    BrowserTaskExecutionSummaryResponse,
    BrowserTaskResponse,
    BrowserTaskUpdateRequest,
)
from app.services.browser_analytics_service import get_browser_analytics
from app.services.browser_runner_service import (
    get_browser_task_execution_or_404,
    list_browser_task_executions,
    run_browser_task,
)
from app.services.browser_screenshot_store import get_execution_screenshot_path
from app.services.browser_task_service import (
    create_browser_task,
    delete_browser_task,
    get_browser_task_or_404,
    list_browser_tasks,
    update_browser_task,
)

router = APIRouter(prefix="/browser-tasks", tags=["browser-tasks"])


def _execution_to_summary(execution) -> BrowserTaskExecutionSummaryResponse:
    metadata = execution.execution_metadata or {}
    return BrowserTaskExecutionSummaryResponse(
        id=execution.id,
        organization_id=execution.organization_id,
        browser_task_id=execution.browser_task_id,
        browser_profile_id=execution.browser_profile_id,
        status=execution.status,
        error_message=execution.error_message,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
        created_at=execution.created_at,
        steps_completed=metadata.get("steps_completed"),
        steps_total=metadata.get("steps_total"),
        has_failure_screenshot=bool(metadata.get("has_failure_screenshot")),
    )


@router.get("/analytics", response_model=BrowserAnalyticsResponse)
def get_browser_analytics_endpoint(
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserAnalyticsResponse:
    """Aggregate browser profile, task, and execution metrics."""
    return get_browser_analytics(db, organization_id=current_user.organization_id)


@router.post("", response_model=BrowserTaskResponse, status_code=status.HTTP_201_CREATED)
def create_browser_task_endpoint(
    payload: BrowserTaskCreateRequest,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserTaskResponse:
    """Create a browser task definition."""
    return create_browser_task(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[BrowserTaskResponse])
def list_browser_tasks_endpoint(
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
    browser_profile_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[BrowserTaskResponse]:
    """List browser task definitions in the current organization."""
    return list_browser_tasks(
        db,
        organization_id=current_user.organization_id,
        profile_id=browser_profile_id,
    )


@router.get("/executions", response_model=list[BrowserTaskExecutionSummaryResponse])
def list_all_browser_executions_endpoint(
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
    browser_task_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[BrowserTaskExecutionSummaryResponse]:
    """List browser execution history across the organization."""
    if browser_task_id is not None:
        get_browser_task_or_404(
            db,
            task_id=browser_task_id,
            organization_id=current_user.organization_id,
        )
    return [
        _execution_to_summary(execution)
        for execution in list_browser_task_executions(
            db,
            organization_id=current_user.organization_id,
            task_id=browser_task_id,
        )
    ]


@router.get("/executions/{execution_id}/screenshot")
def get_browser_execution_screenshot_endpoint(
    execution_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> FileResponse:
    """Return the failure screenshot captured during a browser task execution."""
    execution = get_browser_task_execution_or_404(
        db,
        execution_id=execution_id,
        organization_id=current_user.organization_id,
    )
    metadata = execution.execution_metadata or {}
    if not metadata.get("has_failure_screenshot"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No failure screenshot available for this execution",
        )

    screenshot_path = get_execution_screenshot_path(
        organization_id=current_user.organization_id,
        execution_id=execution.id,
    )
    if not screenshot_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Failure screenshot file not found",
        )

    return FileResponse(
        path=str(screenshot_path),
        media_type="image/png",
        filename=f"execution-{execution.id}-failure.png",
    )


@router.get("/executions/{execution_id}", response_model=BrowserTaskExecutionResponse)
def get_browser_execution_endpoint(
    execution_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserTaskExecutionResponse:
    """Get one browser task execution with logs and results."""
    return get_browser_task_execution_or_404(
        db,
        execution_id=execution_id,
        organization_id=current_user.organization_id,
    )


@router.get("/{task_id}", response_model=BrowserTaskResponse)
def get_browser_task_endpoint(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserTaskResponse:
    """Get one browser task by id."""
    return get_browser_task_or_404(
        db,
        task_id=task_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{task_id}", response_model=BrowserTaskResponse)
def update_browser_task_endpoint(
    task_id: uuid.UUID,
    payload: BrowserTaskUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserTaskResponse:
    """Update a browser task definition."""
    task = get_browser_task_or_404(
        db,
        task_id=task_id,
        organization_id=current_user.organization_id,
    )
    return update_browser_task(
        db,
        task=task,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.post(
    "/{task_id}/run",
    response_model=BrowserTaskExecutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def run_browser_task_endpoint(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
) -> BrowserTaskExecutionResponse:
    """Run a browser task with Playwright and store logs and results."""
    return run_browser_task(
        db,
        organization_id=current_user.organization_id,
        task_id=task_id,
        created_by_id=current_user.id,
    )


@router.get(
    "/{task_id}/executions",
    response_model=list[BrowserTaskExecutionSummaryResponse],
)
def list_browser_task_executions_endpoint(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[BrowserTaskExecutionSummaryResponse]:
    """List execution history for one browser task."""
    get_browser_task_or_404(
        db,
        task_id=task_id,
        organization_id=current_user.organization_id,
    )
    return [
        _execution_to_summary(execution)
        for execution in list_browser_task_executions(
            db,
            organization_id=current_user.organization_id,
            task_id=task_id,
        )
    ]


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_browser_task_endpoint(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(BROWSER_TASKS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a browser task definition."""
    task = get_browser_task_or_404(
        db,
        task_id=task_id,
        organization_id=current_user.organization_id,
    )
    delete_browser_task(db, task=task)
