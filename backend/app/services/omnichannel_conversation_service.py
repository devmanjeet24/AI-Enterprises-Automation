"""Omnichannel conversation and message management."""

import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.config import Settings, get_settings
from app.core.text import slugify
from app.models.ai_employee import AIEmployee
from app.models.enums import (
    AIEmployeeStatus,
    OmnichannelAuditAction,
    OmnichannelConversationStatus,
    OmnichannelHandoffStatus,
    OmnichannelMessageRole,
)
from app.models.omnichannel_channel import OmnichannelChannel
from app.models.omnichannel_conversation import OmnichannelConversation
from app.models.omnichannel_message import OmnichannelMessage
from app.models.user import User
from app.schemas.omnichannel_conversation import (
    OmnichannelAiSuggestionResponse,
    OmnichannelConversationCreateRequest,
    OmnichannelConversationDetailResponse,
    OmnichannelConversationUpdateRequest,
    OmnichannelMessageCreateRequest,
    OmnichannelMessageResponse,
)
from app.services.ai_employee_service import get_employee_or_404, list_knowledge_assignments
from app.services.chroma_service import ChromaService
from app.services.employee_rag_service import EmployeeRAGService, citations_to_json
from app.services.embedding_service import EmbeddingService
from app.services.omnichannel_channel_service import get_omnichannel_channel_or_404
from app.services.omnichannel_audit_service import record_omnichannel_audit
from app.services.omnichannel_connector_service import deliver_outbound_message
from app.services.omnichannel_escalation_service import escalate_conversation_to_ticket
from app.services.omnichannel_event_bus import publish_omnichannel_event_sync
from app.services.rag_service import RAGService
from app.services.retrieval_service import get_cached_embedding_service

logger = logging.getLogger(__name__)

_RESOLUTION_ROLES = {
    OmnichannelMessageRole.AGENT,
    OmnichannelMessageRole.AI_ASSISTANT,
}
_TERMINAL_STATUSES = {
    OmnichannelConversationStatus.RESOLVED,
    OmnichannelConversationStatus.CLOSED,
}


async def _publish_event(
    organization_id: uuid.UUID,
    event: str,
    data: dict[str, Any],
) -> None:
    publish_omnichannel_event_sync(organization_id, event, data)


def _conversation_has_resolution(db: Session, *, conversation_id: uuid.UUID) -> bool:
    message = db.scalar(
        select(OmnichannelMessage)
        .where(
            OmnichannelMessage.conversation_id == conversation_id,
            OmnichannelMessage.is_internal.is_(False),
            OmnichannelMessage.role.in_(_RESOLUTION_ROLES),
        )
        .order_by(OmnichannelMessage.created_at.desc())
        .limit(1)
    )
    return message is not None


def _ensure_conversation_can_be_resolved(db: Session, *, conversation: OmnichannelConversation) -> None:
    if not _conversation_has_resolution(db, conversation_id=conversation.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Send a public agent or AI reply before resolving this conversation",
        )


def _resolve_slug(subject: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(subject)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_conversation_id: uuid.UUID | None = None,
) -> None:
    query = select(OmnichannelConversation.id).where(
        OmnichannelConversation.organization_id == organization_id,
        OmnichannelConversation.slug == slug,
        OmnichannelConversation.deleted_at.is_(None),
    )
    if exclude_conversation_id is not None:
        query = query.where(OmnichannelConversation.id != exclude_conversation_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Conversation slug '{slug}' is already taken in this organization",
        )


