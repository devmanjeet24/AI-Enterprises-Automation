"""Execute research projects via assigned agent teams and persist reports."""

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.agent_team_member import AgentTeamMember
from app.models.enums import AgentTaskExecutionStatus, AgentTaskStatus, ResearchProjectStatus
from app.models.research_report import ResearchReport
from app.schemas.agent_task import AgentTaskCreateRequest
from app.schemas.research_project import ResearchRunRequest
from app.services.agent_task_runner_service import run_agent_task
from app.services.agent_task_service import create_agent_task
from app.services.agent_team_service import get_agent_team_or_404
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.research_project_service import get_research_project_or_404
from app.services.research_templates import build_step_prompts, get_template


def get_research_report_or_404(
    db: Session,
    *,
    report_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> ResearchReport:
    report = db.scalar(
        select(ResearchReport).where(
            ResearchReport.id == report_id,
            ResearchReport.organization_id == organization_id,
        )
    )
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research report not found",
        )
    return report


def list_research_reports(
    db: Session,
    *,
    organization_id: uuid.UUID,
    project_id: uuid.UUID | None = None,
    status: AgentTaskStatus | None = None,
    limit: int | None = None,
) -> list[ResearchReport]:
    query = select(ResearchReport).where(ResearchReport.organization_id == organization_id)
    if project_id is not None:
        query = query.where(ResearchReport.research_project_id == project_id)
    if status is not None:
        query = query.where(ResearchReport.status == status)
    query = query.order_by(ResearchReport.created_at.desc())
    if limit is not None:
        query = query.limit(limit)
    return list(db.scalars(query).all())


def _next_report_version(db: Session, *, project_id: uuid.UUID) -> int:
    current_max = db.scalar(
        select(func.max(ResearchReport.version_number)).where(
            ResearchReport.research_project_id == project_id,
        )
    )
    return (current_max or 0) + 1


def _validate_project_runnable(db: Session, *, project) -> None:
    if not project.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research project must be active to run",
        )
    if project.status != ResearchProjectStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research project must have status 'active' to run",
        )
    if not project.research_brief or not project.research_brief.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research project must have a research brief to run",
        )

    team = get_agent_team_or_404(
        db,
        team_id=project.agent_team_id,
        organization_id=project.organization_id,
    )
    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research project's agent team must be active to run",
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
            detail="Research project's agent team must have at least one member",
        )


def _json_safe_value(value: Any) -> Any:
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _json_safe_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe_value(item) for item in value]
    return value


def _build_intermediate_outputs(task_result: dict) -> list[dict[str, Any]]:
    outputs: list[dict[str, Any]] = []
    for execution in task_result.get("executions", []):
        outputs.append(
            _json_safe_value(
                {
                    "sequence_order": execution.get("sequence_order"),
                    "ai_employee_id": execution.get("ai_employee_id"),
                    "status": execution.get("status"),
                    "output": execution.get("output"),
                    "output_payload": execution.get("output_payload"),
                    "error_message": execution.get("error_message"),
                    "started_at": execution.get("started_at"),
                    "completed_at": execution.get("completed_at"),
                }
            )
        )
    return outputs


def _build_execution_metadata(
    *,
    project,
    task_result: dict,
    started_at: datetime,
    completed_at: datetime,
) -> dict[str, Any]:
    template = get_template(project.template_type)
    executions = task_result.get("executions", [])
    return _json_safe_value(
        {
            "template_type": project.template_type.value,
            "template_name": template.name,
            "agent_team_id": project.agent_team_id,
            "task_id": task_result.get("id"),
            "task_status": task_result.get("status"),
            "step_count": len(executions),
            "completed_steps": sum(
                1
                for step in executions
                if step.get("status") == AgentTaskExecutionStatus.COMPLETED.value
            ),
            "failed_steps": sum(
                1 for step in executions if step.get("status") == AgentTaskExecutionStatus.FAILED.value
            ),
            "duration_seconds": (completed_at - started_at).total_seconds(),
            "started_at": started_at,
            "completed_at": completed_at,
        }
    )


def run_research_project(
    db: Session,
    *,
    settings: Settings,
    organization_id: uuid.UUID,
    project_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: ResearchRunRequest,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> dict:
    """Create a research report, agent task, and execute all team steps."""
    project = get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=organization_id,
    )
    _validate_project_runnable(db, project=project)

    team = get_agent_team_or_404(
        db,
        team_id=project.agent_team_id,
        organization_id=organization_id,
    )
    member_orders = [
        member.sequence_order
        for member in sorted(team.members, key=lambda item: item.sequence_order)
    ]
    step_prompts = build_step_prompts(
        template_type=project.template_type,
        research_brief=project.research_brief or "",
        member_sequence_orders=member_orders,
    )

    now = datetime.now(UTC)
    version_number = _next_report_version(db, project_id=project.id)
    report = ResearchReport(
        organization_id=organization_id,
        research_project_id=project.id,
        created_by_id=created_by_id,
        version_number=version_number,
        status=AgentTaskStatus.PENDING,
        started_at=now,
        execution_metadata={
            "template_type": project.template_type.value,
            "research_brief": project.research_brief,
            "version_number": version_number,
        },
    )
    db.add(report)
    db.flush()

    task_payload = AgentTaskCreateRequest(
        title=payload.title or project.name,
        description=project.research_brief or project.name,
        input_payload=payload.input_payload,
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
        report.agent_task_id = task_id
        report.status = AgentTaskStatus.IN_PROGRESS
        db.commit()

        task_result = run_agent_task(
            db,
            settings=settings,
            organization_id=organization_id,
            task_id=task_id,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            employee_rag_service=employee_rag_service,
            step_prompts=step_prompts,
        )
    except HTTPException:
        report.status = AgentTaskStatus.FAILED
        report.completed_at = datetime.now(UTC)
        db.commit()
        raise
    except Exception as exc:
        report.status = AgentTaskStatus.FAILED
        report.error_message = str(exc)
        report.completed_at = datetime.now(UTC)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Research execution failed",
        ) from exc

    completed_at = datetime.now(UTC)
    report.status = AgentTaskStatus(task_result["status"])
    report.final_output = task_result.get("result")
    report.intermediate_outputs = _build_intermediate_outputs(task_result)
    report.execution_metadata = _build_execution_metadata(
        project=project,
        task_result=task_result,
        started_at=report.started_at or now,
        completed_at=completed_at,
    )
    report.completed_at = completed_at
    if report.status == AgentTaskStatus.FAILED:
        failed_steps = [
            step
            for step in task_result.get("executions", [])
            if step.get("status") == AgentTaskExecutionStatus.FAILED.value
        ]
        if failed_steps:
            report.error_message = failed_steps[0].get("error_message")
    db.commit()

    return _serialize_research_report(
        get_research_report_or_404(
            db,
            report_id=report.id,
            organization_id=organization_id,
        ),
        task_result=task_result,
    )


def _serialize_research_report(
    report: ResearchReport,
    *,
    task_result: dict | None = None,
) -> dict:
    return {
        "id": report.id,
        "organization_id": report.organization_id,
        "research_project_id": report.research_project_id,
        "agent_task_id": report.agent_task_id,
        "created_by_id": report.created_by_id,
        "version_number": report.version_number,
        "status": report.status,
        "final_output": report.final_output,
        "intermediate_outputs": report.intermediate_outputs,
        "execution_metadata": report.execution_metadata,
        "error_message": report.error_message,
        "started_at": report.started_at,
        "completed_at": report.completed_at,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "agent_task": task_result,
    }
