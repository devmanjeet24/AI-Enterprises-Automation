import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AgentTaskExecutionStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task import AgentTask
    from app.models.agent_team_member import AgentTeamMember
    from app.models.ai_employee import AIEmployee


class AgentTaskExecution(Base, TimestampMixin):
    """One agent's step within a multi-agent task pipeline."""

    __tablename__ = "agent_task_executions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    agent_task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ai_employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_team_member_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_team_members.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[AgentTaskExecutionStatus] = mapped_column(
        Enum(
            AgentTaskExecutionStatus,
            name="agent_task_execution_status",
            values_callable=lambda status_enum: [member.value for member in status_enum],
        ),
        nullable=False,
        default=AgentTaskExecutionStatus.PENDING,
        index=True,
    )
    input_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    output: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    agent_task: Mapped["AgentTask"] = relationship(back_populates="executions")
    ai_employee: Mapped["AIEmployee"] = relationship(back_populates="task_executions")
    agent_team_member: Mapped["AgentTeamMember | None"] = relationship()