def _ensure_user_in_org(
    db: Session,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> User:
    user = db.scalar(
        select(User).where(
            User.id == user_id,
            User.organization_id == organization_id,
            User.is_active.is_(True),
        )
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assigned user not found in this organization",
        )
    return user


def get_omnichannel_conversation_or_404(
    db: Session,
    *,
    conversation_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> OmnichannelConversation:
    conversation = _get_omnichannel_conversation_in_org(
        db,
        conversation_id=conversation_id,
        organization_id=organization_id,
        exclude_deleted=True,
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Omnichannel conversation not found",
        )
    return conversation


def get_omnichannel_conversation_for_audit_or_404(
    db: Session,
    *,
    conversation_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> OmnichannelConversation:
    """Load a conversation for audit reads, including soft-deleted rows."""
    conversation = _get_omnichannel_conversation_in_org(
        db,
        conversation_id=conversation_id,
        organization_id=organization_id,
        exclude_deleted=False,
    )
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Omnichannel conversation not found",
        )
    return conversation


def _get_omnichannel_conversation_in_org(
    db: Session,
    *,
    conversation_id: uuid.UUID,
    organization_id: uuid.UUID,
    exclude_deleted: bool,
) -> OmnichannelConversation | None:
    query = select(OmnichannelConversation).where(
        OmnichannelConversation.id == conversation_id,
        OmnichannelConversation.organization_id == organization_id,
    )
    if exclude_deleted:
        query = query.where(OmnichannelConversation.deleted_at.is_(None))
    return db.scalar(query)


def list_omnichannel_conversations(
    db: Session,
    *,
    organization_id: uuid.UUID,
    channel_id: uuid.UUID | None = None,
) -> list[OmnichannelConversation]:
    query = select(OmnichannelConversation).where(
        OmnichannelConversation.organization_id == organization_id,
        OmnichannelConversation.deleted_at.is_(None),
        OmnichannelConversation.archived_at.is_(None),
    )
    if channel_id is not None:
        query = query.where(OmnichannelConversation.channel_id == channel_id)
    return list(
        db.scalars(query.order_by(OmnichannelConversation.created_at.desc())).all()
    )


def create_omnichannel_conversation(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: OmnichannelConversationCreateRequest,
) -> OmnichannelConversation:
    channel = get_omnichannel_channel_or_404(
        db,
        channel_id=payload.channel_id,
        organization_id=organization_id,
    )
    if not channel.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Channel must be active to create a conversation",
        )

    assigned_ai_employee_id = payload.assigned_ai_employee_id or channel.ai_employee_id
    if assigned_ai_employee_id is not None:
        employee = get_employee_or_404(
            db,
            employee_id=assigned_ai_employee_id,
            organization_id=organization_id,
        )
        if employee.status != AIEmployeeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned AI employee must be active",
            )

    if payload.assigned_user_id is not None:
        _ensure_user_in_org(
            db,
            user_id=payload.assigned_user_id,
            organization_id=organization_id,
        )

    slug = _resolve_slug(payload.subject, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    conversation = OmnichannelConversation(
        organization_id=organization_id,
        channel_id=payload.channel_id,
        created_by_id=created_by_id,
        subject=payload.subject,
        slug=slug,
        external_contact_name=payload.external_contact_name,
        external_contact_id=payload.external_contact_id,
        assigned_user_id=payload.assigned_user_id,
        assigned_ai_employee_id=assigned_ai_employee_id,
        shared_context=payload.shared_context,
        status=OmnichannelConversationStatus.OPEN,
        handoff_status=OmnichannelHandoffStatus.NONE,
    )
    db.add(conversation)
    db.flush()

    if payload.initial_message:
        message = OmnichannelMessage(
            conversation_id=conversation.id,
            author_user_id=created_by_id,
            role=OmnichannelMessageRole.CUSTOMER,
            content=payload.initial_message,
        )
        db.add(message)
        conversation.last_message_at = datetime.now(UTC)

    record_omnichannel_audit(
        db,
        organization_id=organization_id,
        conversation_id=conversation.id,
        channel_id=payload.channel_id,
        actor_user_id=created_by_id,
        action=OmnichannelAuditAction.CONVERSATION_CREATED,
    )

    db.commit()
    db.refresh(conversation)
    publish_omnichannel_event_sync(
        organization_id,
        "conversation_created",
        {"conversation_id": str(conversation.id)},
    )
    return conversation


def update_omnichannel_conversation(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    organization_id: uuid.UUID,
    payload: OmnichannelConversationUpdateRequest,
    actor_user_id: uuid.UUID | None = None,
) -> OmnichannelConversation:
    updates = payload.model_dump(exclude_unset=True)
    archive_update = updates.pop("is_archived", None)

    if archive_update is not None:
        if archive_update:
            if conversation.archived_at is None:
                conversation.archived_at = datetime.now(UTC)
                conversation.archived_by_id = actor_user_id
                record_omnichannel_audit(
                    db,
                    organization_id=organization_id,
                    conversation_id=conversation.id,
                    channel_id=conversation.channel_id,
                    actor_user_id=actor_user_id,
                    action=OmnichannelAuditAction.CONVERSATION_ARCHIVED,
                )
        elif conversation.archived_at is not None:
            conversation.archived_at = None
            conversation.archived_by_id = None
            record_omnichannel_audit(
                db,
                organization_id=organization_id,
                conversation_id=conversation.id,
                channel_id=conversation.channel_id,
                actor_user_id=actor_user_id,
                action=OmnichannelAuditAction.CONVERSATION_UNARCHIVED,
            )

    if updates.get("status") in _TERMINAL_STATUSES:
        _ensure_conversation_can_be_resolved(db, conversation=conversation)

    previous_status = conversation.status
    previous_assigned_user = conversation.assigned_user_id

    if "assigned_ai_employee_id" in updates and updates["assigned_ai_employee_id"] is not None:
        employee = get_employee_or_404(
            db,
            employee_id=updates["assigned_ai_employee_id"],
            organization_id=organization_id,
        )
        if employee.status != AIEmployeeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned AI employee must be active",
            )

    if "assigned_user_id" in updates and updates["assigned_user_id"] is not None:
        _ensure_user_in_org(
            db,
            user_id=updates["assigned_user_id"],
            organization_id=organization_id,
        )

    for field in (
        "subject",
        "external_contact_name",
        "external_contact_id",
        "status",
        "handoff_status",
        "assigned_user_id",
        "assigned_ai_employee_id",
        "shared_context",
    ):
        if field in updates:
            setattr(conversation, field, updates[field])

    if "handoff_status" in updates:
        handoff = updates["handoff_status"]
        if handoff == OmnichannelHandoffStatus.REQUESTED:
            conversation.status = OmnichannelConversationStatus.WAITING_HUMAN
        elif handoff == OmnichannelHandoffStatus.ASSIGNED:
            conversation.status = OmnichannelConversationStatus.WAITING_HUMAN
        elif handoff == OmnichannelHandoffStatus.COMPLETED:
            if conversation.status == OmnichannelConversationStatus.WAITING_HUMAN:
                conversation.status = OmnichannelConversationStatus.OPEN

    if "status" in updates:
        new_status = updates["status"]
        if new_status == OmnichannelConversationStatus.RESOLVED:
            conversation.resolved_at = datetime.now(UTC)
        elif new_status in {OmnichannelConversationStatus.OPEN, OmnichannelConversationStatus.AI_HANDLING}:
            if previous_status in _TERMINAL_STATUSES:
                conversation.reopened_at = datetime.now(UTC)
                conversation.resolved_at = None

    if "assigned_user_id" in updates and updates["assigned_user_id"] != previous_assigned_user:
        if updates["assigned_user_id"] is not None:
            conversation.handoff_status = OmnichannelHandoffStatus.ASSIGNED
            record_omnichannel_audit(
                db,
                organization_id=organization_id,
                conversation_id=conversation.id,
                channel_id=conversation.channel_id,
                action=OmnichannelAuditAction.AGENT_ASSIGNED,
                details={"assigned_user_id": str(updates["assigned_user_id"])},
            )

    if "status" in updates and updates["status"] != previous_status:
        record_omnichannel_audit(
            db,
            organization_id=organization_id,
            conversation_id=conversation.id,
            channel_id=conversation.channel_id,
            action=OmnichannelAuditAction.STATUS_CHANGED,
            details={
                "from": previous_status.value,
                "to": updates["status"].value,
            },
        )

    if "slug" in updates or "subject" in updates:
        slug = _resolve_slug(
            updates.get("subject", conversation.subject),
            updates.get("slug", conversation.slug),
        )
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_conversation_id=conversation.id,
        )
        conversation.slug = slug

    db.commit()
    db.refresh(conversation)
    publish_omnichannel_event_sync(
        organization_id,
        "conversation_updated",
        {"conversation_id": str(conversation.id)},
    )
    return conversation


