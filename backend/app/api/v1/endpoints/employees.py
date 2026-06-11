"""AI Employee Studio management endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints.documents import get_chroma_service, get_embedding_service
from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import (
    EMPLOYEES_CHAT,
    EMPLOYEES_DELETE,
    EMPLOYEES_READ,
    EMPLOYEES_WRITE,
)
from app.db.session import get_db
from app.models.ai_employee import AIEmployee
from app.models.ai_employee_conversation import AIEmployeeConversation
from app.models.ai_employee_document import AIEmployeeDocument
from app.models.ai_employee_tool import AIEmployeeTool
from app.models.enums import AIEmployeeStatus
from app.models.user import User
from app.schemas.ai_employee_chat import (
    AIEmployeeChatRequest,
    AIEmployeeChatResponse,
    AIEmployeeConversationResponse,
)
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_chat_service import chat_with_employee, list_employee_conversations
from app.services.employee_rag_service import EmployeeRAGService
from app.schemas.ai_employee import (
    AIEmployeeCreateRequest,
    AIEmployeeDetailResponse,
    AIEmployeeDocumentResponse,
    AIEmployeeKnowledgeAssignmentRequest,
    AIEmployeeResponse,
    AIEmployeeToolResponse,
    AIEmployeeToolsAssignmentRequest,
    AIEmployeeUpdateRequest,
)
from app.services.ai_employee_service import (
    activate_employee,
    create_employee,
    deactivate_employee,
    delete_employee,
    get_employee_detail_or_404,
    get_employee_or_404,
    list_employees,
    list_knowledge_assignments,
    list_tool_assignments,
    replace_knowledge_assignments,
    replace_tool_assignments,
    update_employee,
)

router = APIRouter(prefix="/employees", tags=["employees"])


def get_employee_rag_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmployeeRAGService:
    return EmployeeRAGService(settings)


@router.post("", response_model=AIEmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_ai_employee(
    payload: AIEmployeeCreateRequest,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AIEmployee:
    """Create a new AI employee in the current organization."""
    return create_employee(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[AIEmployeeResponse])
def list_ai_employees(
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_READ))],
    db: Annotated[Session, Depends(get_db)],
    employee_status: Annotated[
        AIEmployeeStatus | None,
        Query(alias="status", description="Filter by employee status"),
    ] = None,
) -> list[AIEmployee]:
    """List AI employees in the current organization."""
    return list_employees(
        db,
        organization_id=current_user.organization_id,
        employee_status=employee_status,
    )


@router.get("/{employee_id}", response_model=AIEmployeeDetailResponse)
def get_ai_employee(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> AIEmployee:
    """Get one AI employee with knowledge and tool assignments."""
    return get_employee_detail_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{employee_id}", response_model=AIEmployeeResponse)
def update_ai_employee(
    employee_id: uuid.UUID,
    payload: AIEmployeeUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AIEmployee:
    """Update an AI employee in the current organization."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return update_employee(db, employee=employee, payload=payload)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_employee(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete an AI employee from the current organization."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    delete_employee(db, employee=employee)


@router.get("/{employee_id}/knowledge", response_model=list[AIEmployeeDocumentResponse])
def get_employee_knowledge_assignments(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AIEmployeeDocument]:
    """List knowledge documents assigned to an AI employee."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return list_knowledge_assignments(db, employee=employee)


@router.put("/{employee_id}/knowledge", response_model=list[AIEmployeeDocumentResponse])
def replace_employee_knowledge_assignments(
    employee_id: uuid.UUID,
    payload: AIEmployeeKnowledgeAssignmentRequest,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AIEmployeeDocument]:
    """Replace all knowledge document assignments for an AI employee."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return replace_knowledge_assignments(
        db,
        employee=employee,
        organization_id=current_user.organization_id,
        knowledge_document_ids=payload.knowledge_document_ids,
    )


@router.get("/{employee_id}/tools", response_model=list[AIEmployeeToolResponse])
def get_employee_tool_assignments(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AIEmployeeTool]:
    """List tools assigned to an AI employee."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return list_tool_assignments(db, employee=employee)


@router.put("/{employee_id}/tools", response_model=list[AIEmployeeToolResponse])
def replace_employee_tool_assignments(
    employee_id: uuid.UUID,
    payload: AIEmployeeToolsAssignmentRequest,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AIEmployeeTool]:
    """Replace all tool assignments for an AI employee."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return replace_tool_assignments(db, employee=employee, tools=payload.tools)


@router.post("/{employee_id}/chat", response_model=AIEmployeeChatResponse)
def chat_with_ai_employee(
    employee_id: uuid.UUID,
    payload: AIEmployeeChatRequest,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_CHAT))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    employee_rag_service: Annotated[EmployeeRAGService, Depends(get_employee_rag_service)],
) -> AIEmployeeChatResponse:
    """Send a message to an active AI employee and receive a grounded answer."""
    return chat_with_employee(
        db,
        settings=settings,
        organization_id=current_user.organization_id,
        user=current_user,
        employee_id=employee_id,
        payload=payload,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )


@router.get("/{employee_id}/conversations", response_model=list[AIEmployeeConversationResponse])
def list_ai_employee_conversations(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_CHAT))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AIEmployeeConversation]:
    """List conversations between the current user and one AI employee."""
    return list_employee_conversations(
        db,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        user_id=current_user.id,
    )


@router.post("/{employee_id}/activate", response_model=AIEmployeeResponse)
def activate_ai_employee(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AIEmployee:
    """Activate an AI employee so it can receive chat requests."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return activate_employee(db, employee=employee)


@router.post("/{employee_id}/deactivate", response_model=AIEmployeeResponse)
def deactivate_ai_employee(
    employee_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(EMPLOYEES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AIEmployee:
    """Deactivate an AI employee to block future chat requests."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=current_user.organization_id,
    )
    return deactivate_employee(db, employee=employee)
