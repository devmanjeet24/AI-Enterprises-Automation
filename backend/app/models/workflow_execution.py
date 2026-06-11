import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AgentTaskStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task import AgentTask
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.workflow import Workflow


class WorkflowExecution(Base, TimestampMixin):
    """Runtime record of one workflow run."""

    __tablename__ = "workflow_executions"

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
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
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
    status: Mapped[AgentTaskStatus] = mapped_column(
        Enum(
            AgentTaskStatus,
            name="agent_task_status",
            values_callable=lambda status_enum: [member.value for member in status_enum],
            create_type=False,
        ),
        nullable=False,
        default=AgentTaskStatus.PENDING,
        index=True,
    )
    final_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    organization: Mapped["Organization"] = relationship(back_populates="workflow_executions")
    workflow: Mapped["Workflow"] = relationship(back_populates="executions")
    agent_task: Mapped["AgentTask | None"] = relationship()
    created_by: Mapped["User | None"] = relationship(back_populates="created_workflow_executions")
