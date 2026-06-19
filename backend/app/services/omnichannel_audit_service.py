"""Persist omnichannel audit log entries."""

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import OmnichannelAuditAction
from app.models.omnichannel_audit_log import OmnichannelAuditLog


def record_omnichannel_audit(
    db: Session,
    *,
    organization_id: uuid.UUID,
    action: OmnichannelAuditAction,
    conversation_id: uuid.UUID | None = None,
    channel_id: uuid.UUID | None = None,
    actor_user_id: uuid.UUID | None = None,
    details: dict[str, Any] | None = None,
) -> OmnichannelAuditLog:
    entry = OmnichannelAuditLog(
        organization_id=organization_id,
        conversation_id=conversation_id,
        channel_id=channel_id,
        actor_user_id=actor_user_id,
        action=action,
        details=details,
    )
    db.add(entry)
    return entry


def list_conversation_audit_logs(
    db: Session,
    *,
    organization_id: uuid.UUID,
    conversation_id: uuid.UUID,
    limit: int = 50,
) -> list[OmnichannelAuditLog]:
    return list(
        db.scalars(
            select(OmnichannelAuditLog)
            .where(
                OmnichannelAuditLog.organization_id == organization_id,
                OmnichannelAuditLog.conversation_id == conversation_id,
            )
            .order_by(OmnichannelAuditLog.created_at.desc())
            .limit(limit)
        ).all()
    )