def delete_omnichannel_conversation(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    organization_id: uuid.UUID,
    actor_user_id: uuid.UUID,
) -> None:
    if conversation.deleted_at is not None:
        return

    conversation.deleted_at = datetime.now(UTC)
    conversation.deleted_by_id = actor_user_id
    record_omnichannel_audit(
        db,
        organization_id=organization_id,
        conversation_id=conversation.id,
        channel_id=conversation.channel_id,
        actor_user_id=actor_user_id,
        action=OmnichannelAuditAction.CONVERSATION_DELETED,
        details={
            "subject": conversation.subject,
            "status": conversation.status.value,
        },
    )
    db.commit()
    publish_omnichannel_event_sync(
        organization_id,
        "conversation_deleted",
        {"conversation_id": str(conversation.id)},
    )


def _get_bulk_conversations(
    db: Session,
    *,
    organization_id: uuid.UUID,
    conversation_ids: list[uuid.UUID],
) -> list[OmnichannelConversation]:
    if not conversation_ids:
        return []

    conversations = list(
        db.scalars(
            select(OmnichannelConversation).where(
                OmnichannelConversation.organization_id == organization_id,
                OmnichannelConversation.id.in_(conversation_ids),
                OmnichannelConversation.deleted_at.is_(None),
            )
        ).all()
    )
    return conversations


