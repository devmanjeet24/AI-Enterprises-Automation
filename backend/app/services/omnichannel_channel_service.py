"""Create and manage omnichannel communication channels."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.ai_employee import AIEmployee
from app.models.enums import AIEmployeeStatus
from app.models.omnichannel_channel import OmnichannelChannel
from app.models.omnichannel_conversation import OmnichannelConversation
from app.schemas.omnichannel_channel import (
    OmnichannelChannelCreateRequest,
    OmnichannelChannelDetailResponse,
    OmnichannelChannelUpdateRequest,
)
from app.services.ai_employee_service import get_employee_or_404


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Channel slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_channel_id: uuid.UUID | None = None,
) -> None:
    query = select(OmnichannelChannel.id).where(
        OmnichannelChannel.organization_id == organization_id,
        OmnichannelChannel.slug == slug,
    )
    if exclude_channel_id is not None:
        query = query.where(OmnichannelChannel.id != exclude_channel_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Channel slug '{slug}' is already taken in this organization",
        )


def get_omnichannel_channel_or_404(
    db: Session,
    *,
    channel_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> OmnichannelChannel:
    channel = db.scalar(
        select(OmnichannelChannel).where(
            OmnichannelChannel.id == channel_id,
            OmnichannelChannel.organization_id == organization_id,
        )
    )
    if channel is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Omnichannel channel not found",
        )
    return channel


def list_omnichannel_channels(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> list[OmnichannelChannel]:
    return list(
        db.scalars(
            select(OmnichannelChannel)
            .where(OmnichannelChannel.organization_id == organization_id)
            .order_by(OmnichannelChannel.created_at.desc())
        ).all()
    )


def create_omnichannel_channel(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: OmnichannelChannelCreateRequest,
) -> OmnichannelChannel:
    if payload.ai_employee_id is not None:
        employee = get_employee_or_404(
            db,
            employee_id=payload.ai_employee_id,
            organization_id=organization_id,
        )
        if employee.status != AIEmployeeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Linked AI employee must be active",
            )

    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    channel = OmnichannelChannel(
        organization_id=organization_id,
        created_by_id=created_by_id,
        name=payload.name,
        slug=slug,
        channel_type=payload.channel_type,
        description=payload.description,
        ai_employee_id=payload.ai_employee_id,
        config=payload.config,
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel


def update_omnichannel_channel(
    db: Session,
    *,
    channel: OmnichannelChannel,
    organization_id: uuid.UUID,
    payload: OmnichannelChannelUpdateRequest,
) -> OmnichannelChannel:
    updates = payload.model_dump(exclude_unset=True)

    if "ai_employee_id" in updates and updates["ai_employee_id"] is not None:
        employee = get_employee_or_404(
            db,
            employee_id=updates["ai_employee_id"],
            organization_id=organization_id,
        )
        if employee.status != AIEmployeeStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Linked AI employee must be active",
            )

    for field in (
        "name",
        "description",
        "channel_type",
        "config",
        "is_active",
        "ai_employee_id",
    ):
        if field in updates:
            setattr(channel, field, updates[field])

    if "slug" in updates or "name" in updates:
        slug = _resolve_slug(
            updates.get("name", channel.name),
            updates.get("slug", channel.slug),
        )
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_channel_id=channel.id,
        )
        channel.slug = slug

    db.commit()
    db.refresh(channel)
    return channel


def delete_omnichannel_channel(db: Session, *, channel: OmnichannelChannel) -> None:
    db.delete(channel)
    db.commit()


def build_omnichannel_channel_detail_response(
    db: Session,
    *,
    channel: OmnichannelChannel,
) -> OmnichannelChannelDetailResponse:
    employee = (
        db.get(AIEmployee, channel.ai_employee_id) if channel.ai_employee_id else None
    )
    conversation_count = db.scalar(
        select(func.count())
        .select_from(OmnichannelConversation)
        .where(OmnichannelConversation.channel_id == channel.id)
    ) or 0

    return OmnichannelChannelDetailResponse(
        id=channel.id,
        organization_id=channel.organization_id,
        ai_employee_id=channel.ai_employee_id,
        created_by_id=channel.created_by_id,
        name=channel.name,
        slug=channel.slug,
        channel_type=channel.channel_type,
        description=channel.description,
        config=channel.config,
        is_active=channel.is_active,
        created_at=channel.created_at,
        updated_at=channel.updated_at,
        ai_employee_name=employee.name if employee else None,
        conversation_count=conversation_count,
    )
