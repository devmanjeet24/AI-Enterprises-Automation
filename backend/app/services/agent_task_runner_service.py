"""Run multi-agent tasks sequentially through assigned team members."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.agent_task import AgentTask
from app.models.agent_task_execution import AgentTaskExecution
from app.models.enums import AgentTaskExecutionStatus, AgentTaskStatus
from app.services.agent_task_service import get_agent_task_or_404
from app.services.agent_team_service import get_agent_team_or_404
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.employee_step_executor import execute_employee_step


def run_agent_task(
    db: Session,
    *,
    settings: Settings,
    organization_id: uuid.UUID,
    task_id: uuid.UUID,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
    step_prompts: dict[int, str] | None = None,
) -> dict:
    """Execute pending task steps in sequence and update statuses automatically."""
    task = get_agent_task_or_404(db, task_id=task_id, organization_id=organization_id)
    team = get_agent_team_or_404(
        db,
        team_id=task.agent_team_id,
        organization_id=organization_id,
    )

    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent team must be active to run tasks",
        )

    if task.status in {AgentTaskStatus.COMPLETED, AgentTaskStatus.CANCELLED}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Task with status '{task.status.value}' cannot be executed",
        )

    if task.status == AgentTaskStatus.FAILED:
        _reset_failed_task_for_retry(task)

    executions = sorted(task.executions, key=lambda item: item.sequence_order)
    if not executions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task has no execution steps",
        )

    now = datetime.now(UTC)
    if task.status == AgentTaskStatus.PENDING:
        task.status = AgentTaskStatus.IN_PROGRESS

    prior_output: str | None = None
    prior_step_name: str | None = None
    final_output: str | None = None

    for execution in executions:
        if execution.status == AgentTaskExecutionStatus.COMPLETED:
            prior_output = execution.output
            prior_step_name = execution.agent_team_member.collaboration_role if execution.agent_team_member else None
            final_output = execution.output
            continue

        if execution.status in {
            AgentTaskExecutionStatus.FAILED,
            AgentTaskExecutionStatus.SKIPPED,
        }:
            continue

        employee = execution.ai_employee
        if employee is None:
            _mark_execution_failed(
                execution,
                error_message="Assigned AI employee no longer exists",
                completed_at=now,
            )
            task.status = AgentTaskStatus.FAILED
            db.commit()
            break

        step_prompt = _resolve_step_prompt(
            execution=execution,
            task=task,
            step_prompts=step_prompts,
        )
        collaboration_role = (
            execution.agent_team_member.collaboration_role
            if execution.agent_team_member is not None
            else employee.role
        )

        execution.status = AgentTaskExecutionStatus.RUNNING
        execution.started_at = execution.started_at or now
        execution.error_message = None
        db.commit()

        try:
            result = execute_employee_step(
                db,
                settings=settings,
                organization_id=organization_id,
                employee=employee,
                step_prompt=step_prompt,
                task_title=task.title,
                task_description=task.description,
                task_input_payload=task.input_payload,
                collaboration_role=collaboration_role,
                prior_output=prior_output,
                prior_step_name=prior_step_name,
                embedding_service=embedding_service,
                chroma_service=chroma_service,
                employee_rag_service=employee_rag_service,
            )
        except Exception as exc:
            _mark_execution_failed(
                execution,
                error_message=str(exc),
                completed_at=datetime.now(UTC),
            )
            task.status = AgentTaskStatus.FAILED
            db.commit()
            break

        execution.status = AgentTaskExecutionStatus.COMPLETED
        execution.input_summary = result.input_summary
        execution.output = result.answer
        execution.output_payload = result.output_payload
        execution.completed_at = datetime.now(UTC)
        prior_output = result.answer
        prior_step_name = collaboration_role
        final_output = result.answer
        db.commit()

    if task.status == AgentTaskStatus.IN_PROGRESS:
        pending_or_running = [
            item
            for item in executions
            if item.status
            in {
                AgentTaskExecutionStatus.PENDING,
                AgentTaskExecutionStatus.RUNNING,
            }
        ]
        if not pending_or_running:
            task.status = AgentTaskStatus.COMPLETED
            task.result = final_output
            db.commit()

    from app.services.agent_task_service import get_agent_task_detail

    return get_agent_task_detail(db, task_id=task.id, organization_id=organization_id)


def _reset_failed_task_for_retry(task: AgentTask) -> None:
    for execution in task.executions:
        if execution.status == AgentTaskExecutionStatus.FAILED:
            execution.status = AgentTaskExecutionStatus.PENDING
            execution.error_message = None
            execution.started_at = None
            execution.completed_at = None
            execution.output = None
            execution.output_payload = None
            execution.input_summary = None
    task.status = AgentTaskStatus.IN_PROGRESS
    task.result = None


def _resolve_step_prompt(
    *,
    execution: AgentTaskExecution,
    task: AgentTask,
    step_prompts: dict[int, str] | None,
) -> str:
    if step_prompts and execution.sequence_order in step_prompts:
        return step_prompts[execution.sequence_order]

    role = (
        execution.agent_team_member.collaboration_role
        if execution.agent_team_member is not None
        else "team member"
    )
    return (
        f"As the {role}, complete your part of the task '{task.title}'. "
        f"Focus on: {task.description}"
    )


def _mark_execution_failed(
    execution: AgentTaskExecution,
    *,
    error_message: str,
    completed_at: datetime,
) -> None:
    execution.status = AgentTaskExecutionStatus.FAILED
    execution.error_message = error_message
    execution.completed_at = completed_at