def bulk_archive_omnichannel_conversations(
    db: Session,
    *,
    organization_id: uuid.UUID,
    conversation_ids: list[uuid.UUID],
    actor_user_id: uuid.UUID,
) -> list[uuid.UUID]:
    affected: list[uuid.UUID] = []
    for conversation in _get_bulk_conversations(
        db,
        organization_id=organization_id,
        conversation_ids=conversation_ids,
    ):
        if conversation.archived_at is not None:
            continue
        conversation.archived_at = datetime.now(UTC)
        conversation.archived_by_id = actor_user_id
        record_omnichannel_audit(
            db,
            organization_id=organization_id,
            conversation_id=conversation.id,
            channel_id=conversation.channel_id,
            actor_user_id=actor_user_id,
            action=OmnichannelAuditAction.CONVERSATION_ARCHIVED,
        )
        affected.append(conversation.id)

    if affected:
        db.commit()
        for conversation_id in affected:
            publish_omnichannel_event_sync(
                organization_id,
                "conversation_updated",
                {"conversation_id": str(conversation_id)},
            )
    return affected


def bulk_delete_omnichannel_conversations(
    db: Session,
    *,
    organization_id: uuid.UUID,
    conversation_ids: list[uuid.UUID],
    actor_user_id: uuid.UUID,
) -> list[uuid.UUID]:
    affected: list[uuid.UUID] = []
    now = datetime.now(UTC)
    for conversation in _get_bulk_conversations(
        db,
        organization_id=organization_id,
        conversation_ids=conversation_ids,
    ):
        conversation.deleted_at = now
        conversation.deleted_by_id = actor_user_id
        record_omnichannel_audit(
            db,
            organization_id=organization_id,
            conversation_id=conversation.id,
            channel_id=conversation.channel_id,
            actor_user_id=actor_user_id,
            action=OmnichannelAuditAction.CONVERSATION_DELETED,
            details={
                "subject": conversation.subject,
                "status": conversation.status.value,
            },
        )
        affected.append(conversation.id)

    if affected:
        db.commit()
        for conversation_id in affected:
            publish_omnichannel_event_sync(
                organization_id,
                "conversation_deleted",
                {"conversation_id": str(conversation_id)},
            )
    return affected


