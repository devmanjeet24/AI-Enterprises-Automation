import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MessageRole
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee_conversation import AIEmployeeConversation


class AIEmployeeMessage(Base, TimestampMixin):
    """One user or assistant message inside an AI employee conversation."""

    __tablename__ = "ai_employee_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employee_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[MessageRole] = mapped_column(
        Enum(
            MessageRole,
            name="message_role",
            values_callable=lambda role_enum: [member.value for member in role_enum],
        ),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)

    conversation: Mapped["AIEmployeeConversation"] = relationship(back_populates="messages")
