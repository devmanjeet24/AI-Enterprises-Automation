import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import SupportTicketPriority, SupportTicketStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee
    from app.models.organization import Organization
    from app.models.support_ticket_category import SupportTicketCategory
    from app.models.support_ticket_message import SupportTicketMessage
    from app.models.user import User


class SupportTicket(Base, TimestampMixin):
    """A customer support request tracked within an organization."""

    __tablename__ = "support_tickets"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_support_tickets_organization_id_slug",
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
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("support_ticket_categories.id", ondelete="SET NULL"),
        nullable=True,
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
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[SupportTicketStatus] = mapped_column(
        Enum(
            SupportTicketStatus,
            name="support_ticket_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=SupportTicketStatus.OPEN,
        index=True,
    )
    priority: Mapped[SupportTicketPriority] = mapped_column(
        Enum(
            SupportTicketPriority,
            name="support_ticket_priority",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=SupportTicketPriority.NORMAL,
        index=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    resolved_message_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("support_ticket_messages.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reopened_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    organization: Mapped["Organization"] = relationship(back_populates="support_tickets")
    category: Mapped["SupportTicketCategory | None"] = relationship(back_populates="tickets")
    created_by: Mapped["User | None"] = relationship(
        back_populates="created_support_tickets",
        foreign_keys=[created_by_id],
    )
    assigned_user: Mapped["User | None"] = relationship(
        back_populates="assigned_support_tickets",
        foreign_keys=[assigned_user_id],
    )
    assigned_ai_employee: Mapped["AIEmployee | None"] = relationship(
        back_populates="assigned_support_tickets",
    )
    messages: Mapped[list["SupportTicketMessage"]] = relationship(
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="SupportTicketMessage.created_at",
        foreign_keys="SupportTicketMessage.ticket_id",
    )
    resolved_message: Mapped["SupportTicketMessage | None"] = relationship(
        foreign_keys=[resolved_message_id],
        uselist=False,
        viewonly=True,
    )
