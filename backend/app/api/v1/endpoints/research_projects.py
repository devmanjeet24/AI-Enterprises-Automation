"""Business research project and execution endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.documents import get_chroma_service, get_embedding_service
from app.api.v1.endpoints.employees import get_employee_rag_service
from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import (
    RESEARCH_PROJECTS_DELETE,
    RESEARCH_PROJECTS_EXECUTE,
    RESEARCH_PROJECTS_READ,
    RESEARCH_PROJECTS_WRITE,
)
from app.models.enums import AgentTaskStatus, ResearchProjectStatus
from app.models.user import User
from app.schemas.research_project import (
    ResearchAnalyticsResponse,
    ResearchExecutionHistoryResponse,
    ResearchProjectCreateRequest,
    ResearchProjectResponse,
    ResearchProjectUpdateRequest,
    ResearchReportResponse,
    ResearchReportSummaryResponse,
    ResearchRunRequest,
    ResearchTemplateResponse,
    ResearchTemplateStepResponse,
)
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.research_analytics_service import get_research_analytics
from app.services.research_export_service import (
    export_research_report_markdown,
    export_research_report_pdf,
)
from app.services.research_project_service import (
    create_research_project,
    delete_research_project,
    get_research_project_or_404,
    list_research_projects,
    update_research_project,
)
from app.services.research_runner_service import (
    get_research_report_or_404,
    list_research_reports,
    run_research_project,
)
from app.services.research_templates import list_templates

router = APIRouter(prefix="/research-projects", tags=["research-projects"])


@router.get("/templates", response_model=list[ResearchTemplateResponse])
def list_research_templates_endpoint(
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
) -> list[ResearchTemplateResponse]:
    """List available research methodology templates."""
    return [
        ResearchTemplateResponse(
            template_type=template.template_type,
            name=template.name,
            description=template.description,
            steps=[
                ResearchTemplateStepResponse(
                    sequence_order=step.sequence_order,
                    name=step.name,
                    description=step.description,
                )
                for step in template.steps
            ],
        )
        for template in list_templates()
    ]


@router.get("/analytics", response_model=ResearchAnalyticsResponse)
def get_research_analytics_endpoint(
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> ResearchAnalyticsResponse:
    """Aggregate research project and report metrics for the organization."""
    return get_research_analytics(db, organization_id=current_user.organization_id)


@router.get("/reports", response_model=list[ResearchReportSummaryResponse])
def list_all_research_reports_endpoint(
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
    project_id: Annotated[uuid.UUID | None, Query()] = None,
    status: Annotated[AgentTaskStatus | None, Query()] = None,
    limit: Annotated[int | None, Query(ge=1, le=100)] = None,
) -> list[ResearchReportSummaryResponse]:
    """List report history across all projects in the organization."""
    if project_id is not None:
        get_research_project_or_404(
            db,
            project_id=project_id,
            organization_id=current_user.organization_id,
        )
    return list_research_reports(
        db,
        organization_id=current_user.organization_id,
        project_id=project_id,
        status=status,
        limit=limit,
    )


@router.post("", response_model=ResearchProjectResponse, status_code=status.HTTP_201_CREATED)
def create_research_project_endpoint(
    payload: ResearchProjectCreateRequest,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> ResearchProjectResponse:
    """Create a research project with an assigned agent team."""
    return create_research_project(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[ResearchProjectResponse])
def list_research_projects_endpoint(
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[ResearchProjectStatus | None, Query()] = None,
) -> list[ResearchProjectResponse]:
    """List research projects in the current organization."""
    return list_research_projects(
        db,
        organization_id=current_user.organization_id,
        status=status,
    )


@router.get("/{project_id}", response_model=ResearchProjectResponse)
def get_research_project_endpoint(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> ResearchProjectResponse:
    """Get one research project by id."""
    return get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{project_id}", response_model=ResearchProjectResponse)
def update_research_project_endpoint(
    project_id: uuid.UUID,
    payload: ResearchProjectUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> ResearchProjectResponse:
    """Update a research project."""
    project = get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=current_user.organization_id,
    )
    return update_research_project(
        db,
        project=project,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.post(
    "/{project_id}/run",
    response_model=ResearchReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def run_research_project_endpoint(
    project_id: uuid.UUID,
    payload: ResearchRunRequest,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    employee_rag_service: Annotated[EmployeeRAGService, Depends(get_employee_rag_service)],
) -> ResearchReportResponse:
    """Execute the assigned agent team and generate a versioned research report."""
    return run_research_project(
        db,
        settings=settings,
        organization_id=current_user.organization_id,
        project_id=project_id,
        created_by_id=current_user.id,
        payload=payload,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )


@router.get(
    "/{project_id}/executions",
    response_model=list[ResearchExecutionHistoryResponse],
)
def list_project_execution_history_endpoint(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[ResearchExecutionHistoryResponse]:
    """List execution history for one research project ordered by version."""
    get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=current_user.organization_id,
    )
    reports = list_research_reports(
        db,
        organization_id=current_user.organization_id,
        project_id=project_id,
    )
    return sorted(reports, key=lambda report: report.version_number, reverse=True)


@router.get(
    "/{project_id}/reports",
    response_model=list[ResearchReportSummaryResponse],
)
def list_research_reports_endpoint(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[ResearchReportSummaryResponse]:
    """List versioned reports for one research project."""
    get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=current_user.organization_id,
    )
    reports = list_research_reports(
        db,
        organization_id=current_user.organization_id,
        project_id=project_id,
    )
    return sorted(reports, key=lambda report: report.version_number, reverse=True)


@router.get(
    "/{project_id}/reports/{report_id}",
    response_model=ResearchReportResponse,
)
def get_research_report_endpoint(
    project_id: uuid.UUID,
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> ResearchReportResponse:
    """Get one research report with full execution details."""
    get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=current_user.organization_id,
    )
    report = get_research_report_or_404(
        db,
        report_id=report_id,
        organization_id=current_user.organization_id,
    )
    if report.research_project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Research report not found")
    return report


@router.get("/{project_id}/reports/{report_id}/export/markdown")
def export_research_report_markdown_endpoint(
    project_id: uuid.UUID,
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    """Export a completed research report as Markdown."""
    filename, content = export_research_report_markdown(
        db,
        organization_id=current_user.organization_id,
        project_id=project_id,
        report_id=report_id,
    )
    return Response(
        content=content,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{project_id}/reports/{report_id}/export/pdf")
def export_research_report_pdf_endpoint(
    project_id: uuid.UUID,
    report_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    """Export a completed research report as PDF (foundation renderer)."""
    filename, pdf_bytes = export_research_report_pdf(
        db,
        organization_id=current_user.organization_id,
        project_id=project_id,
        report_id=report_id,
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_research_project_endpoint(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(RESEARCH_PROJECTS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a research project."""
    project = get_research_project_or_404(
        db,
        project_id=project_id,
        organization_id=current_user.organization_id,
    )
    delete_research_project(db, project=project)
