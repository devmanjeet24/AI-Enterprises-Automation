import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import WorkflowStatus
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_team import AgentTeam
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.workflow_execution import WorkflowExecution
    from app.models.workflow_step import WorkflowStep


class Workflow(Base, TimestampMixin):
    """A reusable ordered automation definition attached to an agent team."""

    __tablename__ = "workflows"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_workflows_organization_id_slug",
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
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[WorkflowStatus] = mapped_column(
        Enum(
            WorkflowStatus,
            name="workflow_status",
            values_callable=lambda status_enum: [member.value for member in status_enum],
        ),
        nullable=False,
        default=WorkflowStatus.DRAFT,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization: Mapped["Organization"] = relationship(back_populates="workflows")
    agent_team: Mapped["AgentTeam"] = relationship(back_populates="workflows")
    created_by: Mapped["User | None"] = relationship(back_populates="created_workflows")
    steps: Mapped[list["WorkflowStep"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.sequence_order",
    )
    executions: Mapped[list["WorkflowExecution"]] = relationship(
        back_populates="workflow",
        cascade="all, delete-orphan",
    )
