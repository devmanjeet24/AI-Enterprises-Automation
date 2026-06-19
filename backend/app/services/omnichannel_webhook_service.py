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
from app.services.omnichannel_event_bus import publish_omnichannel_event_sync
from app.services.omnichannel_channel_service import get_omnichannel_channel_or_404
from app.services.slack_service import get_bot_user_id, resolve_slack_bot_token, resolve_user_display_name


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
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
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


def _slack_event_already_processed(db: Session, event_id: str) -> bool:
    existing = db.scalar(
        select(OmnichannelMessage.id)
        .where(OmnichannelMessage.metadata_.contains({"slack_event_id": event_id}))
        .limit(1)
    )
    return existing is not None


def _slack_conversation_external_id(
    *,
    slack_channel_id: str,
    user_id: str,
    message_ts: str,
    thread_ts: str | None,
    channel_type: str | None,
) -> str:
    """Build a stable omnichannel conversation key for Slack routing."""
    if channel_type == "im" or slack_channel_id.startswith("D"):
        return f"slack:im:{user_id}"
    if thread_ts:
        return f"slack:thread:{slack_channel_id}:{thread_ts}"
    return f"slack:msg:{slack_channel_id}:{message_ts}"


def _slack_reply_thread_ts(event: dict[str, Any]) -> str:
    return str(event.get("thread_ts") or event.get("ts", ""))


