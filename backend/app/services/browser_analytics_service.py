"""Browser automation analytics aggregation."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.browser_profile import BrowserProfile
from app.models.browser_task import BrowserTask
from app.models.browser_task_execution import BrowserTaskExecution
from app.models.enums import BrowserTaskExecutionStatus, BrowserTaskStatus


def get_browser_analytics(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> dict:
    """Aggregate browser profile, task, and execution counts."""
    total_profiles = db.scalar(
        select(func.count())
        .select_from(BrowserProfile)
        .where(BrowserProfile.organization_id == organization_id)
    ) or 0
    active_profiles = db.scalar(
        select(func.count())
        .select_from(BrowserProfile)
        .where(
            BrowserProfile.organization_id == organization_id,
            BrowserProfile.is_active.is_(True),
        )
    ) or 0

    task_rows = db.execute(
        select(BrowserTask.status, func.count())
        .where(BrowserTask.organization_id == organization_id)
        .group_by(BrowserTask.status)
    ).all()
    tasks_by_status = {status.value: count for status, count in task_rows}
    total_tasks = sum(tasks_by_status.values())

    execution_rows = db.execute(
        select(BrowserTaskExecution.status, func.count())
        .where(BrowserTaskExecution.organization_id == organization_id)
        .group_by(BrowserTaskExecution.status)
    ).all()
    executions_by_status = {status.value: count for status, count in execution_rows}
    total_executions = sum(executions_by_status.values())

    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    recent_executions_7d = db.scalar(
        select(func.count())
        .select_from(BrowserTaskExecution)
        .where(
            BrowserTaskExecution.organization_id == organization_id,
            BrowserTaskExecution.created_at >= seven_days_ago,
        )
    ) or 0

    ready_tasks = tasks_by_status.get(BrowserTaskStatus.READY.value, 0)
    completed_executions = executions_by_status.get(
        BrowserTaskExecutionStatus.COMPLETED.value,
        0,
    )
    failed_executions = executions_by_status.get(
        BrowserTaskExecutionStatus.FAILED.value,
        0,
    )

    return {
        "total_profiles": total_profiles,
        "active_profiles": active_profiles,
        "total_tasks": total_tasks,
        "ready_tasks": ready_tasks,
        "tasks_by_status": tasks_by_status,
        "total_executions": total_executions,
        "completed_executions": completed_executions,
        "failed_executions": failed_executions,
        "executions_by_status": executions_by_status,
        "recent_executions_7d": recent_executions_7d,
    }
