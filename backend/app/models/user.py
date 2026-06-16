import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import TimestampMixin

if TYPE_CHECKING:
    from app.models.agent_task import AgentTask
    from app.models.agent_team import AgentTeam
    from app.models.ai_employee import AIEmployee
    from app.models.ai_employee_conversation import AIEmployeeConversation
    from app.models.knowledge_document import KnowledgeDocument
    from app.models.organization import Organization
    from app.models.role import Role
    from app.models.user_role import UserRole
    from app.models.user_invitation import UserInvitation
    from app.models.browser_profile import BrowserProfile
    from app.models.browser_task import BrowserTask
    from app.models.browser_task_execution import BrowserTaskExecution
    from app.models.research_project import ResearchProject
    from app.models.research_report import ResearchReport
    from app.models.support_ticket import SupportTicket
    from app.models.support_ticket_message import SupportTicketMessage
    from app.models.voice_agent import VoiceAgent
    from app.models.voice_session import VoiceSession
    from app.models.omnichannel_channel import OmnichannelChannel
    from app.models.omnichannel_conversation import OmnichannelConversation
    from app.models.omnichannel_message import OmnichannelMessage
    from app.models.workflow import Workflow
    from app.models.workflow_execution import WorkflowExecution


class User(Base, TimestampMixin):
    """A human account that belongs to one organization."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization: Mapped["Organization"] = relationship(back_populates="users")
    user_roles: Mapped[list["UserRole"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    roles: Mapped[list["Role"]] = relationship(
        secondary="user_roles",
        back_populates="users",
        viewonly=True,
    )
    sent_user_invitations: Mapped[list["UserInvitation"]] = relationship(
        back_populates="invited_by",
        foreign_keys="UserInvitation.invited_by_id",
    )
    accepted_user_invitations: Mapped[list["UserInvitation"]] = relationship(
        back_populates="accepted_by",
        foreign_keys="UserInvitation.accepted_by_id",
    )
    uploaded_documents: Mapped[list["KnowledgeDocument"]] = relationship(
        back_populates="uploaded_by",
    )
    created_ai_employees: Mapped[list["AIEmployee"]] = relationship(
        back_populates="created_by",
    )
    ai_employee_conversations: Mapped[list["AIEmployeeConversation"]] = relationship(
        back_populates="user",
    )
    created_agent_teams: Mapped[list["AgentTeam"]] = relationship(back_populates="created_by")
    created_agent_tasks: Mapped[list["AgentTask"]] = relationship(back_populates="created_by")
    created_workflows: Mapped[list["Workflow"]] = relationship(back_populates="created_by")
    created_workflow_executions: Mapped[list["WorkflowExecution"]] = relationship(
        back_populates="created_by",
    )
    created_research_projects: Mapped[list["ResearchProject"]] = relationship(
        back_populates="created_by",
    )
    created_research_reports: Mapped[list["ResearchReport"]] = relationship(
        back_populates="created_by",
    )
    created_browser_profiles: Mapped[list["BrowserProfile"]] = relationship(
        back_populates="created_by",
    )
    created_browser_tasks: Mapped[list["BrowserTask"]] = relationship(
        back_populates="created_by",
    )
    created_browser_task_executions: Mapped[list["BrowserTaskExecution"]] = relationship(
        back_populates="created_by",
    )
    created_support_tickets: Mapped[list["SupportTicket"]] = relationship(
        back_populates="created_by",
        foreign_keys="SupportTicket.created_by_id",
    )
    assigned_support_tickets: Mapped[list["SupportTicket"]] = relationship(
        back_populates="assigned_user",
        foreign_keys="SupportTicket.assigned_user_id",
    )
    support_ticket_messages: Mapped[list["SupportTicketMessage"]] = relationship(
        back_populates="author_user",
    )
    created_voice_agents: Mapped[list["VoiceAgent"]] = relationship(
        back_populates="created_by",
    )
    created_voice_sessions: Mapped[list["VoiceSession"]] = relationship(
        back_populates="created_by",
    )
    created_omnichannel_channels: Mapped[list["OmnichannelChannel"]] = relationship(
        back_populates="created_by",
    )
    created_omnichannel_conversations: Mapped[list["OmnichannelConversation"]] = relationship(
        back_populates="created_by",
        foreign_keys="OmnichannelConversation.created_by_id",
    )
    assigned_omnichannel_conversations: Mapped[list["OmnichannelConversation"]] = relationship(
        back_populates="assigned_user",
        foreign_keys="OmnichannelConversation.assigned_user_id",
    )
    omnichannel_messages: Mapped[list["OmnichannelMessage"]] = relationship(
        back_populates="author_user",
    )
