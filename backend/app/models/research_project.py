import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import ResearchProjectStatus, ResearchTemplateType
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_team import AgentTeam
    from app.models.organization import Organization
    from app.models.research_report import ResearchReport
    from app.models.user import User


class ResearchProject(Base, TimestampMixin):
    """A business research initiative assigned to an agent team."""

    __tablename__ = "research_projects"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_research_projects_organization_id_slug",
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
    research_brief: Mapped[str | None] = mapped_column(Text, nullable=True)
    template_type: Mapped[ResearchTemplateType] = mapped_column(
        Enum(
            ResearchTemplateType,
            name="research_template_type",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        index=True,
    )
    status: Mapped[ResearchProjectStatus] = mapped_column(
        Enum(
            ResearchProjectStatus,
            name="research_project_status",
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        nullable=False,
        default=ResearchProjectStatus.DRAFT,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization: Mapped["Organization"] = relationship(back_populates="research_projects")
    agent_team: Mapped["AgentTeam"] = relationship(back_populates="research_projects")
    created_by: Mapped["User | None"] = relationship(back_populates="created_research_projects")
    reports: Mapped[list["ResearchReport"]] = relationship(
        back_populates="research_project",
        cascade="all, delete-orphan",
    )
