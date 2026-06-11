"""Dashboard overview aggregation for the authenticated organization."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.agent_task import AgentTask
from app.models.ai_employee import AIEmployee
from app.models.browser_task import BrowserTask
from app.models.department import Department
from app.models.knowledge_document import KnowledgeDocument
from app.models.research_project import ResearchProject
from app.models.team import Team
from app.models.user import User
from app.models.workflow import Workflow


def get_dashboard_overview(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> dict[str, int]:
    """Count core resources for one organization in a single round trip."""
    counts = db.execute(
        select(
            select(func.count())
            .select_from(User)
            .where(User.organization_id == organization_id)
            .scalar_subquery()
            .label("total_users"),
            select(func.count())
            .select_from(Department)
            .where(Department.organization_id == organization_id)
            .scalar_subquery()
            .label("total_departments"),
            select(func.count())
            .select_from(Team)
            .where(Team.organization_id == organization_id)
            .scalar_subquery()
            .label("total_teams"),
            select(func.count())
            .select_from(KnowledgeDocument)
            .where(KnowledgeDocument.organization_id == organization_id)
            .scalar_subquery()
            .label("total_documents"),
            select(func.count())
            .select_from(AIEmployee)
            .where(AIEmployee.organization_id == organization_id)
            .scalar_subquery()
            .label("total_ai_employees"),
            select(func.count())
            .select_from(AgentTask)
            .where(AgentTask.organization_id == organization_id)
            .scalar_subquery()
            .label("total_agent_tasks"),
            select(func.count())
            .select_from(Workflow)
            .where(Workflow.organization_id == organization_id)
            .scalar_subquery()
            .label("total_workflows"),
            select(func.count())
            .select_from(ResearchProject)
            .where(ResearchProject.organization_id == organization_id)
            .scalar_subquery()
            .label("total_research_projects"),
            select(func.count())
            .select_from(BrowserTask)
            .where(BrowserTask.organization_id == organization_id)
            .scalar_subquery()
            .label("total_browser_tasks"),
        )
    ).one()

    return {
        "total_users": counts.total_users or 0,
        "total_departments": counts.total_departments or 0,
        "total_teams": counts.total_teams or 0,
        "total_documents": counts.total_documents or 0,
        "total_ai_employees": counts.total_ai_employees or 0,
        "total_agent_tasks": counts.total_agent_tasks or 0,
        "total_workflows": counts.total_workflows or 0,
        "total_research_projects": counts.total_research_projects or 0,
        "total_browser_tasks": counts.total_browser_tasks or 0,
    }
