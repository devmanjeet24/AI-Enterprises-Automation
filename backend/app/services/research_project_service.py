"""Create and manage business research projects."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.agent_team import AgentTeam
from app.models.enums import ResearchProjectStatus
from app.models.research_project import ResearchProject
from app.schemas.research_project import ResearchProjectCreateRequest, ResearchProjectUpdateRequest
from app.services.agent_team_service import get_agent_team_or_404


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research project slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_project_id: uuid.UUID | None = None,
) -> None:
    query = select(ResearchProject.id).where(
        ResearchProject.organization_id == organization_id,
        ResearchProject.slug == slug,
    )
    if exclude_project_id is not None:
        query = query.where(ResearchProject.id != exclude_project_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Research project slug '{slug}' is already taken in this organization",
        )


def _ensure_active_agent_team(team: AgentTeam) -> None:
    if not team.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research projects must be attached to an active agent team",
        )


def get_research_project_or_404(
    db: Session,
    *,
    project_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> ResearchProject:
    project = db.scalar(
        select(ResearchProject).where(
            ResearchProject.id == project_id,
            ResearchProject.organization_id == organization_id,
        )
    )
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Research project not found",
        )
    return project


def list_research_projects(
    db: Session,
    *,
    organization_id: uuid.UUID,
    status: ResearchProjectStatus | None = None,
) -> list[ResearchProject]:
    query = select(ResearchProject).where(ResearchProject.organization_id == organization_id)
    if status is not None:
        query = query.where(ResearchProject.status == status)
    return list(db.scalars(query.order_by(ResearchProject.created_at.desc())).all())


def create_research_project(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: ResearchProjectCreateRequest,
) -> ResearchProject:
    team = get_agent_team_or_404(
        db,
        team_id=payload.agent_team_id,
        organization_id=organization_id,
    )
    _ensure_active_agent_team(team)

    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    project = ResearchProject(
        organization_id=organization_id,
        agent_team_id=team.id,
        created_by_id=created_by_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        research_brief=payload.research_brief,
        template_type=payload.template_type,
        status=ResearchProjectStatus.DRAFT,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_research_project(
    db: Session,
    *,
    project: ResearchProject,
    organization_id: uuid.UUID,
    payload: ResearchProjectUpdateRequest,
) -> ResearchProject:
    updates = payload.model_dump(exclude_unset=True)

    if "agent_team_id" in updates:
        team = get_agent_team_or_404(
            db,
            team_id=updates["agent_team_id"],
            organization_id=organization_id,
        )
        _ensure_active_agent_team(team)
        project.agent_team_id = team.id

    if "name" in updates:
        project.name = updates["name"]
    if "description" in updates:
        project.description = updates["description"]
    if "research_brief" in updates:
        project.research_brief = updates["research_brief"]
    if "template_type" in updates:
        project.template_type = updates["template_type"]
    if "status" in updates:
        project.status = updates["status"]
    if "is_active" in updates:
        project.is_active = updates["is_active"]

    if "slug" in updates or "name" in updates:
        slug = _resolve_slug(
            updates.get("name", project.name),
            updates.get("slug", project.slug),
        )
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_project_id=project.id,
        )
        project.slug = slug

    db.commit()
    db.refresh(project)
    return project


def delete_research_project(db: Session, *, project: ResearchProject) -> None:
    db.delete(project)
    db.commit()
