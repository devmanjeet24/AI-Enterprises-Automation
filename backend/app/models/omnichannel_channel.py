import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OmnichannelChannelType
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.omnichannel_conversation import OmnichannelConversation
    from app.models.organization import Organization
    from app.models.user import User


class OmnichannelChannel(Base, TimestampMixin):
    """Channel configuration for omnichannel communication (simulated connectors)."""

    __tablename__ = "omnichannel_channels"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_omnichannel_channels_organization_id_slug",
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
    ai_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    channel_type: Mapped[OmnichannelChannelType] = mapped_column(
        Enum(
            OmnichannelChannelType,
            name="omnichannel_channel_type",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    config: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization: Mapped["Organization"] = relationship(back_populates="omnichannel_channels")
    ai_employee: Mapped["AIEmployee | None"] = relationship(
        back_populates="omnichannel_channels",
    )
    created_by: Mapped["User | None"] = relationship(back_populates="created_omnichannel_channels")
    conversations: Mapped[list["OmnichannelConversation"]] = relationship(
        back_populates="channel",
        cascade="all, delete-orphan",
    )
