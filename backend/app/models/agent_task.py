import uuid
from typing import TYPE_CHECKING, Any

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import AgentTaskStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task_execution import AgentTaskExecution
    from app.models.agent_team import AgentTeam
    from app.models.organization import Organization
    from app.models.user import User


class AgentTask(Base, TimestampMixin):
    """A user request assigned to an agent team for multi-step collaboration."""

    __tablename__ = "agent_tasks"

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
    agent_team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AgentTaskStatus] = mapped_column(
        Enum(
            AgentTaskStatus,
            name="agent_task_status",
            values_callable=lambda status_enum: [member.value for member in status_enum],
        ),
        nullable=False,
        default=AgentTaskStatus.PENDING,
        index=True,
    )
    input_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    result: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="agent_tasks")
    agent_team: Mapped["AgentTeam"] = relationship(back_populates="tasks")
    created_by: Mapped["User | None"] = relationship(back_populates="created_agent_tasks")
    executions: Mapped[list["AgentTaskExecution"]] = relationship(
        back_populates="agent_task",
        cascade="all, delete-orphan",
        order_by="AgentTaskExecution.sequence_order",
    )
