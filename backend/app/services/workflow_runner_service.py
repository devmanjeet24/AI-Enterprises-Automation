"""Run workflow definitions by creating and executing agent tasks."""

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.agent_team_member import AgentTeamMember
from app.models.enums import AgentTaskExecutionStatus, AgentTaskStatus, WorkflowStatus
from app.models.workflow import Workflow
from app.models.workflow_execution import WorkflowExecution
from app.schemas.agent_task import AgentTaskCreateRequest
from app.schemas.workflow_execution import WorkflowRunRequest
from app.services.agent_task_runner_service import run_agent_task
from app.services.agent_task_service import create_agent_task
from app.services.agent_team_service import get_agent_team_or_404
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.workflow_service import get_workflow_or_404


def get_workflow_execution_or_404(
    db: Session,
    *,
    execution_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> WorkflowExecution:
    execution = db.scalar(
        select(WorkflowExecution).where(
            WorkflowExecution.id == execution_id,
            WorkflowExecution.organization_id == organization_id,
        )
    )
    if execution is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow execution not found",
        )
    return execution


def list_workflow_executions(
    db: Session,
    *,
    organization_id: uuid.UUID,
    workflow_id: uuid.UUID | None = None,
) -> list[WorkflowExecution]:
    query = select(WorkflowExecution).where(
        WorkflowExecution.organization_id == organization_id,
    )
    if workflow_id is not None:
        query = query.where(WorkflowExecution.workflow_id == workflow_id)

    return list(
        db.scalars(query.order_by(WorkflowExecution.created_at.desc())).all()
    )


def _validate_workflow_runnable(db: Session, *, workflow: Workflow) -> None:
    if not workflow.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow must be active to run",
        )
    if workflow.status != WorkflowStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow must have status 'active' to run",
        )
    if not workflow.steps:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow must have at least one step",
        )

    team = get_agent_team_or_404(
        db,
        team_id=workflow.agent_team_id,
        organization_id=workflow.organization_id,
    )
    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow's agent team must be active to run",
        )

    members = list(
        db.scalars(
            select(AgentTeamMember)
            .where(AgentTeamMember.agent_team_id == team.id)
            .order_by(AgentTeamMember.sequence_order)
        ).all()
    )
    if not members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow's agent team must have at least one member",
        )

    step_orders = {step.sequence_order for step in workflow.steps}
    member_orders = {member.sequence_order for member in members}
    if step_orders != member_orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow step sequence_order values must match agent team member order",
        )


def _build_step_prompts(workflow: Workflow) -> dict[int, str]:
    prompts: dict[int, str] = {}
    for step in workflow.steps:
        config_prompt = None
        if step.config and isinstance(step.config.get("prompt"), str):
            config_prompt = step.config["prompt"].strip()
        prompt = config_prompt or step.description or step.name
        prompts[step.sequence_order] = prompt
    return prompts


def run_workflow(
    db: Session,
    *,
    settings: Settings,
    organization_id: uuid.UUID,
    workflow_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: WorkflowRunRequest,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> dict:
    """Create a workflow execution, agent task, and run all steps."""
    workflow = get_workflow_or_404(db, workflow_id=workflow_id, organization_id=organization_id)
    _validate_workflow_runnable(db, workflow=workflow)

    now = datetime.now(UTC)
    execution = WorkflowExecution(
        organization_id=organization_id,
        workflow_id=workflow.id,
        created_by_id=created_by_id,
        status=AgentTaskStatus.PENDING,
        started_at=now,
    )
    db.add(execution)
    db.flush()

    task_payload = AgentTaskCreateRequest(
        title=payload.title or workflow.name,
        description=payload.description or workflow.description or workflow.name,
        input_payload=payload.input_payload,
    )
    team = get_agent_team_or_404(
        db,
        team_id=workflow.agent_team_id,
        organization_id=organization_id,
    )

    try:
        task_data = create_agent_task(
            db,
            team=team,
            organization_id=organization_id,
            created_by_id=created_by_id,
            payload=task_payload,
        )
        task_id = uuid.UUID(str(task_data["id"]))
        execution.agent_task_id = task_id
        execution.status = AgentTaskStatus.IN_PROGRESS
        db.commit()

        task_result = run_agent_task(
            db,
            settings=settings,
            organization_id=organization_id,
            task_id=task_id,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            employee_rag_service=employee_rag_service,
            step_prompts=_build_step_prompts(workflow),
        )
    except HTTPException:
        execution.status = AgentTaskStatus.FAILED
        execution.completed_at = datetime.now(UTC)
        db.commit()
        raise
    except Exception as exc:
        execution.status = AgentTaskStatus.FAILED
        execution.error_message = str(exc)
        execution.completed_at = datetime.now(UTC)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Workflow execution failed",
        ) from exc

    execution.status = AgentTaskStatus(task_result["status"])
    execution.final_output = task_result.get("result")
    execution.completed_at = datetime.now(UTC)
    if execution.status == AgentTaskStatus.FAILED:
        failed_steps = [
            step
            for step in task_result.get("executions", [])
            if step.get("status") == AgentTaskExecutionStatus.FAILED.value
        ]
        if failed_steps:
            execution.error_message = failed_steps[0].get("error_message")
    db.commit()

    return _serialize_workflow_execution(
        get_workflow_execution_or_404(
            db,
            execution_id=execution.id,
            organization_id=organization_id,
        ),
        task_result=task_result,
    )


def _serialize_workflow_execution(
    execution: WorkflowExecution,
    *,
    task_result: dict | None = None,
) -> dict:
    return {
        "id": execution.id,
        "organization_id": execution.organization_id,
        "workflow_id": execution.workflow_id,
        "agent_task_id": execution.agent_task_id,
        "created_by_id": execution.created_by_id,
        "status": execution.status,
        "final_output": execution.final_output,
        "error_message": execution.error_message,
        "started_at": execution.started_at,
        "completed_at": execution.completed_at,
        "created_at": execution.created_at,
        "updated_at": execution.updated_at,
        "agent_task": task_result,
    }
