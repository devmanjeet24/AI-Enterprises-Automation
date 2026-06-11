"""Workflow automation definition and execution endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.documents import get_chroma_service, get_embedding_service
from app.api.v1.endpoints.employees import get_employee_rag_service
from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import WORKFLOWS_DELETE, WORKFLOWS_READ, WORKFLOWS_WRITE
from app.models.enums import WorkflowStatus
from app.models.user import User
from app.schemas.workflow import WorkflowCreateRequest, WorkflowResponse, WorkflowUpdateRequest
from app.schemas.workflow_execution import (
    WorkflowExecutionResponse,
    WorkflowExecutionSummaryResponse,
    WorkflowRunRequest,
)
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.workflow_runner_service import list_workflow_executions, run_workflow
from app.services.workflow_service import (
    create_workflow,
    delete_workflow,
    get_workflow_or_404,
    list_workflows,
    update_workflow,
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow_endpoint(
    payload: WorkflowCreateRequest,
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowResponse:
    """Create a workflow with ordered steps attached to an agent team."""
    return create_workflow(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[WorkflowResponse])
def list_workflows_endpoint(
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_READ))],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[WorkflowStatus | None, Query()] = None,
) -> list[WorkflowResponse]:
    """List workflows in the current organization."""
    return list_workflows(
        db,
        organization_id=current_user.organization_id,
        status=status,
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow_endpoint(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowResponse:
    """Get one workflow by id."""
    return get_workflow_or_404(
        db,
        workflow_id=workflow_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow_endpoint(
    workflow_id: uuid.UUID,
    payload: WorkflowUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> WorkflowResponse:
    """Update a workflow."""
    workflow = get_workflow_or_404(
        db,
        workflow_id=workflow_id,
        organization_id=current_user.organization_id,
    )
    return update_workflow(
        db,
        workflow=workflow,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.post(
    "/{workflow_id}/run",
    response_model=WorkflowExecutionResponse,
    status_code=status.HTTP_201_CREATED,
)
def run_workflow_endpoint(
    workflow_id: uuid.UUID,
    payload: WorkflowRunRequest,
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    employee_rag_service: Annotated[EmployeeRAGService, Depends(get_employee_rag_service)],
) -> WorkflowExecutionResponse:
    """Create an agent task from a workflow and execute all steps."""
    return run_workflow(
        db,
        settings=settings,
        organization_id=current_user.organization_id,
        workflow_id=workflow_id,
        created_by_id=current_user.id,
        payload=payload,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )


@router.get(
    "/{workflow_id}/executions",
    response_model=list[WorkflowExecutionSummaryResponse],
)
def list_workflow_executions_endpoint(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[WorkflowExecutionSummaryResponse]:
    """List execution history for one workflow."""
    get_workflow_or_404(
        db,
        workflow_id=workflow_id,
        organization_id=current_user.organization_id,
    )
    return list_workflow_executions(
        db,
        organization_id=current_user.organization_id,
        workflow_id=workflow_id,
    )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workflow_endpoint(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(WORKFLOWS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a workflow."""
    workflow = get_workflow_or_404(
        db,
        workflow_id=workflow_id,
        organization_id=current_user.organization_id,
    )
    delete_workflow(db, workflow=workflow)
