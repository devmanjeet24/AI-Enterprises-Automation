"""Public website chat widget service (unauthenticated)."""

import secrets
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.enums import (
    OmnichannelAuditAction,
    OmnichannelChannelType,
    OmnichannelConversationStatus,
    OmnichannelHandoffStatus,
    OmnichannelMessageRole,
)
from app.models.omnichannel_channel import OmnichannelChannel
from app.models.omnichannel_conversation import OmnichannelConversation
from app.models.omnichannel_message import OmnichannelMessage
from app.services.omnichannel_audit_service import record_omnichannel_audit
from app.services.omnichannel_event_bus import publish_omnichannel_event_sync


def _trigger_auto_reply(
    db: Session,
    *,
    conversation: OmnichannelConversation,
    channel: OmnichannelChannel,
) -> None:
    from app.services.omnichannel_conversation_service import (
        maybe_auto_reply_after_customer_message,
    )

    maybe_auto_reply_after_customer_message(
        db,
        conversation=conversation,
        channel=channel,
    )


def generate_channel_public_key() -> str:
    return secrets.token_urlsafe(24)


def get_channel_by_public_key(db: Session, *, public_key: str) -> OmnichannelChannel:
    channel = db.scalar(
        select(OmnichannelChannel).where(
            OmnichannelChannel.public_key == public_key,
            OmnichannelChannel.is_active.is_(True),
        )
    )
    if channel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Widget not found")
    if channel.channel_type != OmnichannelChannelType.WEBSITE_CHAT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Widget is only available for website chat channels",
        )
    return channel


def _ensure_widget_conversation_active(conversation: OmnichannelConversation) -> None:
    if conversation.deleted_at is not None or conversation.archived_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")


def get_widget_config(channel: OmnichannelChannel) -> dict[str, str | None]:
    config = channel.config or {}
    return {
        "channel_name": channel.name,
        "greeting": config.get("greeting", "Hi! How can we help you today?"),
        "accent_color": config.get("accent_color", "#7c3aed"),
    }


def _apply_visitor_contact(
    conversation: OmnichannelConversation,
    *,
    visitor_name: str | None,
    visitor_email: str | None,
) -> None:
    if visitor_name:
        conversation.external_contact_name = visitor_name
        conversation.subject = f"Chat with {visitor_name}"[:255]
    if visitor_email:
        shared_context = dict(conversation.shared_context or {})
        shared_context["email"] = visitor_email
        conversation.shared_context = shared_context


def start_widget_conversation(
    db: Session,
    *,
    channel: OmnichannelChannel,
    visitor_name: str | None,
    visitor_email: str | None,
    initial_message: str | None = None,
    visitor_id: str | None = None,
) -> OmnichannelConversation:
    subject = f"Chat with {visitor_name or 'Website Visitor'}"
    slug_base = slugify(subject) or "website-chat"
    slug = f"{slug_base}-{secrets.token_hex(3)}"

    shared_context: dict[str, str] = {}
    if visitor_email:
        shared_context["email"] = visitor_email

    conversation = OmnichannelConversation(
        organization_id=channel.organization_id,
        channel_id=channel.id,
        subject=subject[:255],
        slug=slug[:50],
        external_contact_name=visitor_name,
        external_contact_id=visitor_id,
        assigned_ai_employee_id=channel.ai_employee_id,
        shared_context=shared_context or None,
        status=OmnichannelConversationStatus.OPEN,
        handoff_status=OmnichannelHandoffStatus.NONE,
    )
    db.add(conversation)
    db.flush()

    if initial_message:
        message = OmnichannelMessage(
            conversation_id=conversation.id,
            role=OmnichannelMessageRole.CUSTOMER,
            content=initial_message,
        )
        db.add(message)
        conversation.last_message_at = datetime.now(UTC)

        record_omnichannel_audit(
            db,
            organization_id=channel.organization_id,
            conversation_id=conversation.id,
            channel_id=channel.id,
            action=OmnichannelAuditAction.WIDGET_MESSAGE,
            details={"direction": "inbound", "source": "widget"},
        )
        db.commit()
        db.refresh(conversation)
        publish_omnichannel_event_sync(
            channel.organization_id,
            "message_created",
            {
                "conversation_id": str(conversation.id),
                "message": "New omnichannel message received",
            },
        )
        _trigger_auto_reply(db, conversation=conversation, channel=channel)
    else:
        record_omnichannel_audit(
            db,
            organization_id=channel.organization_id,
            conversation_id=conversation.id,
            channel_id=channel.id,
            action=OmnichannelAuditAction.WIDGET_MESSAGE,
            details={"direction": "inbound", "source": "widget", "prechat_only": True},
        )
        db.commit()
        db.refresh(conversation)

    return conversation