def _find_or_create_slack_conversation(
    db: Session,
    *,
    channel: OmnichannelChannel,
    external_contact_id: str,
    external_contact_name: str | None,
    subject: str,
    shared_context: dict[str, Any],
) -> OmnichannelConversation:
    conversation = db.scalar(
        select(OmnichannelConversation)
        .where(
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.external_contact_id == external_contact_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
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
        merged_context = dict(conversation.shared_context or {})
        merged_context.update(shared_context)
        conversation.shared_context = merged_context
        if external_contact_name and conversation.external_contact_name != external_contact_name:
            conversation.external_contact_name = external_contact_name
        return conversation

    slug = slugify(f"{channel.slug}-{external_contact_id}")[:50]
    conversation = OmnichannelConversation(
        organization_id=channel.organization_id,
        channel_id=channel.id,
        subject=subject[:255],
        slug=slug,
        external_contact_id=external_contact_id,
        external_contact_name=external_contact_name,
        shared_context=shared_context,
        assigned_ai_employee_id=channel.ai_employee_id,
        status=OmnichannelConversationStatus.OPEN,
        handoff_status=OmnichannelHandoffStatus.NONE,
    )
    db.add(conversation)
    db.flush()
    return conversation


def _should_ignore_slack_event(event: dict[str, Any], *, bot_user_id: str | None) -> bool:
    if event.get("bot_id"):
        return True
    if event.get("subtype"):
        return True
    if bot_user_id and event.get("user") == bot_user_id:
        return True
    return False


def _is_slack_inbound_event(event: dict[str, Any]) -> bool:
    return event.get("type") in {"message", "app_mention"}


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

    if payload.get("type") != "event_callback":
        return None

    event_id = payload.get("event_id")
    if event_id and _slack_event_already_processed(db, event_id):
        return None

    team_id = payload.get("team_id", "")
    channel_config = channel.config or {}
    expected_team_id = channel_config.get("slack_team_id")
    if expected_team_id and team_id and expected_team_id != team_id:
        return None

    event = payload.get("event", {})
    if not _is_slack_inbound_event(event):
        return None

    bot_token = resolve_slack_bot_token()
    bot_user_id = get_bot_user_id(bot_token=bot_token) if bot_token else channel_config.get(
        "slack_bot_user_id"
    )
    if _should_ignore_slack_event(event, bot_user_id=bot_user_id):
        return None

    text = event.get("text", "").strip()
    if not text:
        return None

    user_id = event.get("user")
    if not user_id:
        return None

    slack_channel_id = event.get("channel", "")
    if not slack_channel_id:
        return None

    message_ts = str(event.get("ts", ""))
    thread_ts = event.get("thread_ts")
    reply_thread_ts = _slack_reply_thread_ts(event)
    channel_type = event.get("channel_type")

    external_contact_id = _slack_conversation_external_id(
        slack_channel_id=slack_channel_id,
        user_id=user_id,
        message_ts=message_ts,
        thread_ts=str(thread_ts) if thread_ts else None,
        channel_type=channel_type,
    )

    display_name = None
    if bot_token:
        display_name = resolve_user_display_name(bot_token=bot_token, user_id=user_id)
    external_contact_name = display_name or f"Slack user {user_id}"

    if channel_type == "im" or slack_channel_id.startswith("D"):
        subject = f"Slack DM with {external_contact_name}"
    elif thread_ts:
        subject = f"Slack thread in {slack_channel_id}"
    else:
        subject = f"Slack message in {slack_channel_id}"

    shared_context = {
        "slack_user_id": user_id,
        "slack_channel_id": slack_channel_id,
        "slack_thread_ts": reply_thread_ts,
        "slack_team_id": team_id,
        "slack_channel_type": channel_type,
    }

    conversation = _find_or_create_slack_conversation(
        db,
        channel=channel,
        external_contact_id=external_contact_id,
        external_contact_name=external_contact_name,
        subject=subject,
        shared_context=shared_context,
    )
    return _add_inbound_message(
        db,
        channel=channel,
        conversation=conversation,
        content=text,
        metadata={
            "slack_ts": message_ts,
            "slack_thread_ts": thread_ts,
            "slack_channel_id": slack_channel_id,
            "slack_event_id": event_id,
        },
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


def _linkedin_notification_already_processed(db: Session, notification_id: str | int) -> bool:
    existing = db.scalar(
        select(OmnichannelMessage.id)
        .where(OmnichannelMessage.metadata_.contains({"linkedin_notification_id": str(notification_id)}))
        .limit(1)
    )
    return existing is not None


def _linkedin_conversation_external_id(
    *,
    organization_urn: str,
    source_post_urn: str,
    comment_urn: str | None,
    parent_comment_urn: str | None,
) -> str:
    if parent_comment_urn:
        return f"linkedin:thread:{organization_urn}:{parent_comment_urn}"
    if comment_urn:
        return f"linkedin:comment:{organization_urn}:{source_post_urn}:{comment_urn}"
    return f"linkedin:post:{organization_urn}:{source_post_urn}"


def _extract_linkedin_comment_text(notification: dict[str, Any]) -> str | None:
    decorated = notification.get("decoratedGeneratedActivity") or {}
    comment = decorated.get("comment") or {}
    message = comment.get("message") or {}
    text = message.get("text")
    if isinstance(text, str) and text.strip():
        return text.strip()
    return None


def _extract_linkedin_comment_owner(notification: dict[str, Any]) -> str | None:
    decorated = notification.get("decoratedGeneratedActivity") or {}
    comment = decorated.get("comment") or {}
    owner = comment.get("owner")
    if isinstance(owner, str):
        return owner
    return None


def _extract_linkedin_comment_entity(notification: dict[str, Any]) -> str | None:
    decorated = notification.get("decoratedGeneratedActivity") or {}
    comment = decorated.get("comment") or {}
    entity = comment.get("entity") or notification.get("generatedActivity")
    if isinstance(entity, str):
        return entity
    return None


def _extract_linkedin_comment_object(notification: dict[str, Any]) -> str | None:
    decorated = notification.get("decoratedGeneratedActivity") or {}
    comment = decorated.get("comment") or {}
    obj = comment.get("object") or notification.get("sourcePost")
    if isinstance(obj, str):
        return obj
    return None


def _extract_linkedin_parent_comment(notification: dict[str, Any]) -> str | None:
    decorated = notification.get("decoratedGeneratedActivity") or {}
    comment = decorated.get("comment") or {}
    parent = comment.get("parentComment")
    if isinstance(parent, str):
        return parent
    return None


def _should_process_linkedin_action(action: str) -> bool:
    return action in {
        "COMMENT",
        "ADMIN_COMMENT",
        "SHARE_MENTION",
        "COMMENT_EDIT",
    }


def _find_or_create_linkedin_conversation(
    db: Session,
    *,
    channel: OmnichannelChannel,
    external_contact_id: str,
    external_contact_name: str | None,
    subject: str,
    shared_context: dict[str, Any],
) -> OmnichannelConversation:
    conversation = db.scalar(
        select(OmnichannelConversation)
        .where(
            OmnichannelConversation.channel_id == channel.id,
            OmnichannelConversation.external_contact_id == external_contact_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
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
        merged_context = dict(conversation.shared_context or {})
        merged_context.update(shared_context)
        conversation.shared_context = merged_context
        if external_contact_name and conversation.external_contact_name != external_contact_name:
            conversation.external_contact_name = external_contact_name
        return conversation

    slug = slugify(f"{channel.slug}-{external_contact_id}")[:50]
    conversation = OmnichannelConversation(
        organization_id=channel.organization_id,
        channel_id=channel.id,
        subject=subject[:255],
        slug=slug,
        external_contact_id=external_contact_id,
        external_contact_name=external_contact_name,
        shared_context=shared_context,
        assigned_ai_employee_id=channel.ai_employee_id,
        status=OmnichannelConversationStatus.OPEN,
        handoff_status=OmnichannelHandoffStatus.NONE,
    )
    db.add(conversation)
    db.flush()
    return conversation


def process_linkedin_webhook(
    db: Session,
    *,
    channel_id: uuid.UUID,
    payload: dict[str, Any],
) -> OmnichannelMessage | None:
    channel = db.get(OmnichannelChannel, channel_id)
    if channel is None or channel.channel_type != OmnichannelChannelType.LINKEDIN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="LinkedIn channel not found")

    channel_config = channel.config or {}
    organization_urn = channel_config.get("linkedin_organization_urn")
    if not organization_urn:
        return None

    if payload.get("type") != "ORGANIZATION_SOCIAL_ACTION_NOTIFICATIONS":
        return None

    last_message: OmnichannelMessage | None = None
    for notification in payload.get("notifications") or []:
        notification_id = notification.get("notificationId")
        if notification_id is not None and _linkedin_notification_already_processed(
            db, notification_id
        ):
            continue

        action = str(notification.get("action", ""))
        if not _should_process_linkedin_action(action):
            continue

        org_entity = notification.get("organizationalEntity")
        if org_entity and org_entity != organization_urn:
            continue

        comment_owner = _extract_linkedin_comment_owner(notification)
        if comment_owner and comment_owner == organization_urn:
            continue

        text = _extract_linkedin_comment_text(notification)
        if not text:
            continue

        source_post = _extract_linkedin_comment_object(notification) or notification.get("sourcePost")
        if not source_post:
            continue

        comment_urn = _extract_linkedin_comment_entity(notification)
        parent_comment = _extract_linkedin_parent_comment(notification)
        reply_target = parent_comment or comment_urn or source_post

        external_contact_id = _linkedin_conversation_external_id(
            organization_urn=str(organization_urn),
            source_post_urn=str(source_post),
            comment_urn=str(comment_urn) if comment_urn else None,
            parent_comment_urn=str(parent_comment) if parent_comment else None,
        )

        if action == "SHARE_MENTION":
            subject = f"LinkedIn mention on {source_post}"
            contact_name = "LinkedIn member"
        elif parent_comment:
            subject = f"LinkedIn comment reply on {source_post}"
            contact_name = comment_owner or "LinkedIn member"
        else:
            subject = f"LinkedIn comment on {source_post}"
            contact_name = comment_owner or "LinkedIn member"

        shared_context = {
            "linkedin_organization_urn": organization_urn,
            "linkedin_source_post_urn": source_post,
            "linkedin_comment_urn": comment_urn,
            "linkedin_parent_comment_urn": reply_target,
            "linkedin_reply_target_urn": reply_target,
            "linkedin_action": action,
        }

        conversation = _find_or_create_linkedin_conversation(
            db,
            channel=channel,
            external_contact_id=external_contact_id,
            external_contact_name=contact_name,
            subject=subject,
            shared_context=shared_context,
        )
        last_message = _add_inbound_message(
            db,
            channel=channel,
            conversation=conversation,
            content=text,
            metadata={
                "linkedin_notification_id": str(notification_id) if notification_id is not None else None,
                "linkedin_action": action,
                "linkedin_source_post_urn": source_post,
                "linkedin_comment_urn": comment_urn,
            },
        )
    return last_message


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
