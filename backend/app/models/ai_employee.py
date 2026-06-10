import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AIEmployeeStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee_document import AIEmployeeDocument
    from app.models.ai_employee_tool import AIEmployeeTool
    from app.models.organization import Organization
    from app.models.user import User


class AIEmployee(Base, TimestampMixin):
    """A configured digital worker belonging to one organization."""

    __tablename__ = "ai_employees"

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
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AIEmployeeStatus] = mapped_column(
        Enum(
            AIEmployeeStatus,
            name="ai_employee_status",
            values_callable=lambda status_enum: [member.value for member in status_enum],
        ),
        nullable=False,
        default=AIEmployeeStatus.INACTIVE,
        index=True,
    )

    organization: Mapped["Organization"] = relationship(back_populates="ai_employees")
    created_by: Mapped["User | None"] = relationship(back_populates="created_ai_employees")
    document_assignments: Mapped[list["AIEmployeeDocument"]] = relationship(
        back_populates="ai_employee",
        cascade="all, delete-orphan",
    )
    tools: Mapped[list["AIEmployeeTool"]] = relationship(
        back_populates="ai_employee",
        cascade="all, delete-orphan",
    )
