"""Unified inbox queries for omnichannel conversations."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import OmnichannelChannelType, OmnichannelConversationStatus
from app.models.omnichannel_channel import OmnichannelChannel
from app.models.omnichannel_conversation import OmnichannelConversation
from app.models.omnichannel_message import OmnichannelMessage
from app.schemas.omnichannel_conversation import OmnichannelInboxItemResponse


def list_unified_inbox(
    db: Session,
    *,
    organization_id: uuid.UUID,
    channel_id: uuid.UUID | None = None,
    channel_type: OmnichannelChannelType | None = None,
    status: OmnichannelConversationStatus | None = None,
    unassigned_only: bool = False,
) -> list[OmnichannelInboxItemResponse]:
    """Return conversations for the unified inbox, newest activity first."""
    query = select(OmnichannelConversation).where(
        OmnichannelConversation.organization_id == organization_id,
    )

    if channel_id is not None:
        query = query.where(OmnichannelConversation.channel_id == channel_id)

    if channel_type is not None or unassigned_only:
        query = query.join(
            OmnichannelChannel,
            OmnichannelConversation.channel_id == OmnichannelChannel.id,
        )
        if channel_type is not None:
            query = query.where(OmnichannelChannel.channel_type == channel_type)

    if status is not None:
        query = query.where(OmnichannelConversation.status == status)

    if unassigned_only:
        query = query.where(
            OmnichannelConversation.assigned_user_id.is_(None),
            OmnichannelConversation.assigned_ai_employee_id.is_(None),
        )

    conversations = list(
        db.scalars(
            query.order_by(
                OmnichannelConversation.last_message_at.desc().nullslast(),
                OmnichannelConversation.created_at.desc(),
            )
        ).all()
    )

    if not conversations:
        return []

    channel_ids = {conversation.channel_id for conversation in conversations}
    channels = {
        channel.id: channel
        for channel in db.scalars(
            select(OmnichannelChannel).where(OmnichannelChannel.id.in_(channel_ids))
        ).all()
    }

    conversation_ids = [conversation.id for conversation in conversations]
    message_counts = dict(
        db.execute(
            select(OmnichannelMessage.conversation_id, func.count())
            .where(OmnichannelMessage.conversation_id.in_(conversation_ids))
            .group_by(OmnichannelMessage.conversation_id)
        ).all()
    )

    latest_messages: dict[uuid.UUID, str | None] = {}
    for conversation_id in conversation_ids:
        latest = db.scalar(
            select(OmnichannelMessage.content)
            .where(OmnichannelMessage.conversation_id == conversation_id)
            .order_by(OmnichannelMessage.created_at.desc())
            .limit(1)
        )
        if latest:
            latest_messages[conversation_id] = latest[:120]

    return [
        OmnichannelInboxItemResponse(
            id=conversation.id,
            organization_id=conversation.organization_id,
            channel_id=conversation.channel_id,
            created_by_id=conversation.created_by_id,
            assigned_user_id=conversation.assigned_user_id,
            assigned_ai_employee_id=conversation.assigned_ai_employee_id,
            subject=conversation.subject,
            slug=conversation.slug,
            external_contact_name=conversation.external_contact_name,
            external_contact_id=conversation.external_contact_id,
            status=conversation.status,
            handoff_status=conversation.handoff_status,
            shared_context=conversation.shared_context,
            last_message_at=conversation.last_message_at,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            channel_name=channels.get(conversation.channel_id).name
            if channels.get(conversation.channel_id)
            else None,
            channel_type=channels.get(conversation.channel_id).channel_type.value
            if channels.get(conversation.channel_id)
            else None,
            message_count=message_counts.get(conversation.id, 0),
            last_message_preview=latest_messages.get(conversation.id),
        )
        for conversation in conversations
    ]
