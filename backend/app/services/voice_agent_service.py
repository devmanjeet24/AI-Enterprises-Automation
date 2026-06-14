"""Create and manage voice AI agents."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.ai_employee import AIEmployee
from app.models.enums import AIEmployeeStatus
from app.models.voice_agent import VoiceAgent
from app.models.voice_session import VoiceSession
from app.schemas.voice_agent import (
    VoiceAgentCreateRequest,
    VoiceAgentDetailResponse,
    VoiceAgentUpdateRequest,
)
from app.services.ai_employee_service import get_employee_or_404


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice agent slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_agent_id: uuid.UUID | None = None,
) -> None:
    query = select(VoiceAgent.id).where(
        VoiceAgent.organization_id == organization_id,
        VoiceAgent.slug == slug,
    )
    if exclude_agent_id is not None:
        query = query.where(VoiceAgent.id != exclude_agent_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Voice agent slug '{slug}' is already taken in this organization",
        )


def _validate_ai_employee(
    db: Session,
    *,
    employee_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> AIEmployee:
    employee = get_employee_or_404(
        db,
        employee_id=employee_id,
        organization_id=organization_id,
    )
    if employee.status != AIEmployeeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Linked AI employee must be active",
        )
    return employee


def get_voice_agent_or_404(
    db: Session,
    *,
    agent_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> VoiceAgent:
    agent = db.scalar(
        select(VoiceAgent).where(
            VoiceAgent.id == agent_id,
            VoiceAgent.organization_id == organization_id,
        )
    )
    if agent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Voice agent not found",
        )
    return agent


def list_voice_agents(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> list[VoiceAgent]:
    return list(
        db.scalars(
            select(VoiceAgent)
            .where(VoiceAgent.organization_id == organization_id)
            .order_by(VoiceAgent.created_at.desc())
        ).all()
    )


def create_voice_agent(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: VoiceAgentCreateRequest,
) -> VoiceAgent:
    _validate_ai_employee(
        db,
        employee_id=payload.ai_employee_id,
        organization_id=organization_id,
    )
    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    agent = VoiceAgent(
        organization_id=organization_id,
        created_by_id=created_by_id,
        ai_employee_id=payload.ai_employee_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        config=payload.config,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


def update_voice_agent(
    db: Session,
    *,
    agent: VoiceAgent,
    organization_id: uuid.UUID,
    payload: VoiceAgentUpdateRequest,
) -> VoiceAgent:
    updates = payload.model_dump(exclude_unset=True)

    if "ai_employee_id" in updates and updates["ai_employee_id"] is not None:
        _validate_ai_employee(
            db,
            employee_id=updates["ai_employee_id"],
            organization_id=organization_id,
        )

    for field in ("name", "description", "config", "is_active", "ai_employee_id"):
        if field in updates:
            setattr(agent, field, updates[field])

    if "slug" in updates or "name" in updates:
        slug = _resolve_slug(
            updates.get("name", agent.name),
            updates.get("slug", agent.slug),
        )
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_agent_id=agent.id,
        )
        agent.slug = slug

    db.commit()
    db.refresh(agent)
    return agent


def delete_voice_agent(db: Session, *, agent: VoiceAgent) -> None:
    db.delete(agent)
    db.commit()


def build_voice_agent_detail_response(
    db: Session,
    *,
    agent: VoiceAgent,
) -> VoiceAgentDetailResponse:
    employee = db.get(AIEmployee, agent.ai_employee_id)
    session_count = db.scalar(
        select(func.count())
        .select_from(VoiceSession)
        .where(VoiceSession.voice_agent_id == agent.id)
    ) or 0

    return VoiceAgentDetailResponse(
        id=agent.id,
        organization_id=agent.organization_id,
        ai_employee_id=agent.ai_employee_id,
        created_by_id=agent.created_by_id,
        name=agent.name,
        slug=agent.slug,
        description=agent.description,
        config=agent.config,
        is_active=agent.is_active,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        ai_employee_name=employee.name if employee else None,
        session_count=session_count,
    )
