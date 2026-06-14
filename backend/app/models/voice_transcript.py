import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import VoiceTranscriptRole
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.voice_session import VoiceSession


class VoiceTranscript(Base, TimestampMixin):
    """One transcript entry in a voice session conversation."""

    __tablename__ = "voice_transcripts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    voice_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("voice_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_ai_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    role: Mapped[VoiceTranscriptRole] = mapped_column(
        Enum(
            VoiceTranscriptRole,
            name="voice_transcript_role",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    voice_session: Mapped["VoiceSession"] = relationship(back_populates="transcripts")
    author_ai_employee: Mapped["AIEmployee | None"] = relationship(
        back_populates="voice_transcripts",
    )
