"""Chat orchestration for AI employees with conversation persistence."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.config import Settings
from app.models.ai_employee import AIEmployee
from app.models.ai_employee_conversation import AIEmployeeConversation
from app.models.ai_employee_message import AIEmployeeMessage
from app.models.enums import AIEmployeeStatus, MessageRole
from app.models.user import User
from app.schemas.ai_employee_chat import AIEmployeeChatRequest, AIEmployeeChatResponse
from app.schemas.knowledge_query import KnowledgeSourceCitation
from app.services.ai_employee_service import get_employee_or_404, list_knowledge_assignments
from app.services.chroma_service import ChromaService
from app.services.embedding_service import EmbeddingService
from app.services.employee_rag_service import EmployeeRAGService, citations_to_json

MAX_CONVERSATION_HISTORY_MESSAGES = 10
CONVERSATION_TITLE_MAX_LENGTH = 255


def list_employee_conversations(
    db: Session,
    *,
    organization_id: uuid.UUID,
    employee_id: uuid.UUID,
    user_id: uuid.UUID,
) -> list[AIEmployeeConversation]:
    """List conversations between one user and one AI employee."""
    get_employee_or_404(db, employee_id=employee_id, organization_id=organization_id)

    return list(
        db.scalars(
            select(AIEmployeeConversation)
            .where(
                AIEmployeeConversation.organization_id == organization_id,
                AIEmployeeConversation.ai_employee_id == employee_id,
                AIEmployeeConversation.user_id == user_id,
            )
            .order_by(AIEmployeeConversation.updated_at.desc())
        ).all()
    )


def get_conversation_or_404(
    db: Session,
    *,
    conversation_id: uuid.UUID,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
) -> AIEmployeeConversation:
    """Load one conversation with messages for the current user."""
    conversation = db.scalar(
        select(AIEmployeeConversation)
        .where(
            AIEmployeeConversation.id == conversation_id,
            AIEmployeeConversation.organization_id == organization_id,
            AIEmployeeConversation.user_id == user_id,
        )
        .options(selectinload(AIEmployeeConversation.messages))
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
    return conversation


def chat_with_employee(
    db: Session,
    *,
    settings: Settings,
    organization_id: uuid.UUID,
    user: User,
    employee_id: uuid.UUID,
    payload: AIEmployeeChatRequest,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> AIEmployeeChatResponse:
    """Run one chat turn with an active AI employee and persist the conversation."""
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=organization_id,
    )
    _validate_employee_is_active(employee)

    assignments = list_knowledge_assignments(db, employee=employee)
    if not assignments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI employee has no assigned knowledge documents",
        )

    document_ids = [assignment.knowledge_document_id for assignment in assignments]
    conversation, prior_history = _resolve_conversation(
        db,
        organization_id=organization_id,
        employee=employee,
        user=user,
        conversation_id=payload.conversation_id,
    )

    answer, sources = employee_rag_service.answer_for_employee(
        organization_id=organization_id,
        system_prompt=employee.system_prompt,
        question=payload.message,
        document_ids=document_ids,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        conversation_history=prior_history,
    )

    user_message = AIEmployeeMessage(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=payload.message,
    )
    assistant_message = AIEmployeeMessage(
        conversation_id=conversation.id,
        role=MessageRole.ASSISTANT,
        content=answer,
        sources=citations_to_json(sources) or None,
    )
    db.add(user_message)
    db.add(assistant_message)

    if conversation.title is None:
        conversation.title = payload.message[:CONVERSATION_TITLE_MAX_LENGTH]

    db.commit()
    db.refresh(conversation)

    return AIEmployeeChatResponse(
        conversation_id=conversation.id,
        employee_id=employee.id,
        employee_name=employee.name,
        answer=answer,
        sources=sources,
    )


def _validate_employee_is_active(employee: AIEmployee) -> None:
    if employee.status != AIEmployeeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI employee is not active",
        )


def _resolve_conversation(
    db: Session,
    *,
    organization_id: uuid.UUID,
    employee: AIEmployee,
    user: User,
    conversation_id: uuid.UUID | None,
) -> tuple[AIEmployeeConversation, list[tuple[str, str]]]:
    if conversation_id is None:
        conversation = AIEmployeeConversation(
            organization_id=organization_id,
            ai_employee_id=employee.id,
            user_id=user.id,
        )
        db.add(conversation)
        db.flush()
        return conversation, []

    conversation = db.scalar(
        select(AIEmployeeConversation)
        .where(
            AIEmployeeConversation.id == conversation_id,
            AIEmployeeConversation.organization_id == organization_id,
            AIEmployeeConversation.ai_employee_id == employee.id,
            AIEmployeeConversation.user_id == user.id,
        )
        .options(selectinload(AIEmployeeConversation.messages))
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    history = [
        (message.role.value, message.content)
        for message in conversation.messages[-MAX_CONVERSATION_HISTORY_MESSAGES:]
    ]
    return conversation, history
