"""Omnichannel conversation, message, and inbox endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.config import Settings, get_settings
from app.core.authorization import require_permission
from app.core.permissions import (
    OMNICHANNEL_CONVERSATIONS_DELETE,
    OMNICHANNEL_CONVERSATIONS_EXECUTE,
    OMNICHANNEL_CONVERSATIONS_READ,
    OMNICHANNEL_CONVERSATIONS_WRITE,
)
from app.models.enums import OmnichannelChannelType, OmnichannelConversationStatus
from app.models.user import User
from app.schemas.omnichannel_conversation import (
    OmnichannelAiSuggestionResponse,
    OmnichannelConversationCreateRequest,
    OmnichannelConversationDetailResponse,
    OmnichannelConversationResponse,
    OmnichannelConversationUpdateRequest,
    OmnichannelInboxItemResponse,
    OmnichannelMessageCreateRequest,
    OmnichannelMessageResponse,
)
from app.services.chroma_service import ChromaService
from app.services.employee_rag_service import EmployeeRAGService
from app.services.embedding_service import EmbeddingService
from app.services.omnichannel_conversation_service import (
    build_conversation_detail_response,
    create_conversation_message,
    create_omnichannel_conversation,
    delete_omnichannel_conversation,
    get_omnichannel_conversation_or_404,
    list_conversation_messages,
    list_omnichannel_conversations,
    request_human_handoff,
    suggest_ai_response,
    update_omnichannel_conversation,
)
from app.services.omnichannel_inbox_service import list_unified_inbox
from app.services.retrieval_service import get_cached_embedding_service

router = APIRouter(prefix="/omnichannel-conversations", tags=["omnichannel-conversations"])


def get_embedding_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmbeddingService:
    return get_cached_embedding_service(settings.embedding_model_name)


def get_chroma_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> ChromaService:
    return ChromaService(settings.chroma_persist_dir)


def get_employee_rag_service(
    settings: Annotated[Settings, Depends(get_settings)],
) -> EmployeeRAGService:
    return EmployeeRAGService(settings)


@router.get("/inbox", response_model=list[OmnichannelInboxItemResponse])
def list_unified_inbox_endpoint(
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
    channel_id: Annotated[uuid.UUID | None, Query()] = None,
    channel_type: Annotated[OmnichannelChannelType | None, Query()] = None,
    status: Annotated[OmnichannelConversationStatus | None, Query()] = None,
    unassigned_only: Annotated[bool, Query()] = False,
) -> list[OmnichannelInboxItemResponse]:
    """List conversations for the unified omnichannel inbox."""
    return list_unified_inbox(
        db,
        organization_id=current_user.organization_id,
        channel_id=channel_id,
        channel_type=channel_type,
        status=status,
        unassigned_only=unassigned_only,
    )


@router.post("", response_model=OmnichannelConversationResponse, status_code=status.HTTP_201_CREATED)
def create_omnichannel_conversation_endpoint(
    payload: OmnichannelConversationCreateRequest,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelConversationResponse:
    """Create an omnichannel conversation."""
    return create_omnichannel_conversation(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[OmnichannelConversationResponse])
def list_omnichannel_conversations_endpoint(
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
    channel_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[OmnichannelConversationResponse]:
    """List omnichannel conversations in the current organization."""
    return list_omnichannel_conversations(
        db,
        organization_id=current_user.organization_id,
        channel_id=channel_id,
    )


@router.get("/{conversation_id}", response_model=OmnichannelConversationDetailResponse)
def get_omnichannel_conversation_endpoint(
    conversation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelConversationDetailResponse:
    """Get one omnichannel conversation with message history."""
    conversation = get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
    )
    return build_conversation_detail_response(db, conversation=conversation)


@router.patch("/{conversation_id}", response_model=OmnichannelConversationResponse)
def update_omnichannel_conversation_endpoint(
    conversation_id: uuid.UUID,
    payload: OmnichannelConversationUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelConversationResponse:
    """Update an omnichannel conversation including handoff status."""
    conversation = get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
    )
    return update_omnichannel_conversation(
        db,
        conversation=conversation,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_omnichannel_conversation_endpoint(
    conversation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete an omnichannel conversation."""
    conversation = get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
    )
    delete_omnichannel_conversation(db, conversation=conversation)


@router.get("/{conversation_id}/messages", response_model=list[OmnichannelMessageResponse])
def list_conversation_messages_endpoint(
    conversation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
    include_internal: Annotated[bool, Query()] = True,
) -> list[OmnichannelMessageResponse]:
    """List messages for an omnichannel conversation."""
    return list_conversation_messages(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
        include_internal=include_internal,
    )


@router.post(
    "/{conversation_id}/messages",
    response_model=OmnichannelMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_conversation_message_endpoint(
    conversation_id: uuid.UUID,
    payload: OmnichannelMessageCreateRequest,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelMessageResponse:
    """Add a message to an omnichannel conversation."""
    conversation = get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
    )
    return create_conversation_message(
        db,
        conversation=conversation,
        author_user_id=current_user.id,
        payload=payload,
    )


@router.post(
    "/{conversation_id}/suggest-response",
    response_model=OmnichannelAiSuggestionResponse,
)
def suggest_ai_response_endpoint(
    conversation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    embedding_service: Annotated[EmbeddingService, Depends(get_embedding_service)],
    chroma_service: Annotated[ChromaService, Depends(get_chroma_service)],
    employee_rag_service: Annotated[EmployeeRAGService, Depends(get_employee_rag_service)],
) -> OmnichannelAiSuggestionResponse:
    """Generate an AI-assisted response suggestion."""
    conversation = get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
    )
    return suggest_ai_response(
        db,
        settings=settings,
        conversation=conversation,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )


@router.post(
    "/{conversation_id}/handoff",
    response_model=OmnichannelConversationResponse,
)
def request_human_handoff_endpoint(
    conversation_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(OMNICHANNEL_CONVERSATIONS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
) -> OmnichannelConversationResponse:
    """Request human handoff for a conversation."""
    conversation = get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=current_user.organization_id,
    )
    return request_human_handoff(db, conversation=conversation)
