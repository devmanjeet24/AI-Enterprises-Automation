"""Agent task listing, detail, and execution endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.api.v1.endpoints.documents import get_chroma_service, get_embedding_service
from app.api.v1.endpoints.employees import get_employee_rag_service
from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import AGENT_TEAMS_EXECUTE, AGENT_TEAMS_READ
from app.models.enums import AgentTaskStatus
from app.models.user import User
from app.schemas.agent_task import AgentTaskResponse, AgentTaskSummaryResponse
from app.services.agent_task_runner_service import run_agent_task
from app.services.agent_task_service import get_agent_task_detail, list_agent_tasks
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService

router = APIRouter(prefix="/agent-tasks", tags=["agent-tasks"])


@router.get("", response_model=list[AgentTaskSummaryResponse])
def list_tasks(
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_READ))],
    db: Annotated[Session, Depends(get_db)],
    status: Annotated[AgentTaskStatus | None, Query()] = None,
    agent_team_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[AgentTaskSummaryResponse]:
    """List agent tasks in the current organization."""
    return list_agent_tasks(
        db,
        organization_id=current_user.organization_id,
        status=status,
        agent_team_id=agent_team_id,
    )


@router.get("/{task_id}", response_model=AgentTaskResponse)
def get_task(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> AgentTaskResponse:
    """Get one agent task with execution history."""
    return get_agent_task_detail(
        db,
        task_id=task_id,
        organization_id=current_user.organization_id,
    )


@router.post("/{task_id}/run", response_model=AgentTaskResponse)
def run_task(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    employee_rag_service: Annotated[EmployeeRAGService, Depends(get_employee_rag_service)],
) -> AgentTaskResponse:
    """Execute a pending agent task through its team members sequentially."""
    return run_agent_task(
        db,
        settings=settings,
        organization_id=current_user.organization_id,
        task_id=task_id,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )
