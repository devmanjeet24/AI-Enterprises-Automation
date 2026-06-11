"""Create, configure, and manage multi-agent collaboration teams."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.text import slugify
from app.models.agent_team import AgentTeam
from app.models.agent_team_member import AgentTeamMember
from app.models.ai_employee import AIEmployee
from app.models.enums import AIEmployeeStatus
from app.schemas.agent_team import (
    AgentTeamCreateRequest,
    AgentTeamMemberAddRequest,
    AgentTeamUpdateRequest,
)


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent team slug must contain at least one letter or number",
        )
    return resolved[:50]


def get_agent_team_or_404(
    db: Session,
    *,
    team_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> AgentTeam:
    """Load one agent team within the given organization or raise 404."""
    team = db.scalar(
        select(AgentTeam).where(
            AgentTeam.id == team_id,
            AgentTeam.organization_id == organization_id,
        )
    )
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent team not found",
        )
    return team


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_team_id: uuid.UUID | None = None,
) -> None:
    query = select(AgentTeam.id).where(
        AgentTeam.organization_id == organization_id,
        AgentTeam.slug == slug,
    )
    if exclude_team_id is not None:
        query = query.where(AgentTeam.id != exclude_team_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Agent team slug '{slug}' is already taken in this organization",
        )


def _get_active_employee_for_org(
    db: Session,
    *,
    employee_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> AIEmployee:
    employee = db.scalar(
        select(AIEmployee).where(
            AIEmployee.id == employee_id,
            AIEmployee.organization_id == organization_id,
        )
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI employee not found in this organization",
        )
    if employee.status != AIEmployeeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active AI employees can be added to an agent team",
        )
    return employee


def list_agent_teams(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> list[AgentTeam]:
    """List all agent teams for one organization."""
    return list(
        db.scalars(
            select(AgentTeam)
            .where(AgentTeam.organization_id == organization_id)
            .order_by(AgentTeam.name)
        ).all()
    )


def create_agent_team(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: AgentTeamCreateRequest,
) -> AgentTeam:
    """Create a new agent team in the current organization."""
    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    team = AgentTeam(
        organization_id=organization_id,
        created_by_id=created_by_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


def update_agent_team(
    db: Session,
    *,
    team: AgentTeam,
    organization_id: uuid.UUID,
    payload: AgentTeamUpdateRequest,
) -> AgentTeam:
    """Apply partial updates to an agent team."""
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if "name" in updates:
        team.name = updates["name"]

    if "description" in updates:
        team.description = updates["description"]

    if "is_active" in updates:
        team.is_active = updates["is_active"]

    if "slug" in updates:
        slug = _resolve_slug(updates.get("name", team.name), updates["slug"])
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_team_id=team.id,
        )
        team.slug = slug

    db.commit()
    db.refresh(team)
    return team


def delete_agent_team(db: Session, *, team: AgentTeam) -> None:
    """Delete an agent team and cascade related memberships and tasks."""
    db.delete(team)
    db.commit()


def list_team_members(
    db: Session,
    *,
    team: AgentTeam,
) -> list[dict]:
    """Return team members with employee details, ordered by sequence."""
    members = list(
        db.scalars(
            select(AgentTeamMember)
            .where(AgentTeamMember.agent_team_id == team.id)
            .options(selectinload(AgentTeamMember.ai_employee))
            .order_by(AgentTeamMember.sequence_order, AgentTeamMember.added_at)
        ).all()
    )
    return [
        {
            "id": member.id,
            "agent_team_id": member.agent_team_id,
            "ai_employee_id": member.ai_employee_id,
            "collaboration_role": member.collaboration_role,
            "sequence_order": member.sequence_order,
            "added_at": member.added_at,
            "employee_name": member.ai_employee.name,
            "employee_role": member.ai_employee.role,
            "employee_status": member.ai_employee.status.value,
        }
        for member in members
    ]


def add_team_member(
    db: Session,
    *,
    team: AgentTeam,
    organization_id: uuid.UUID,
    payload: AgentTeamMemberAddRequest,
) -> dict:
    """Add an active AI employee to an agent team."""
    employee = _get_active_employee_for_org(
        db,
        employee_id=payload.ai_employee_id,
        organization_id=organization_id,
    )

    existing = db.scalar(
        select(AgentTeamMember).where(
            AgentTeamMember.agent_team_id == team.id,
            AgentTeamMember.ai_employee_id == employee.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="AI employee is already a member of this agent team",
        )

    member = AgentTeamMember(
        agent_team_id=team.id,
        ai_employee_id=employee.id,
        collaboration_role=payload.collaboration_role,
        sequence_order=payload.sequence_order,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return {
        "id": member.id,
        "agent_team_id": member.agent_team_id,
        "ai_employee_id": member.ai_employee_id,
        "collaboration_role": member.collaboration_role,
        "sequence_order": member.sequence_order,
        "added_at": member.added_at,
        "employee_name": employee.name,
        "employee_role": employee.role,
        "employee_status": employee.status.value,
    }


def remove_team_member(
    db: Session,
    *,
    team: AgentTeam,
    member_id: uuid.UUID,
) -> None:
    """Remove one member from an agent team."""
    member = db.scalar(
        select(AgentTeamMember).where(
            AgentTeamMember.id == member_id,
            AgentTeamMember.agent_team_id == team.id,
        )
    )
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent team member not found",
        )

    db.delete(member)
    db.commit()