def add_widget_message(
    db: Session,
    *,
    channel: OmnichannelChannel,
    conversation_id: uuid.UUID,
    content: str,
    role: OmnichannelMessageRole = OmnichannelMessageRole.CUSTOMER,
) -> OmnichannelMessage:
    conversation = db.scalar(
        select(OmnichannelConversation).where(
            OmnichannelConversation.id == conversation_id,
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.organization_id == channel.organization_id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_widget_conversation_active(conversation)

    message = OmnichannelMessage(
        conversation_id=conversation.id,
        role=role,
        content=content,
    )
    db.add(message)
    conversation.last_message_at = datetime.now(UTC)
    if role == OmnichannelMessageRole.CUSTOMER:
        conversation.status = OmnichannelConversationStatus.OPEN

    record_omnichannel_audit(
        db,
        organization_id=channel.organization_id,
        conversation_id=conversation.id,
        channel_id=channel.id,
        action=OmnichannelAuditAction.WIDGET_MESSAGE,
        details={"direction": "inbound" if role == OmnichannelMessageRole.CUSTOMER else "outbound"},
    )
    db.commit()
    db.refresh(message)
    if role == OmnichannelMessageRole.CUSTOMER:
        publish_omnichannel_event_sync(
            channel.organization_id,
            "message_created",
            {
                "conversation_id": str(conversation.id),
                "message_id": str(message.id),
                "message": "New omnichannel message received",
            },
        )
        _trigger_auto_reply(db, conversation=conversation, channel=channel)
    return message


def update_widget_visitor_contact(
    db: Session,
    *,
    channel: OmnichannelChannel,
    conversation_id: uuid.UUID,
    visitor_name: str | None,
    visitor_email: str | None,
) -> OmnichannelConversation:
    conversation = db.scalar(
        select(OmnichannelConversation).where(
            OmnichannelConversation.id == conversation_id,
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.organization_id == channel.organization_id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_widget_conversation_active(conversation)

    _apply_visitor_contact(
        conversation,
        visitor_name=visitor_name,
        visitor_email=visitor_email,
    )
    db.commit()
    db.refresh(conversation)
    return conversation


def request_widget_handoff(
    db: Session,
    *,
    channel: OmnichannelChannel,
    conversation_id: uuid.UUID,
) -> OmnichannelConversation:
    from app.services.omnichannel_conversation_service import request_human_handoff

    conversation = db.scalar(
        select(OmnichannelConversation).where(
            OmnichannelConversation.id == conversation_id,
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.organization_id == channel.organization_id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_widget_conversation_active(conversation)

    if conversation.handoff_status != OmnichannelHandoffStatus.NONE:
        return conversation

    system_message = OmnichannelMessage(
        conversation_id=conversation.id,
        role=OmnichannelMessageRole.SYSTEM,
        content="Visitor requested to speak with a human agent.",
    )
    db.add(system_message)
    conversation.last_message_at = datetime.now(UTC)

    request_human_handoff(
        db,
        conversation=conversation,
        actor_user_id=None,
        create_ticket=False,
    )
    publish_omnichannel_event_sync(
        channel.organization_id,
        "message_created",
        {
            "conversation_id": str(conversation.id),
            "message": "Visitor requested human handoff",
        },
    )
    return conversation


def get_widget_conversation(
    db: Session,
    *,
    channel: OmnichannelChannel,
    conversation_id: uuid.UUID,
) -> OmnichannelConversation:
    conversation = db.scalar(
        select(OmnichannelConversation).where(
            OmnichannelConversation.id == conversation_id,
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.organization_id == channel.organization_id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_widget_conversation_active(conversation)
    return conversation


def list_widget_messages(
    db: Session,
    *,
    channel: OmnichannelChannel,
    conversation_id: uuid.UUID,
) -> list[OmnichannelMessage]:
    conversation = db.scalar(
        select(OmnichannelConversation).where(
            OmnichannelConversation.id == conversation_id,
            OmnichannelConversation.channel_id == channel.id,
        )
    )
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    _ensure_widget_conversation_active(conversation)

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
