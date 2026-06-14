"""Create and manage support ticket categories."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.text import slugify
from app.models.support_ticket_category import SupportTicketCategory
from app.schemas.support_category import (
    SupportCategoryCreateRequest,
    SupportCategoryUpdateRequest,
)


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category slug must contain at least one letter or number",
        )
    return resolved[:50]


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_category_id: uuid.UUID | None = None,
) -> None:
    query = select(SupportTicketCategory.id).where(
        SupportTicketCategory.organization_id == organization_id,
        SupportTicketCategory.slug == slug,
    )
    if exclude_category_id is not None:
        query = query.where(SupportTicketCategory.id != exclude_category_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category slug '{slug}' is already taken in this organization",
        )


def get_support_category_or_404(
    db: Session,
    *,
    category_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> SupportTicketCategory:
    category = db.scalar(
        select(SupportTicketCategory).where(
            SupportTicketCategory.id == category_id,
            SupportTicketCategory.organization_id == organization_id,
        )
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Support category not found",
        )
    return category


def list_support_categories(
    db: Session,
    *,
    organization_id: uuid.UUID,
    active_only: bool = False,
) -> list[SupportTicketCategory]:
    query = select(SupportTicketCategory).where(
        SupportTicketCategory.organization_id == organization_id,
    )
    if active_only:
        query = query.where(SupportTicketCategory.is_active.is_(True))
    return list(db.scalars(query.order_by(SupportTicketCategory.name)).all())


def create_support_category(
    db: Session,
    *,
    organization_id: uuid.UUID,
    payload: SupportCategoryCreateRequest,
) -> SupportTicketCategory:
    slug = _resolve_slug(payload.name, payload.slug)
    _ensure_unique_slug(db, organization_id=organization_id, slug=slug)

    category = SupportTicketCategory(
        organization_id=organization_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
        color=payload.color,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_support_category(
    db: Session,
    *,
    category: SupportTicketCategory,
    payload: SupportCategoryUpdateRequest,
) -> SupportTicketCategory:
    if payload.name is not None:
        category.name = payload.name
    if payload.slug is not None or payload.name is not None:
        slug = _resolve_slug(payload.name or category.name, payload.slug or category.slug)
        _ensure_unique_slug(
            db,
            organization_id=category.organization_id,
            slug=slug,
            exclude_category_id=category.id,
        )
        category.slug = slug
    if payload.description is not None:
        category.description = payload.description
    if payload.color is not None:
        category.color = payload.color
    if payload.is_active is not None:
        category.is_active = payload.is_active

    db.commit()
    db.refresh(category)
    return category


def delete_support_category(
    db: Session,
    *,
    category: SupportTicketCategory,
) -> None:
    db.delete(category)
    db.commit()
