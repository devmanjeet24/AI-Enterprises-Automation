"""Role management endpoints — scoped to the authenticated user's organization."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.authorization import require_permission
from app.core.permissions import ROLES_DELETE, ROLES_READ, ROLES_WRITE, SYSTEM_ROLE_SLUGS
from app.core.text import slugify
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.role import (
    PermissionSummary,
    RoleCreateRequest,
    RoleDetailResponse,
    RoleResponse,
    RoleUpdateRequest,
)

router = APIRouter(prefix="/roles", tags=["roles"])


def _resolve_slug(name: str, slug: str | None) -> str:
    resolved = slugify(slug) if slug else slugify(name)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role slug must contain at least one letter or number",
        )
    return resolved[:50]


def _get_role_or_404(
    db: Session,
    *,
    role_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Role:
    role = db.scalar(
        select(Role)
        .where(
            Role.id == role_id,
            Role.organization_id == organization_id,
        )
        .options(selectinload(Role.permissions))
    )
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


def _ensure_unique_slug(
    db: Session,
    *,
    organization_id: uuid.UUID,
    slug: str,
    exclude_role_id: uuid.UUID | None = None,
) -> None:
    query = select(Role.id).where(
        Role.organization_id == organization_id,
        Role.slug == slug,
    )
    if exclude_role_id is not None:
        query = query.where(Role.id != exclude_role_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role slug '{slug}' is already taken in this organization",
        )


def _build_role_detail_response(role: Role) -> RoleDetailResponse:
    return RoleDetailResponse(
        id=role.id,
        organization_id=role.organization_id,
        name=role.name,
        slug=role.slug,
        description=role.description,
        is_active=role.is_active,
        created_at=role.created_at,
        updated_at=role.updated_at,
        permissions=[PermissionSummary.model_validate(permission) for permission in role.permissions],
    )


@router.get("", response_model=list[RoleResponse])
def list_roles(
    current_user: Annotated[User, Depends(require_permission(ROLES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[Role]:
    """List all roles in the current organization."""
    return list(
        db.scalars(
            select(Role)
            .where(Role.organization_id == current_user.organization_id)
            .order_by(Role.name)
        ).all()
    )


@router.get("/{role_id}", response_model=RoleDetailResponse)
def get_role(
    role_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(ROLES_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> RoleDetailResponse:
    """Get one role by id, including its granted permissions."""
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )
    return _build_role_detail_response(role)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreateRequest,
    current_user: Annotated[User, Depends(require_permission(ROLES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> Role:
    """Create a custom role inside the current organization."""
    slug = _resolve_slug(payload.name, payload.slug)
    if slug in SYSTEM_ROLE_SLUGS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role slug '{slug}' is reserved for system roles",
        )
    _ensure_unique_slug(db, organization_id=current_user.organization_id, slug=slug)

    role = Role(
        organization_id=current_user.organization_id,
        name=payload.name,
        slug=slug,
        description=payload.description,
    )
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.patch("/{role_id}", response_model=RoleResponse)
def update_role(
    role_id: uuid.UUID,
    payload: RoleUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(ROLES_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> Role:
    """Update a role in the current organization."""
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if "name" in updates:
        role.name = updates["name"]

    if "description" in updates:
        role.description = updates["description"]

    if "is_active" in updates:
        if role.slug in SYSTEM_ROLE_SLUGS and updates["is_active"] is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System roles cannot be deactivated",
            )
        role.is_active = updates["is_active"]

    if "slug" in updates:
        if role.slug in SYSTEM_ROLE_SLUGS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System role slugs cannot be changed",
            )
        slug = _resolve_slug(updates.get("name", role.name), updates["slug"])
        if slug in SYSTEM_ROLE_SLUGS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role slug '{slug}' is reserved for system roles",
            )
        _ensure_unique_slug(
            db,
            organization_id=current_user.organization_id,
            slug=slug,
            exclude_role_id=role.id,
        )
        role.slug = slug

    db.commit()
    db.refresh(role)
    return role


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(ROLES_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a custom role from the current organization."""
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )

    if role.slug in SYSTEM_ROLE_SLUGS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System roles cannot be deleted",
        )

    assignment_count = db.scalar(
        select(func.count())
        .select_from(UserRole)
        .where(UserRole.role_id == role.id)
    ) or 0
    if assignment_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a role that is still assigned to users",
        )

    db.delete(role)
    db.commit()
