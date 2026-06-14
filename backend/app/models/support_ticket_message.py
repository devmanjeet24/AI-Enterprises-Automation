import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import SupportMessageRole
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.support_ticket import SupportTicket
    from app.models.user import User


class SupportTicketMessage(Base, TimestampMixin):
    """One message in a support ticket conversation thread."""

    __tablename__ = "support_ticket_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    ticket_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("support_tickets.id", ondelete="CASCADE"),
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
    role: Mapped[SupportMessageRole] = mapped_column(
        Enum(
            SupportMessageRole,
            name="support_message_role",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    ticket: Mapped["SupportTicket"] = relationship(back_populates="messages")
    author_user: Mapped["User | None"] = relationship(
        back_populates="support_ticket_messages",
    )
    author_ai_employee: Mapped["AIEmployee | None"] = relationship(
        back_populates="support_ticket_messages",
    )
