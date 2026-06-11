import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import BrowserTaskStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.browser_profile import BrowserProfile
    from app.models.browser_task_execution import BrowserTaskExecution
    from app.models.organization import Organization
    from app.models.user import User


class BrowserTask(Base, TimestampMixin):
    """A browser automation task definition (execution deferred to Playwright layer)."""

    __tablename__ = "browser_tasks"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_browser_tasks_organization_id_slug",
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
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[BrowserTaskStatus] = mapped_column(
        Enum(
            BrowserTaskStatus,
            name="browser_task_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=BrowserTaskStatus.DRAFT,
        index=True,
    )
    config: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="browser_tasks")
    browser_profile: Mapped["BrowserProfile"] = relationship(back_populates="tasks")
    created_by: Mapped["User | None"] = relationship(back_populates="created_browser_tasks")
    executions: Mapped[list["BrowserTaskExecution"]] = relationship(
        back_populates="browser_task",
        cascade="all, delete-orphan",
    )
