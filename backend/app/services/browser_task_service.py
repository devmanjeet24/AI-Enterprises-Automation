"""Create and manage browser automation task definitions."""

import uuid

from fastapi import HTTPException, status
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.browser_task import BrowserTask
from app.models.enums import BrowserTaskStatus
from app.schemas.browser_step import parse_browser_task_config
from app.schemas.browser_task import BrowserTaskCreateRequest, BrowserTaskUpdateRequest
from app.services.browser_profile_service import get_browser_profile_or_404


def _validate_task_config(config: dict | None) -> None:
    if config is None:
        return
    try:
        parse_browser_task_config(config)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.errors(),
        ) from exc


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Browser task slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_task_id: uuid.UUID | None = None,
) -> None:
    query = select(BrowserTask.id).where(
        BrowserTask.organization_id == organization_id,
        BrowserTask.slug == slug,
    )
    if exclude_task_id is not None:
        query = query.where(BrowserTask.id != exclude_task_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Browser task slug '{slug}' is already taken in this organization",
        )


def _ensure_active_browser_profile(profile) -> None:
    if not profile.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Browser tasks must be attached to an active browser profile",
        )


def get_browser_task_or_404(
    db: Session,
    *,
    task_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> BrowserTask:
    task = db.scalar(
        select(BrowserTask).where(
            BrowserTask.id == task_id,
            BrowserTask.organization_id == organization_id,
        )
    )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Browser task not found",
        )
    return task


def list_browser_tasks(
    db: Session,
    *,
    organization_id: uuid.UUID,
    profile_id: uuid.UUID | None = None,
) -> list[BrowserTask]:
    query = select(BrowserTask).where(BrowserTask.organization_id == organization_id)
    if profile_id is not None:
        query = query.where(BrowserTask.browser_profile_id == profile_id)
    return list(db.scalars(query.order_by(BrowserTask.created_at.desc())).all())


def create_browser_task(
    db: Session,
    *,
    organization_id: uuid.UUID,
    created_by_id: uuid.UUID,
    payload: BrowserTaskCreateRequest,
) -> BrowserTask:
    profile = get_browser_profile_or_404(
        db,
        profile_id=payload.browser_profile_id,
        organization_id=organization_id,
    )
    _ensure_active_browser_profile(profile)

    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)
    _validate_task_config(payload.config)

    task = BrowserTask(
        organization_id=organization_id,
        browser_profile_id=profile.id,
        created_by_id=created_by_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        target_url=payload.target_url,
        instructions=payload.instructions,
        status=BrowserTaskStatus.DRAFT,
        config=payload.config,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_browser_task(
    db: Session,
    *,
    task: BrowserTask,
    organization_id: uuid.UUID,
    payload: BrowserTaskUpdateRequest,
) -> BrowserTask:
    updates = payload.model_dump(exclude_unset=True)

    if "config" in updates:
        _validate_task_config(updates["config"])

    if "browser_profile_id" in updates:
        profile = get_browser_profile_or_404(
            db,
            profile_id=updates["browser_profile_id"],
            organization_id=organization_id,
        )
        _ensure_active_browser_profile(profile)
        task.browser_profile_id = profile.id

    for field in ("name", "description", "target_url", "instructions", "status", "config"):
        if field in updates:
            setattr(task, field, updates[field])

    if "slug" in updates or "name" in updates:
        slug = _resolve_slug(
            updates.get("name", task.name),
            updates.get("slug", task.slug),
        )
        _ensure_unique_slug(
            db,
            organization_id=organization_id,
            slug=slug,
            exclude_task_id=task.id,
        )
        task.slug = slug

    db.commit()
    db.refresh(task)
    return task


def delete_browser_task(db: Session, *, task: BrowserTask) -> None:
    db.delete(task)
    db.commit()
