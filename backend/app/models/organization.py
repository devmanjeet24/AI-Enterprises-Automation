import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task import AgentTask
    from app.models.agent_team import AgentTeam
    from app.models.ai_employee import AIEmployee
    from app.models.ai_employee_conversation import AIEmployeeConversation
    from app.models.department import Department
    from app.models.document_chunk import DocumentChunk
    from app.models.knowledge_document import KnowledgeDocument
    from app.models.permission import Permission
    from app.models.role import Role
    from app.models.team import Team
    from app.models.user import User
    from app.models.browser_profile import BrowserProfile
    from app.models.browser_task import BrowserTask
    from app.models.browser_task_execution import BrowserTaskExecution
    from app.models.research_project import ResearchProject
    from app.models.research_report import ResearchReport
    from app.models.workflow import Workflow
    from app.models.workflow_execution import WorkflowExecution


class Organization(Base, TimestampMixin):
    """A tenant boundary — every business record belongs to one organization."""

    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    roles: Mapped[list["Role"]] = relationship(back_populates="organization")
    departments: Mapped[list["Department"]] = relationship(back_populates="organization")
    teams: Mapped[list["Team"]] = relationship(back_populates="organization")
    permissions: Mapped[list["Permission"]] = relationship(back_populates="organization")
    knowledge_documents: Mapped[list["KnowledgeDocument"]] = relationship(
        back_populates="organization",
    )
    document_chunks: Mapped[list["DocumentChunk"]] = relationship(back_populates="organization")
    ai_employees: Mapped[list["AIEmployee"]] = relationship(back_populates="organization")
    ai_employee_conversations: Mapped[list["AIEmployeeConversation"]] = relationship(
        back_populates="organization",
    )
    agent_teams: Mapped[list["AgentTeam"]] = relationship(back_populates="organization")
    agent_tasks: Mapped[list["AgentTask"]] = relationship(back_populates="organization")
    workflows: Mapped[list["Workflow"]] = relationship(back_populates="organization")
    workflow_executions: Mapped[list["WorkflowExecution"]] = relationship(
        back_populates="organization",
    )
    research_projects: Mapped[list["ResearchProject"]] = relationship(
        back_populates="organization",
    )
    research_reports: Mapped[list["ResearchReport"]] = relationship(
        back_populates="organization",
    )
    browser_profiles: Mapped[list["BrowserProfile"]] = relationship(
        back_populates="organization",
    )
    browser_tasks: Mapped[list["BrowserTask"]] = relationship(
        back_populates="organization",
    )
    browser_task_executions: Mapped[list["BrowserTaskExecution"]] = relationship(
        back_populates="organization",
    )
