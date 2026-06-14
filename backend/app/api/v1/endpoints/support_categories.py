"""Support ticket category endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.authorization import require_permission
from app.core.permissions import (
    SUPPORT_CATEGORIES_DELETE,
    SUPPORT_CATEGORIES_READ,
    SUPPORT_CATEGORIES_WRITE,
)
from app.models.user import User
from app.schemas.support_category import (
    SupportCategoryCreateRequest,
    SupportCategoryResponse,
    SupportCategoryUpdateRequest,
)
from app.services.support_category_service import (
    create_support_category,
    delete_support_category,
    get_support_category_or_404,
    list_support_categories,
    update_support_category,
)

router = APIRouter(prefix="/support-categories", tags=["support-categories"])


@router.post("", response_model=SupportCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_support_category_endpoint(
    payload: SupportCategoryCreateRequest,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_CATEGORIES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportCategoryResponse:
    """Create a support ticket category."""
    return create_support_category(
        db,
        organization_id=current_user.organization_id,
        payload=payload,
    )


@router.get("", response_model=list[SupportCategoryResponse])
def list_support_categories_endpoint(
    current_user: Annotated[User, Depends(require_permission(SUPPORT_CATEGORIES_READ))],
    db: Annotated[Session, Depends(get_db)],
    active_only: Annotated[bool, Query()] = False,
) -> list[SupportCategoryResponse]:
    """List support ticket categories in the current organization."""
    return list_support_categories(
        db,
        organization_id=current_user.organization_id,
        active_only=active_only,
    )


@router.get("/{category_id}", response_model=SupportCategoryResponse)
def get_support_category_endpoint(
    category_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_CATEGORIES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportCategoryResponse:
    """Get one support ticket category."""
    return get_support_category_or_404(
        db,
        category_id=category_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{category_id}", response_model=SupportCategoryResponse)
def update_support_category_endpoint(
    category_id: uuid.UUID,
    payload: SupportCategoryUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_CATEGORIES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> SupportCategoryResponse:
    """Update a support ticket category."""
    category = get_support_category_or_404(
        db,
        category_id=category_id,
        organization_id=current_user.organization_id,
    )
    return update_support_category(db, category=category, payload=payload)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_support_category_endpoint(
    category_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(SUPPORT_CATEGORIES_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a support ticket category."""
    category = get_support_category_or_404(
        db,
        category_id=category_id,
        organization_id=current_user.organization_id,
    )
    delete_support_category(db, category=category)
