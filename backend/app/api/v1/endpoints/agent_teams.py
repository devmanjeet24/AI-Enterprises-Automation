"""Multi-agent collaboration team management endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    AGENT_TEAMS_DELETE,
    AGENT_TEAMS_EXECUTE,
    AGENT_TEAMS_READ,
    AGENT_TEAMS_WRITE,
)
from app.schemas.agent_task import AgentTaskCreateRequest, AgentTaskResponse
from app.models.user import User
from app.schemas.agent_team import (
    AgentTeamCreateRequest,
    AgentTeamMemberAddRequest,
    AgentTeamMemberResponse,
    AgentTeamResponse,
    AgentTeamUpdateRequest,
)
from app.services.agent_task_service import create_agent_task
from app.services.agent_team_service import (
    add_team_member,
    create_agent_team,
    delete_agent_team,
    get_agent_team_or_404,
    list_agent_teams,
    list_team_members,
    remove_team_member,
    update_agent_team,
)

router = APIRouter(prefix="/agent-teams", tags=["agent-teams"])


@router.post("", response_model=AgentTeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: AgentTeamCreateRequest,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AgentTeamResponse:
    """Create a multi-agent collaboration team."""
    return create_agent_team(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[AgentTeamResponse])
def list_teams(
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AgentTeamResponse]:
    """List all agent teams in the current organization."""
    return list_agent_teams(db, organization_id=current_user.organization_id)


@router.get("/{team_id}", response_model=AgentTeamResponse)
def get_team(
    team_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> AgentTeamResponse:
    """Get one agent team by id."""
    return get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{team_id}", response_model=AgentTeamResponse)
def update_team(
    team_id: uuid.UUID,
    payload: AgentTeamUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AgentTeamResponse:
    """Update an agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    return update_agent_team(
        db,
        team=team,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete an agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    delete_agent_team(db, team=team)


@router.get("/{team_id}/members", response_model=list[AgentTeamMemberResponse])
def get_team_members(
    team_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[AgentTeamMemberResponse]:
    """List members of an agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    return list_team_members(db, team=team)


@router.post(
    "/{team_id}/members",
    response_model=AgentTeamMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_member(
    team_id: uuid.UUID,
    payload: AgentTeamMemberAddRequest,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> AgentTeamMemberResponse:
    """Add an active AI employee to an agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    return add_team_member(
        db,
        team=team,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.post(
    "/{team_id}/tasks",
    response_model=AgentTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_team_task(
    team_id: uuid.UUID,
    payload: AgentTaskCreateRequest,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_EXECUTE))],
    db: Annotated[Session, Depends(get_db)],
) -> AgentTaskResponse:
    """Submit a task to an active agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    return create_agent_task(
        db,
        team=team,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.delete("/{team_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    team_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(AGENT_TEAMS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Remove an AI employee from an agent team."""
    team = get_agent_team_or_404(
        db,
        team_id=team_id,
        organization_id=current_user.organization_id,
    )
    remove_team_member(db, team=team, member_id=member_id)
