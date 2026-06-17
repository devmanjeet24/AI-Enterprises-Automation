"""Process inbound webhook payloads from external channels."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

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
from app.services.omnichannel_channel_service import get_omnichannel_channel_or_404


def _find_or_create_conversation(
    db: Session,
    *,
    channel: OmnichannelChannel,
    external_contact_id: str,
    external_contact_name: str | None,
    subject: str,
) -> OmnichannelConversation:
    conversation = db.scalar(
        select(OmnichannelConversation)
        .where(
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.external_contact_id == external_contact_id,
            OmnichannelConversation.status.notin_(
                [
                    OmnichannelConversationStatus.RESOLVED,
                    OmnichannelConversationStatus.CLOSED,
                ]
            ),
        )
        .order_by(OmnichannelConversation.created_at.desc())
        .limit(1)
    )
    if conversation is not None:
        return conversation

    slug = slugify(f"{channel.slug}-{external_contact_id}")[:50]
    conversation = OmnichannelConversation(
        organization_id=channel.organization_id,
        channel_id=channel.id,
        subject=subject[:255],
        slug=slug,
        external_contact_id=external_contact_id,
        external_contact_name=external_contact_name,
        assigned_ai_employee_id=channel.ai_employee_id,
        status=OmnichannelConversationStatus.OPEN,
        handoff_status=OmnichannelHandoffStatus.NONE,
    )
    db.add(conversation)
    db.flush()
    return conversation


def _add_inbound_message(
    db: Session,
    *,
    channel: OmnichannelChannel,
    conversation: OmnichannelConversation,
    content: str,
    metadata: dict[str, Any] | None = None,
) -> OmnichannelMessage:
    message = OmnichannelMessage(
        conversation_id=conversation.id,
        role=OmnichannelMessageRole.CUSTOMER,
        content=content,
        metadata_=metadata,
    )
    db.add(message)
    conversation.last_message_at = datetime.now(UTC)
    conversation.status = OmnichannelConversationStatus.OPEN
    record_omnichannel_audit(
        db,
        organization_id=channel.organization_id,
        conversation_id=conversation.id,
        channel_id=channel.id,
        action=OmnichannelAuditAction.WEBHOOK_RECEIVED,
        details={"channel_type": channel.channel_type.value},
    )
    db.commit()
    db.refresh(message)
    return message


def process_telegram_webhook(
    db: Session,
    *,
    channel_id: uuid.UUID,
    payload: dict[str, Any],
) -> OmnichannelMessage | None:
    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.TELEGRAM:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Telegram channel not found")

    message_payload = payload.get("message") or payload.get("edited_message")
    if not message_payload:
        return None

    text = message_payload.get("text")
    if not text:
        return None

    chat = message_payload.get("chat", {})
    chat_id = str(chat.get("id", ""))
    sender = message_payload.get("from", {})
    name = " ".join(
        part for part in [sender.get("first_name"), sender.get("last_name")] if part
    ).strip() or chat.get("title")

    conversation = _find_or_create_conversation(
        db,
        channel=channel,
        external_contact_id=chat_id,
        external_contact_name=name,
        subject=f"Telegram chat {chat_id}",
    )
    return _add_inbound_message(
        db,
        channel=channel,
        conversation=conversation,
        content=text,
        metadata={"telegram_update_id": payload.get("update_id")},
    )


def process_slack_webhook(
    db: Session,
    *,
    channel_id: uuid.UUID,
    payload: dict[str, Any],
) -> dict[str, Any] | OmnichannelMessage | None:
    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge")}

    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.SLACK:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slack channel not found")

    event = payload.get("event", {})
    if event.get("type") != "message" or event.get("subtype"):
        return None

    text = event.get("text", "").strip()
    if not text:
        return None

    user_id = event.get("user", "unknown")
    conversation = _find_or_create_conversation(
        db,
        channel=channel,
        external_contact_id=user_id,
        external_contact_name=f"Slack user {user_id}",
        subject=f"Slack thread {user_id}",
    )
    return _add_inbound_message(
        db,
        channel=channel,
        conversation=conversation,
        content=text,
        metadata={"slack_ts": event.get("ts")},
    )


def process_whatsapp_webhook(
    db: Session,
    *,
    channel_id: uuid.UUID,
    payload: dict[str, Any],
) -> OmnichannelMessage | None:
    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.WHATSAPP:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="WhatsApp channel not found")

    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                if message.get("type") != "text":
                    continue
                text = message.get("text", {}).get("body", "")
                phone = message.get("from", "")
                contact_name = None
                for contact in value.get("contacts", []):
                    if contact.get("wa_id") == phone:
                        contact_name = contact.get("profile", {}).get("name")
                        break

                conversation = _find_or_create_conversation(
                    db,
                    channel=channel,
                    external_contact_id=phone,
                    external_contact_name=contact_name or phone,
                    subject=f"WhatsApp {phone}",
                )
                return _add_inbound_message(
                    db,
                    channel=channel,
                    conversation=conversation,
                    content=text,
                    metadata={"whatsapp_message_id": message.get("id")},
                )
    return None


def verify_webhook_channel(
    db: Session,
    *,
    channel_id: uuid.UUID,
    organization_id: uuid.UUID | None = None,
) -> OmnichannelChannel:
    if organization_id is not None:
        return get_omnichannel_channel_or_404(
            db,
            channel_id=channel_id,
            organization_id=organization_id,
        )
    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")
    return channel
