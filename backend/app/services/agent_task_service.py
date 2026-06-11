"""Create and track multi-agent collaboration tasks."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.agent_task import AgentTask
from app.models.agent_task_execution import AgentTaskExecution
from app.models.agent_team import AgentTeam
from app.models.agent_team_member import AgentTeamMember
from app.models.enums import AgentTaskExecutionStatus, AgentTaskStatus
from app.schemas.agent_task import AgentTaskCreateRequest


def _ensure_active_team_with_members(db: Session, *, team: AgentTeam) -> list[AgentTeamMember]:
    """Validate that a team is active and has at least one member."""
    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasks can only be submitted to active agent teams",
        )

    members = list(
        db.scalars(
            select(AgentTeamMember)
            .where(AgentTeamMember.agent_team_id == team.id)
            .order_by(AgentTeamMember.sequence_order, AgentTeamMember.added_at)
        ).all()
    )
    if not members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent team must have at least one member before submitting tasks",
        )

    sequence_orders = [member.sequence_order for member in members]
    if len(sequence_orders) != len(set(sequence_orders)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent team members have duplicate sequence_order values",
        )

    return members


def get_agent_task_or_404(
    db: Session,
    *,
    task_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> AgentTask:
    """Load one agent task within the given organization or raise 404."""
    task = db.scalar(
        select(AgentTask)
        .where(
            AgentTask.id == task_id,
            AgentTask.organization_id == organization_id,
        )
        .options(
            selectinload(AgentTask.executions).selectinload(AgentTaskExecution.ai_employee),
            selectinload(AgentTask.executions).selectinload(AgentTaskExecution.agent_team_member),
        )
    )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent task not found",
        )
    return task


def _serialize_task(task: AgentTask) -> dict:
    executions = []
    for execution in sorted(task.executions, key=lambda item: item.sequence_order):
        employee = execution.ai_employee
        member = execution.agent_team_member
        executions.append(
            {
                "id": execution.id,
                "agent_task_id": execution.agent_task_id,
                "ai_employee_id": execution.ai_employee_id,
                "agent_team_member_id": execution.agent_team_member_id,
                "sequence_order": execution.sequence_order,
                "status": execution.status,
                "input_summary": execution.input_summary,
                "output": execution.output,
                "output_payload": execution.output_payload,
                "error_message": execution.error_message,
                "started_at": execution.started_at,
                "completed_at": execution.completed_at,
                "created_at": execution.created_at,
                "updated_at": execution.updated_at,
                "employee_name": employee.name if employee is not None else None,
                "collaboration_role": member.collaboration_role if member is not None else None,
            }
        )

    return {
        "id": task.id,
        "organization_id": task.organization_id,
        "agent_team_id": task.agent_team_id,
        "created_by_id": task.created_by_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "input_payload": task.input_payload,
        "result": task.result,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "executions": executions,
    }


def list_agent_tasks(
    db: Session,
    *,
    organization_id: uuid.UUID,
    status: AgentTaskStatus | None = None,
    agent_team_id: uuid.UUID | None = None,
) -> list[AgentTask]:
    """List agent tasks for one organization with optional filters."""
    query = select(AgentTask).where(AgentTask.organization_id == organization_id)
    if status is not None:
        query = query.where(AgentTask.status == status)
    if agent_team_id is not None:
        query = query.where(AgentTask.agent_team_id == agent_team_id)

    return list(
        db.scalars(query.order_by(AgentTask.created_at.desc())).all()
    )


def create_agent_task(
    db: Session,
    *,
    team: AgentTeam,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: AgentTaskCreateRequest,
) -> dict:
    """Create a task and pre-provision execution steps from team members."""
    if team.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent team not found",
        )

    members = _ensure_active_team_with_members(db, team=team)

    task = AgentTask(
        organization_id=organization_id,
        agent_team_id=team.id,
        created_by_id=created_by_id,
        title=payload.title,
        description=payload.description,
        status=AgentTaskStatus.PENDING,
        input_payload=payload.input_payload,
    )
    db.add(task)
    db.flush()

    for member in members:
        db.add(
            AgentTaskExecution(
                agent_task_id=task.id,
                ai_employee_id=member.ai_employee_id,
                agent_team_member_id=member.id,
                sequence_order=member.sequence_order,
                status=AgentTaskExecutionStatus.PENDING,
            )
        )

    db.commit()
    return _serialize_task(get_agent_task_or_404(db, task_id=task.id, organization_id=organization_id))


def get_agent_task_detail(
    db: Session,
    *,
    task_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> dict:
    """Return one task with execution history."""
    task = get_agent_task_or_404(db, task_id=task_id, organization_id=organization_id)
    return _serialize_task(task)
