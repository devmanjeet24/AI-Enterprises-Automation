"""Voice AI analytics aggregation."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import VoiceSessionStatus, VoiceTranscriptRole
from app.models.voice_agent import VoiceAgent
from app.models.voice_session import VoiceSession
from app.models.voice_transcript import VoiceTranscript


def get_voice_analytics(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> dict:
    """Aggregate voice agent, session, and transcript metrics."""
    total_agents = db.scalar(
        select(func.count())
        .select_from(VoiceAgent)
        .where(VoiceAgent.organization_id == organization_id)
    ) or 0

    active_agents = db.scalar(
        select(func.count())
        .select_from(VoiceAgent)
        .where(
            VoiceAgent.organization_id == organization_id,
            VoiceAgent.is_active.is_(True),
        )
    ) or 0

    status_rows = db.execute(
        select(VoiceSession.status, func.count())
        .where(VoiceSession.organization_id == organization_id)
        .group_by(VoiceSession.status)
    ).all()
    sessions_by_status = {status.value: count for status, count in status_rows}
    total_sessions = sum(sessions_by_status.values())

    role_rows = db.execute(
        select(VoiceTranscript.role, func.count())
        .join(VoiceSession, VoiceTranscript.voice_session_id == VoiceSession.id)
        .where(VoiceSession.organization_id == organization_id)
        .group_by(VoiceTranscript.role)
    ).all()
    transcripts_by_role = {role.value: count for role, count in role_rows}

    agent_rows = db.execute(
        select(VoiceAgent.name, func.count())
        .join(VoiceSession, VoiceSession.voice_agent_id == VoiceAgent.id)
        .where(VoiceAgent.organization_id == organization_id)
        .group_by(VoiceAgent.name)
    ).all()
    sessions_by_agent = {name: count for name, count in agent_rows}

    total_transcripts = sum(transcripts_by_role.values())

    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    recent_sessions_7d = db.scalar(
        select(func.count())
        .select_from(VoiceSession)
        .where(
            VoiceSession.organization_id == organization_id,
            VoiceSession.created_at >= seven_days_ago,
        )
    ) or 0

    return {
        "total_agents": total_agents,
        "active_agents": active_agents,
        "total_sessions": total_sessions,
        "completed_sessions": sessions_by_status.get(VoiceSessionStatus.COMPLETED.value, 0),
        "failed_sessions": sessions_by_status.get(VoiceSessionStatus.FAILED.value, 0),
        "processing_sessions": sessions_by_status.get(VoiceSessionStatus.PROCESSING.value, 0),
        "pending_sessions": sessions_by_status.get(VoiceSessionStatus.PENDING.value, 0),
        "total_transcripts": total_transcripts,
        "recent_sessions_7d": recent_sessions_7d,
        "sessions_by_status": sessions_by_status,
        "transcripts_by_role": transcripts_by_role,
        "sessions_by_agent": sessions_by_agent,
    }
