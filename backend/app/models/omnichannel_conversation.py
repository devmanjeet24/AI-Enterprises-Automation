import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OmnichannelConversationStatus, OmnichannelHandoffStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.omnichannel_channel import OmnichannelChannel
    from app.models.omnichannel_message import OmnichannelMessage
    from app.models.organization import Organization
    from app.models.user import User


class OmnichannelConversation(Base, TimestampMixin):
    """Unified inbox conversation thread across a channel."""

    __tablename__ = "omnichannel_conversations"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_omnichannel_conversations_organization_id_slug",
        ),
    )

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
    channel_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("omnichannel_channels.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_ai_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    external_contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    external_contact_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[OmnichannelConversationStatus] = mapped_column(
        Enum(
            OmnichannelConversationStatus,
            name="omnichannel_conversation_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=OmnichannelConversationStatus.OPEN,
        index=True,
    )
    handoff_status: Mapped[OmnichannelHandoffStatus] = mapped_column(
        Enum(
            OmnichannelHandoffStatus,
            name="omnichannel_handoff_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=OmnichannelHandoffStatus.NONE,
        index=True,
    )
    shared_context: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    last_message_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    organization: Mapped["Organization"] = relationship(back_populates="omnichannel_conversations")
    channel: Mapped["OmnichannelChannel"] = relationship(back_populates="conversations")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_omnichannel_conversations",
        foreign_keys=[created_by_id],
    )
    assigned_user: Mapped["User | None"] = relationship(
        back_populates="assigned_omnichannel_conversations",
        foreign_keys=[assigned_user_id],
    )
    assigned_ai_employee: Mapped["AIEmployee | None"] = relationship(
        back_populates="assigned_omnichannel_conversations",
    )
    messages: Mapped[list["OmnichannelMessage"]] = relationship(
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="OmnichannelMessage.created_at",
    )
