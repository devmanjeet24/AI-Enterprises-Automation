import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task import AgentTask
    from app.models.agent_team_member import AgentTeamMember
    from app.models.organization import Organization
    from app.models.user import User
    from app.models.research_project import ResearchProject
    from app.models.workflow import Workflow


class AgentTeam(Base, TimestampMixin):
    """A collaboration group of AI employees that work together on tasks."""

    __tablename__ = "agent_teams"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_agent_teams_organization_id_slug",
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
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization: Mapped["Organization"] = relationship(back_populates="agent_teams")
    created_by: Mapped["User | None"] = relationship(back_populates="created_agent_teams")
    members: Mapped[list["AgentTeamMember"]] = relationship(
        back_populates="agent_team",
        cascade="all, delete-orphan",
        order_by="AgentTeamMember.sequence_order",
    )
    tasks: Mapped[list["AgentTask"]] = relationship(
        back_populates="agent_team",
        cascade="all, delete-orphan",
    )
    workflows: Mapped[list["Workflow"]] = relationship(
        back_populates="agent_team",
        cascade="all, delete-orphan",
    )
    research_projects: Mapped[list["ResearchProject"]] = relationship(
        back_populates="agent_team",
        cascade="all, delete-orphan",
    )
