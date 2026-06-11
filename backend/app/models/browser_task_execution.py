import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import BrowserTaskExecutionStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.browser_profile import BrowserProfile
    from app.models.browser_task import BrowserTask
    from app.models.organization import Organization
    from app.models.user import User


class BrowserTaskExecution(Base, TimestampMixin):
    """Runtime record of one browser task run (simulated until Playwright layer)."""

    __tablename__ = "browser_task_executions"

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
    browser_task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("browser_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    browser_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("browser_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[BrowserTaskExecutionStatus] = mapped_column(
        Enum(
            BrowserTaskExecutionStatus,
            name="browser_task_execution_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=BrowserTaskExecutionStatus.PENDING,
        index=True,
    )
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    logs: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    execution_metadata: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    organization: Mapped["Organization"] = relationship(back_populates="browser_task_executions")
    browser_task: Mapped["BrowserTask"] = relationship(back_populates="executions")
    browser_profile: Mapped["BrowserProfile"] = relationship()
    created_by: Mapped["User | None"] = relationship(back_populates="created_browser_task_executions")
