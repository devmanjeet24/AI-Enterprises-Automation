import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AgentTaskStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task import AgentTask
    from app.models.organization import Organization
    from app.models.research_project import ResearchProject
    from app.models.user import User


class ResearchReport(Base, TimestampMixin):
    """Stored output from one research project execution run."""

    __tablename__ = "research_reports"
    __table_args__ = (
        UniqueConstraint(
            "research_project_id",
            "version_number",
            name="uq_research_reports_project_id_version",
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
    research_project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("research_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_tasks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    status: Mapped[AgentTaskStatus] = mapped_column(
        Enum(
            AgentTaskStatus,
            name="agent_task_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
            create_type=False,
        ),
        nullable=False,
        default=AgentTaskStatus.PENDING,
        index=True,
    )
    final_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    intermediate_outputs: Mapped[list[dict[str, Any]] | None] = mapped_column(
        JSONB,
        nullable=True,
    )
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

    organization: Mapped["Organization"] = relationship(back_populates="research_reports")
    research_project: Mapped["ResearchProject"] = relationship(back_populates="reports")
    agent_task: Mapped["AgentTask | None"] = relationship()
    created_by: Mapped["User | None"] = relationship(back_populates="created_research_reports")
