import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.ai_employee import AIEmployee


class AIEmployeeTool(Base, TimestampMixin):
    """One enabled tool configuration for an AI employee."""

    __tablename__ = "ai_employee_tools"
    __table_args__ = (
        UniqueConstraint(
            "ai_employee_id",
            "tool_slug",
            name="uq_ai_employee_tools_ai_employee_id_tool_slug",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    ai_employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tool_slug: Mapped[str] = mapped_column(String(50), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    config: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    ai_employee: Mapped["AIEmployee"] = relationship(back_populates="tools")