def list_conversation_messages(
    db: Session,
    *,
    conversation_id: uuid.UUID,
    organization_id: uuid.UUID,
    include_internal: bool = True,
) -> list[OmnichannelMessageResponse]:
    get_omnichannel_conversation_or_404(
        db,
        conversation_id=conversation_id,
        organization_id=organization_id,
    )
    query = select(OmnichannelMessage).where(
        OmnichannelMessage.conversation_id == conversation_id,
    )
    if not include_internal:
        query = query.where(OmnichannelMessage.is_internal.is_(False))

    messages = list(
        db.scalars(query.order_by(OmnichannelMessage.created_at.asc())).all()
    )
    return [_build_message_response(db, message=message) for message in messages]


def create_conversation_message(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    author_user_id: uuid.UUID,
    payload: OmnichannelMessageCreateRequest,
) -> OmnichannelMessageResponse:
    if payload.role == OmnichannelMessageRole.AI_ASSISTANT:
        if conversation.assigned_ai_employee_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Conversation must have an assigned AI employee for AI assistant messages",
            )
        author_ai_employee_id = conversation.assigned_ai_employee_id
        author_user_id_value = None
    else:
        author_ai_employee_id = None
        author_user_id_value = author_user_id

    message = OmnichannelMessage(
        conversation_id=conversation.id,
        author_user_id=author_user_id_value,
        author_ai_employee_id=author_ai_employee_id,
        role=payload.role,
        content=payload.content,
        is_internal=payload.is_internal,
    )
    db.add(message)
    conversation.last_message_at = datetime.now(UTC)
    if payload.role == OmnichannelMessageRole.CUSTOMER:
        conversation.status = OmnichannelConversationStatus.OPEN
    elif payload.role in _RESOLUTION_ROLES and not payload.is_internal:
        if conversation.handoff_status == OmnichannelHandoffStatus.NONE:
            conversation.status = OmnichannelConversationStatus.AI_HANDLING

    channel = db.get(OmnichannelChannel, conversation.channel_id)

    record_omnichannel_audit(
        db,
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        channel_id=conversation.channel_id,
        actor_user_id=author_user_id,
        action=OmnichannelAuditAction.MESSAGE_SENT,
        details={"role": payload.role.value, "is_internal": payload.is_internal},
    )

    db.commit()
    db.refresh(message)

    if channel is not None and payload.role in _RESOLUTION_ROLES and not payload.is_internal:
        deliver_outbound_message(channel=channel, conversation=conversation, message=message)

    publish_omnichannel_event_sync(
        conversation.organization_id,
        "message_created",
        {
            "conversation_id": str(conversation.id),
            "message_id": str(message.id),
            "message": "New omnichannel message received",
        },
    )

    return _build_message_response(db, message=message)


