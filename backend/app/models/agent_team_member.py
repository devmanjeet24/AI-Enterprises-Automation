import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.agent_team import AgentTeam
    from app.models.ai_employee import AIEmployee


class AgentTeamMember(Base):
    """Links one active AI employee to one agent team with a collaboration role."""

    __tablename__ = "agent_team_members"
    __table_args__ = (
        UniqueConstraint(
            "agent_team_id",
            "ai_employee_id",
            name="uq_agent_team_members_team_id_employee_id",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    agent_team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agent_teams.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ai_employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("ai_employees.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    collaboration_role: Mapped[str] = mapped_column(String(100), nullable=False)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    agent_team: Mapped["AgentTeam"] = relationship(back_populates="members")
    ai_employee: Mapped["AIEmployee"] = relationship(back_populates="agent_team_memberships")
