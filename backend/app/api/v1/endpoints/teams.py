"""Team CRUD endpoints — scoped to the authenticated user's organization."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.text import slugify
from app.db.session import get_db
from app.models.department import Department
from app.models.team import Team
from app.schemas.team import TeamCreateRequest, TeamResponse, TeamUpdateRequest

router = APIRouter(prefix="/teams", tags=["teams"])


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team slug must contain at least one letter or number",
        )
    return resolved[:50]


def _get_department_for_org(
    db: Session,
    *,
    department_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Department:
    department = db.scalar(
        select(Department).where(
            Department.id == department_id,
            Department.organization_id == organization_id,
        )
    )
    if department is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )
    return department


def _get_team_or_404(
    db: Session,
    *,
    team_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Team:
    team = db.scalar(
        select(Team).where(
            Team.id == team_id,
            Team.organization_id == organization_id,
        )
    )
    if team is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found",
        )
    return team


def _ensure_unique_slug(
    db: Session,
    *,
    department_id: uuid.UUID,
    slug: str,
    exclude_team_id: uuid.UUID | None = None,
) -> None:
    query = select(Team.id).where(
        Team.department_id == department_id,
        Team.slug == slug,
    )
    if exclude_team_id is not None:
        query = query.where(Team.id != exclude_team_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Team slug '{slug}' is already taken in this department",
        )


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreateRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Team:
    """Create a team inside a department within the current user's organization."""
    _get_department_for_org(
        db,
        department_id=payload.department_id,
        organization_id=current_user.organization_id,
    )

    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, department_id=payload.department_id, slug=slug)

    team = Team(
        organization_id=current_user.organization_id,
        department_id=payload.department_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
    )
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("", response_model=list[TeamResponse])
def list_teams(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[Team]:
    """List all teams in the current user's organization."""
    return list(
        db.scalars(
            select(Team)
            .where(Team.organization_id == current_user.organization_id)
            .order_by(Team.name)
        ).all()
    )


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Team:
    """Get one team by id within the current organization."""
    return _get_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: uuid.UUID,
    payload: TeamUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> Team:
    """Update a team in the current organization."""
    team = _get_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    target_department_id = updates.get("department_id", team.department_id)
    if "department_id" in updates:
        _get_department_for_org(
            db,
            department_id=target_department_id,
            organization_id=current_user.organization_id,
        )
        team.department_id = target_department_id

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
            department_id=target_department_id,
            slug=slug,
            exclude_team_id=team.id,
        )
        team.slug = slug
    elif "department_id" in updates:
        _ensure_unique_slug(
            db,
            department_id=target_department_id,
            slug=team.slug,
            exclude_team_id=team.id,
        )

    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: uuid.UUID,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a team from the current organization."""
    team = _get_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    db.delete(team)
    db.commit()