def suggest_ai_response(
    db: Session,
    *,
    settings: Settings,
    conversation: OmnichannelConversation,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> OmnichannelAiSuggestionResponse:
    """Generate an AI-assisted response suggestion without persisting it."""
    employee_id = conversation.assigned_ai_employee_id
    if employee_id is None:
        channel = db.get(OmnichannelChannel, conversation.channel_id)
        employee_id = channel.ai_employee_id if channel else None

    if employee_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No AI employee is linked to this conversation or channel",
        )

    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=conversation.organization_id,
    )

    messages = list(
        db.scalars(
            select(OmnichannelMessage)
            .where(
                OmnichannelMessage.conversation_id == conversation.id,
                OmnichannelMessage.is_internal.is_(False),
            )
            .order_by(OmnichannelMessage.created_at.asc())
        ).all()
    )

    if not messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Conversation has no messages to respond to",
        )

    latest_customer = next(
        (
            message.content
            for message in reversed(messages)
            if message.role == OmnichannelMessageRole.CUSTOMER
        ),
        messages[-1].content,
    )

    history = [
        (message.role.value, message.content)
        for message in messages[-10:]
        if message.role
        in {
            OmnichannelMessageRole.CUSTOMER,
            OmnichannelMessageRole.AGENT,
            OmnichannelMessageRole.AI_ASSISTANT,
        }
    ]

    answer, sources = _generate_ai_response(
        db=db,
        settings=settings,
        employee=employee,
        question=latest_customer,
        conversation_history=history,
        shared_context=conversation.shared_context,
        embedding_service=embedding_service,
        chroma_service=chroma_service,
        employee_rag_service=employee_rag_service,
    )

    return OmnichannelAiSuggestionResponse(
        suggestion=answer,
        sources=citations_to_json(sources) or [],
    )


def _conversation_auto_reply_eligible(
    *,
    conversation: OmnichannelConversation,
    channel: OmnichannelChannel | None,
) -> bool:
    if channel is not None and not channel.is_active:
        return False
    if conversation.handoff_status in {
        OmnichannelHandoffStatus.REQUESTED,
        OmnichannelHandoffStatus.ASSIGNED,
    }:
        return False
    if conversation.assigned_user_id is not None:
        return False
    if conversation.status in {
        OmnichannelConversationStatus.WAITING_HUMAN,
        OmnichannelConversationStatus.RESOLVED,
        OmnichannelConversationStatus.CLOSED,
    }:
        return False
    return True


def _resolve_ai_employee_id(
    db: Session,
    *,
    conversation: OmnichannelConversation,
) -> uuid.UUID | None:
    employee_id = conversation.assigned_ai_employee_id
    if employee_id is None:
        channel = db.get(OmnichannelChannel, conversation.channel_id)
        employee_id = channel.ai_employee_id if channel else None
    return employee_id


def _load_public_conversation_messages(
    db: Session,
    *,
    conversation_id: uuid.UUID,
) -> list[OmnichannelMessage]:
    return list(
        db.scalars(
            select(OmnichannelMessage)
            .where(
                OmnichannelMessage.conversation_id == conversation_id,
                OmnichannelMessage.is_internal.is_(False),
            )
            .order_by(OmnichannelMessage.created_at.asc())
        ).all()
    )


