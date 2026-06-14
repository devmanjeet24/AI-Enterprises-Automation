import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import VoiceSessionStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.voice_agent import VoiceAgent
    from app.models.voice_transcript import VoiceTranscript


class VoiceSession(Base, TimestampMixin):
    """One voice interaction session (audio upload → transcription → AI response)."""

    __tablename__ = "voice_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    voice_agent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("voice_agents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[VoiceSessionStatus] = mapped_column(
        Enum(
            VoiceSessionStatus,
            name="voice_session_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=VoiceSessionStatus.PENDING,
        index=True,
    )
    audio_file_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    audio_mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    audio_duration_seconds: Mapped[float | None] = mapped_column(nullable=True)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    organization: Mapped["Organization"] = relationship(back_populates="voice_sessions")
    voice_agent: Mapped["VoiceAgent"] = relationship(back_populates="sessions")
    created_by: Mapped["User | None"] = relationship(back_populates="created_voice_sessions")
    transcripts: Mapped[list["VoiceTranscript"]] = relationship(
        back_populates="voice_session",
        cascade="all, delete-orphan",
        order_by="VoiceTranscript.created_at",
    )
