import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import OmnichannelMessageRole
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.omnichannel_conversation import OmnichannelConversation
    from app.models.user import User


class OmnichannelMessage(Base, TimestampMixin):
    """One message in an omnichannel conversation thread."""

    __tablename__ = "omnichannel_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("omnichannel_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    author_ai_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    role: Mapped[OmnichannelMessageRole] = mapped_column(
        Enum(
            OmnichannelMessageRole,
            name="omnichannel_message_role",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    metadata_: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
    )

    conversation: Mapped["OmnichannelConversation"] = relationship(back_populates="messages")
    author_user: Mapped["User | None"] = relationship(back_populates="omnichannel_messages")
    author_ai_employee: Mapped["AIEmployee | None"] = relationship(
        back_populates="omnichannel_messages",
    )