def maybe_auto_reply_after_customer_message(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    channel: OmnichannelChannel | None = None,
    settings: Settings | None = None,
    embedding_service: EmbeddingService | None = None,
    chroma_service: ChromaService | None = None,
    employee_rag_service: EmployeeRAGService | None = None,
) -> OmnichannelMessage | None:
    """Generate, persist, and deliver an AI assistant reply after a customer message."""
    if channel is None:
        channel = db.get(OmnichannelChannel, conversation.channel_id)
    if not _conversation_auto_reply_eligible(conversation=conversation, channel=channel):
        return None

    employee_id = _resolve_ai_employee_id(db, conversation=conversation)
    if employee_id is None:
        return None

    employee = db.scalar(
        select(AIEmployee).where(
            AIEmployee.id == employee_id,
            AIEmployee.organization_id == conversation.organization_id,
            AIEmployee.status == AIEmployeeStatus.ACTIVE,
        )
    )
    if employee is None:
        return None

    messages = _load_public_conversation_messages(db, conversation_id=conversation.id)
    if not messages:
        return None

    latest_customer = next(
        (
            message.content
            for message in reversed(messages)
            if message.role == OmnichannelMessageRole.CUSTOMER
        ),
        None,
    )
    if latest_customer is None:
        return None

    history = [
        (message.role.value, message.content)
        for message in messages[-10:]
        if message.role
        in {
            OmnichannelMessageRole.CUSTOMER,
            OmnichannelMessageRole.AGENT,
            OmnichannelMessageRole.AI_ASSISTANT,
        }
    ]

    resolved_settings = settings or get_settings()
    resolved_embedding = embedding_service or get_cached_embedding_service(
        resolved_settings.embedding_model_name
    )
    resolved_chroma = chroma_service or ChromaService(resolved_settings.chroma_persist_dir)
    resolved_rag = employee_rag_service or EmployeeRAGService(resolved_settings)

    try:
        answer, _sources = _generate_ai_response(
            db=db,
            settings=resolved_settings,
            employee=employee,
            question=latest_customer,
            conversation_history=history,
            shared_context=conversation.shared_context,
            embedding_service=resolved_embedding,
            chroma_service=resolved_chroma,
            employee_rag_service=resolved_rag,
        )
    except Exception:
        logger.exception(
            "Auto AI reply failed for omnichannel conversation %s",
            conversation.id,
        )
        return None

    answer = answer.strip()
    if not answer:
        return None

    ai_message = OmnichannelMessage(
        conversation_id=conversation.id,
        author_ai_employee_id=employee.id,
        role=OmnichannelMessageRole.AI_ASSISTANT,
        content=answer,
    )
    db.add(ai_message)
    conversation.last_message_at = datetime.now(UTC)
    if conversation.handoff_status == OmnichannelHandoffStatus.NONE:
        conversation.status = OmnichannelConversationStatus.AI_HANDLING

    record_omnichannel_audit(
        db,
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        channel_id=conversation.channel_id,
        action=OmnichannelAuditAction.MESSAGE_SENT,
        details={"role": OmnichannelMessageRole.AI_ASSISTANT.value, "auto_reply": True},
    )
    db.commit()
    db.refresh(ai_message)

    if channel is not None:
        deliver_outbound_message(channel=channel, conversation=conversation, message=ai_message)

    publish_omnichannel_event_sync(
        conversation.organization_id,
        "message_created",
        {
            "conversation_id": str(conversation.id),
            "message_id": str(ai_message.id),
            "message": "AI assistant replied automatically",
            "auto_reply": True,
        },
    )
    return ai_message


def request_human_handoff(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    actor_user_id: uuid.UUID | None = None,
    create_ticket: bool = True,
) -> OmnichannelConversation:
    conversation.handoff_status = OmnichannelHandoffStatus.REQUESTED
    conversation.status = OmnichannelConversationStatus.WAITING_HUMAN
    record_omnichannel_audit(
        db,
        organization_id=conversation.organization_id,
        conversation_id=conversation.id,
        channel_id=conversation.channel_id,
        actor_user_id=actor_user_id,
        action=OmnichannelAuditAction.HANDOFF_REQUESTED,
    )
    if create_ticket and actor_user_id is not None:
        escalate_conversation_to_ticket(
            db,
            conversation=conversation,
            created_by_id=actor_user_id,
        )
    else:
        db.commit()
    db.refresh(conversation)
    publish_omnichannel_event_sync(
        conversation.organization_id,
        "handoff_requested",
        {
            "conversation_id": str(conversation.id),
            "message": "Human handoff requested",
        },
    )
    return conversation


