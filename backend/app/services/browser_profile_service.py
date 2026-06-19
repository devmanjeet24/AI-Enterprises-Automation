"""Create and manage browser automation profiles."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.browser_profile import BrowserProfile
from app.schemas.browser_profile import BrowserProfileCreateRequest, BrowserProfileUpdateRequest
from app.services.browser_profile_session_service import (
    delete_profile_session_files,
    sync_profile_session_on_update,
)


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Browser profile slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_profile_id: uuid.UUID | None = None,
) -> None:
    query = select(BrowserProfile.id).where(
        BrowserProfile.organization_id == organization_id,
        BrowserProfile.slug == slug,
    )
    if exclude_profile_id is not None:
        query = query.where(BrowserProfile.id != exclude_profile_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Browser profile slug '{slug}' is already taken in this organization",
        )


def get_browser_profile_or_404(
    db: Session,
    *,
    profile_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> BrowserProfile:
    profile = db.scalar(
        select(BrowserProfile).where(
            BrowserProfile.id == profile_id,
            BrowserProfile.organization_id == organization_id,
        )
    )
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Browser profile not found",
        )
    return profile


def list_browser_profiles(
    db: Session,
    *,
    organization_id: uuid.UUID,
) -> list[BrowserProfile]:
    return list(
        db.scalars(
            select(BrowserProfile)
            .where(BrowserProfile.organization_id == organization_id)
            .order_by(BrowserProfile.created_at.desc())
        ).all()
    )


def create_browser_profile(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: BrowserProfileCreateRequest,
) -> BrowserProfile:
    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    profile = BrowserProfile(
        organization_id=organization_id,
        created_by_id=created_by_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        user_agent=payload.user_agent,
        viewport_width=payload.viewport_width,
        viewport_height=payload.viewport_height,
        config=payload.config,
        session_persistence_enabled=payload.session_persistence_enabled,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def update_browser_profile(
    db: Session,
    *,
    profile: BrowserProfile,
    organization_id: uuid.UUID,
    payload: BrowserProfileUpdateRequest,
) -> BrowserProfile:
    updates = payload.model_dump(exclude_unset=True)

    for field in (
        "name",
        "description",
        "user_agent",
        "viewport_width",
        "viewport_height",
        "config",
        "is_active",
        "session_persistence_enabled",
    ):
        if field in updates:
            setattr(profile, field, updates[field])

    if "session_persistence_enabled" in updates:
        sync_profile_session_on_update(
            db,
            profile=profile,
            session_persistence_enabled=updates["session_persistence_enabled"],
        )

    if "slug" in updates or "name" in updates:
        slug = _resolve_slug(
            updates.get("name", profile.name),
            updates.get("slug", profile.slug),
        )
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_profile_id=profile.id,
        )
        profile.slug = slug

    db.commit()
    db.refresh(profile)
    return profile


def delete_browser_profile(db: Session, *, profile: BrowserProfile) -> None:
    delete_profile_session_files(profile)
    db.delete(profile)
    db.commit()
