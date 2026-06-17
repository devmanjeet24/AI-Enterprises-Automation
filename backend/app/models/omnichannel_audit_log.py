import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OmnichannelAuditAction
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.omnichannel_channel import OmnichannelChannel
    from app.models.omnichannel_conversation import OmnichannelConversation
    from app.models.organization import Organization
    from app.models.user import User


class OmnichannelAuditLog(Base, TimestampMixin):
    """Immutable audit trail for omnichannel actions."""

    __tablename__ = "omnichannel_audit_logs"

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
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("omnichannel_conversations.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    channel_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("omnichannel_channels.id", ondelete="SET NULL"),
        nullable=True,
    )
    actor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    action: Mapped[OmnichannelAuditAction] = mapped_column(
        Enum(
            OmnichannelAuditAction,
            name="omnichannel_audit_action",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    organization: Mapped["Organization"] = relationship()
    conversation: Mapped["OmnichannelConversation | None"] = relationship()
    channel: Mapped["OmnichannelChannel | None"] = relationship()
    actor_user: Mapped["User | None"] = relationship()