def build_conversation_detail_response(
    db: Session,
    *,
    conversation: OmnichannelConversation,
) -> OmnichannelConversationDetailResponse:
    loaded = db.scalar(
        select(OmnichannelConversation)
        .where(OmnichannelConversation.id == conversation.id)
        .options(selectinload(OmnichannelConversation.messages))
    )
    if loaded is None:
        loaded = conversation

    channel = db.get(OmnichannelChannel, loaded.channel_id)
    assigned_user = (
        db.get(User, loaded.assigned_user_id) if loaded.assigned_user_id else None
    )
    assigned_employee = (
        db.get(AIEmployee, loaded.assigned_ai_employee_id)
        if loaded.assigned_ai_employee_id
        else None
    )

    return OmnichannelConversationDetailResponse(
        id=loaded.id,
        organization_id=loaded.organization_id,
        channel_id=loaded.channel_id,
        created_by_id=loaded.created_by_id,
        assigned_user_id=loaded.assigned_user_id,
        assigned_ai_employee_id=loaded.assigned_ai_employee_id,
        subject=loaded.subject,
        slug=loaded.slug,
        external_contact_name=loaded.external_contact_name,
        external_contact_id=loaded.external_contact_id,
        status=loaded.status,
        handoff_status=loaded.handoff_status,
        shared_context=loaded.shared_context,
        last_message_at=loaded.last_message_at,
        archived_at=loaded.archived_at,
        deleted_at=loaded.deleted_at,
        created_at=loaded.created_at,
        updated_at=loaded.updated_at,
        channel_name=channel.name if channel else None,
        channel_type=channel.channel_type.value if channel else None,
        assigned_user_name=(
            f"{assigned_user.first_name} {assigned_user.last_name}".strip()
            if assigned_user
            else None
        ),
        assigned_ai_employee_name=assigned_employee.name if assigned_employee else None,
        message_count=len(loaded.messages),
        has_resolution=_conversation_has_resolution(db, conversation_id=loaded.id),
        messages=[
            _build_message_response(db, message=message) for message in loaded.messages
        ],
    )


def _build_message_response(
    db: Session,
    *,
    message: OmnichannelMessage,
) -> OmnichannelMessageResponse:
    author_user_name = None
    if message.author_user_id:
        user = db.get(User, message.author_user_id)
        if user:
            author_user_name = f"{user.first_name} {user.last_name}".strip()

    author_ai_employee_name = None
    if message.author_ai_employee_id:
        employee = db.get(AIEmployee, message.author_ai_employee_id)
        if employee:
            author_ai_employee_name = employee.name

    return OmnichannelMessageResponse(
        id=message.id,
        conversation_id=message.conversation_id,
        author_user_id=message.author_user_id,
        author_ai_employee_id=message.author_ai_employee_id,
        role=message.role,
        content=message.content,
        is_internal=message.is_internal,
        metadata=message.metadata_,
        created_at=message.created_at,
        updated_at=message.updated_at,
        author_user_name=author_user_name,
        author_ai_employee_name=author_ai_employee_name,
    )


def _generate_ai_response(
    db: Session,
    *,
    settings: Settings,
    employee: AIEmployee,
    question: str,
    conversation_history: list[tuple[str, str]],
    shared_context: dict[str, Any] | None,
    embedding_service: EmbeddingService,
    chroma_service: ChromaService,
    employee_rag_service: EmployeeRAGService,
) -> tuple[str, list[Any]]:
    context_note = ""
    if shared_context:
        context_note = f"\nShared context: {shared_context}"

    assignments = list_knowledge_assignments(db, employee=employee)
    if assignments:
        document_ids = [assignment.knowledge_document_id for assignment in assignments]
        answer, sources = employee_rag_service.answer_for_employee(
            organization_id=employee.organization_id,
            system_prompt=f"{employee.system_prompt.strip()}{context_note}",
            question=question,
            document_ids=document_ids,
            embedding_service=embedding_service,
            chroma_service=chroma_service,
            conversation_history=conversation_history,
        )
        return answer, sources

    rag_service = RAGService(settings)
    prompt = (
        f"{employee.system_prompt.strip()}{context_note}\n\n"
        "You are assisting in an omnichannel customer conversation. "
        "Be concise, helpful, and professional."
    )
    answer = rag_service._generate_answer(
        question=question,
        context="No knowledge base documents are assigned to this employee.",
        system_prompt=prompt,
    )
    return answer, []
