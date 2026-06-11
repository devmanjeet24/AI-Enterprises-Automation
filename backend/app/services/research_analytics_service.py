"""Research analytics aggregation."""

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import AgentTaskStatus, ResearchProjectStatus
from app.models.research_project import ResearchProject
from app.models.research_report import ResearchReport


def get_research_analytics(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> dict:
    """Aggregate research project and report counts for the organization."""
    project_rows = db.execute(
        select(ResearchProject.status, func.count())
        .where(ResearchProject.organization_id == organization_id)
        .group_by(ResearchProject.status)
    ).all()
    projects_by_status = {status.value: count for status, count in project_rows}

    template_rows = db.execute(
        select(ResearchProject.template_type, func.count())
        .where(ResearchProject.organization_id == organization_id)
        .group_by(ResearchProject.template_type)
    ).all()
    projects_by_template = {template.value: count for template, count in template_rows}

    report_rows = db.execute(
        select(ResearchReport.status, func.count())
        .where(ResearchReport.organization_id == organization_id)
        .group_by(ResearchReport.status)
    ).all()
    reports_by_status = {status.value: count for status, count in report_rows}

    total_projects = sum(projects_by_status.values())
    total_reports = sum(reports_by_status.values())

    seven_days_ago = datetime.now(UTC) - timedelta(days=7)
    recent_runs_7d = db.scalar(
        select(func.count())
        .select_from(ResearchReport)
        .where(
            ResearchReport.organization_id == organization_id,
            ResearchReport.created_at >= seven_days_ago,
        )
    ) or 0

    active_projects = projects_by_status.get(ResearchProjectStatus.ACTIVE.value, 0)
    completed_reports = reports_by_status.get(AgentTaskStatus.COMPLETED.value, 0)
    failed_reports = reports_by_status.get(AgentTaskStatus.FAILED.value, 0)

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "projects_by_status": projects_by_status,
        "projects_by_template": projects_by_template,
        "total_reports": total_reports,
        "completed_reports": completed_reports,
        "failed_reports": failed_reports,
        "reports_by_status": reports_by_status,
        "recent_runs_7d": recent_runs_7d,
    }
