"""Voice AI agent endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    VOICE_AGENTS_DELETE,
    VOICE_AGENTS_READ,
    VOICE_AGENTS_WRITE,
)
from app.models.user import User
from app.schemas.voice_agent import (
    VoiceAgentCreateRequest,
    VoiceAgentDetailResponse,
    VoiceAgentResponse,
    VoiceAgentUpdateRequest,
    VoiceAnalyticsResponse,
)
from app.services.voice_agent_service import (
    build_voice_agent_detail_response,
    create_voice_agent,
    delete_voice_agent,
    get_voice_agent_or_404,
    list_voice_agents,
    update_voice_agent,
)
from app.services.voice_analytics_service import get_voice_analytics

router = APIRouter(prefix="/voice-agents", tags=["voice-agents"])


@router.get("/analytics", response_model=VoiceAnalyticsResponse)
def get_voice_analytics_endpoint(
    current_user: Annotated[User, Depends(require_permission(VOICE_AGENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceAnalyticsResponse:
    """Aggregate voice agent, session, and transcript metrics."""
    return get_voice_analytics(db, organization_id=current_user.organization_id)


@router.post("", response_model=VoiceAgentResponse, status_code=status.HTTP_201_CREATED)
def create_voice_agent_endpoint(
    payload: VoiceAgentCreateRequest,
    current_user: Annotated[User, Depends(require_permission(VOICE_AGENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceAgentResponse:
    """Create a voice agent linked to an AI employee."""
    return create_voice_agent(
        db,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        payload=payload,
    )


@router.get("", response_model=list[VoiceAgentResponse])
def list_voice_agents_endpoint(
    current_user: Annotated[User, Depends(require_permission(VOICE_AGENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[VoiceAgentResponse]:
    """List voice agents in the current organization."""
    return list_voice_agents(db, organization_id=current_user.organization_id)


@router.get("/{agent_id}", response_model=VoiceAgentDetailResponse)
def get_voice_agent_endpoint(
    agent_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_AGENTS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceAgentDetailResponse:
    """Get one voice agent with linked employee details."""
    agent = get_voice_agent_or_404(
        db,
        agent_id=agent_id,
        organization_id=current_user.organization_id,
    )
    return build_voice_agent_detail_response(db, agent=agent)


@router.patch("/{agent_id}", response_model=VoiceAgentResponse)
def update_voice_agent_endpoint(
    agent_id: uuid.UUID,
    payload: VoiceAgentUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(VOICE_AGENTS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> VoiceAgentResponse:
    """Update a voice agent."""
    agent = get_voice_agent_or_404(
        db,
        agent_id=agent_id,
        organization_id=current_user.organization_id,
    )
    return update_voice_agent(
        db,
        agent=agent,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_voice_agent_endpoint(
    agent_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(VOICE_AGENTS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a voice agent."""
    agent = get_voice_agent_or_404(
        db,
        agent_id=agent_id,
        organization_id=current_user.organization_id,
    )
    delete_voice_agent(db, agent=agent)
