"""Omnichannel analytics aggregation."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import (
    OmnichannelConversationStatus,
    OmnichannelHandoffStatus,
    OmnichannelMessageRole,
)
from app.models.omnichannel_channel import OmnichannelChannel
from app.models.omnichannel_conversation import OmnichannelConversation
from app.models.omnichannel_message import OmnichannelMessage


def get_omnichannel_analytics(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> dict:
    """Aggregate omnichannel channel, conversation, and message metrics."""
    total_channels = db.scalar(
        select(func.count())
        .select_from(OmnichannelChannel)
        .where(OmnichannelChannel.organization_id == organization_id)
    ) or 0

    active_channels = db.scalar(
        select(func.count())
        .select_from(OmnichannelChannel)
        .where(
            OmnichannelChannel.organization_id == organization_id,
            OmnichannelChannel.is_active.is_(True),
        )
    ) or 0

    status_rows = db.execute(
        select(OmnichannelConversation.status, func.count())
        .where(
            OmnichannelConversation.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
        )
        .group_by(OmnichannelConversation.status)
    ).all()
    conversations_by_status = {status.value: count for status, count in status_rows}
    total_conversations = sum(conversations_by_status.values())

    channel_type_rows = db.execute(
        select(OmnichannelChannel.channel_type, func.count())
        .join(
            OmnichannelConversation,
            OmnichannelConversation.channel_id == OmnichannelChannel.id,
        )
        .where(
            OmnichannelChannel.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
        )
        .group_by(OmnichannelChannel.channel_type)
    ).all()
    conversations_by_channel_type = {
        channel_type.value: count for channel_type, count in channel_type_rows
    }

    channel_name_rows = db.execute(
        select(OmnichannelChannel.name, func.count())
        .join(
            OmnichannelConversation,
            OmnichannelConversation.channel_id == OmnichannelChannel.id,
        )
        .where(
            OmnichannelChannel.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
        )
        .group_by(OmnichannelChannel.name)
    ).all()
    conversations_by_channel = {name: count for name, count in channel_name_rows}

    role_rows = db.execute(
        select(OmnichannelMessage.role, func.count())
        .join(
            OmnichannelConversation,
            OmnichannelMessage.conversation_id == OmnichannelConversation.id,
        )
        .where(
            OmnichannelConversation.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
        )
        .group_by(OmnichannelMessage.role)
    ).all()
    messages_by_role = {role.value: count for role, count in role_rows}
    total_messages = sum(messages_by_role.values())

    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    recent_conversations_7d = db.scalar(
        select(func.count())
        .select_from(OmnichannelConversation)
        .where(
            OmnichannelConversation.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
            OmnichannelConversation.created_at >= seven_days_ago,
        )
    ) or 0

    pending_handoffs = db.scalar(
        select(func.count())
        .select_from(OmnichannelConversation)
        .where(
            OmnichannelConversation.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
            OmnichannelConversation.handoff_status.in_(
                [
                    OmnichannelHandoffStatus.REQUESTED,
                    OmnichannelHandoffStatus.ASSIGNED,
                ]
            ),
        )
    ) or 0

    handoff_rows = db.execute(
        select(OmnichannelConversation.handoff_status, func.count())
        .where(
            OmnichannelConversation.organization_id == organization_id,
            OmnichannelConversation.deleted_at.is_(None),
            OmnichannelConversation.archived_at.is_(None),
        )
        .group_by(OmnichannelConversation.handoff_status)
    ).all()
    handoffs_by_status = {status.value: count for status, count in handoff_rows}

    active_conversation_filter = (
        OmnichannelConversation.organization_id == organization_id,
        OmnichannelConversation.deleted_at.is_(None),
        OmnichannelConversation.archived_at.is_(None),
    )

    ai_handled_conversations = db.scalar(
        select(func.count())
        .select_from(OmnichannelConversation)
        .where(
            *active_conversation_filter,
            OmnichannelConversation.status.in_(
                [
                    OmnichannelConversationStatus.OPEN,
                    OmnichannelConversationStatus.AI_HANDLING,
                ]
            ),
            OmnichannelConversation.handoff_status == OmnichannelHandoffStatus.NONE,
            OmnichannelConversation.assigned_user_id.is_(None),
        )
    ) or 0

    human_handled_conversations = db.scalar(
        select(func.count())
        .select_from(OmnichannelConversation)
        .where(
            *active_conversation_filter,
            or_(
                OmnichannelConversation.status == OmnichannelConversationStatus.WAITING_HUMAN,
                OmnichannelConversation.handoff_status.in_(
                    [
                        OmnichannelHandoffStatus.REQUESTED,
                        OmnichannelHandoffStatus.ASSIGNED,
                    ]
                ),
                OmnichannelConversation.assigned_user_id.is_not(None),
            ),
        )
    ) or 0

    return {
        "total_channels": total_channels,
        "active_channels": active_channels,
        "total_conversations": total_conversations,
        "open_conversations": conversations_by_status.get(
            OmnichannelConversationStatus.OPEN.value,
            0,
        ),
        "waiting_human_conversations": conversations_by_status.get(
            OmnichannelConversationStatus.WAITING_HUMAN.value,
            0,
        ),
        "resolved_conversations": conversations_by_status.get(
            OmnichannelConversationStatus.RESOLVED.value,
            0,
        ),
        "total_messages": total_messages,
        "recent_conversations_7d": recent_conversations_7d,
        "pending_handoffs": pending_handoffs,
        "handoffs_by_status": handoffs_by_status,
        "ai_handled_conversations": ai_handled_conversations,
        "human_handled_conversations": human_handled_conversations,
        "conversations_by_status": conversations_by_status,
        "conversations_by_channel_type": conversations_by_channel_type,
        "messages_by_role": messages_by_role,
        "conversations_by_channel": conversations_by_channel,
    }
