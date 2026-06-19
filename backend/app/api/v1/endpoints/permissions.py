"""Permission CRUD and role-permission assignment endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.authorization import require_permission
from app.core.permissions import (
    PERMISSIONS_ASSIGN,
    PERMISSIONS_DELETE,
    PERMISSIONS_READ,
    PERMISSIONS_WRITE,
)
from app.core.rbac_guards import ensure_can_delete_permission, ensure_can_revoke_permission_from_role
from app.db.session import get_db
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.schemas.permission import (
    PermissionCreateRequest,
    PermissionResponse,
    PermissionUpdateRequest,
    RolePermissionAssignRequest,
    RolePermissionResponse,
)

router = APIRouter(prefix="/permissions", tags=["permissions"])


def _get_permission_or_404(
    db: Session,
    *,
    permission_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Permission:
    permission = db.scalar(
        select(Permission).where(
            Permission.id == permission_id,
            Permission.organization_id == organization_id,
        )
    )
    if permission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found",
        )
    return permission


def _get_role_or_404(
    db: Session,
    *,
    role_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> Role:
    role = db.scalar(
        select(Role).where(
            Role.id == role_id,
            Role.organization_id == organization_id,
        )
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
    exclude_permission_id: uuid.UUID | None = None,
) -> None:
    query = select(Permission.id).where(
        Permission.organization_id == organization_id,
        Permission.slug == slug,
    )
    if exclude_permission_id is not None:
        query = query.where(Permission.id != exclude_permission_id)

    if db.scalar(query) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Permission slug '{slug}' is already taken in this organization",
        )


def _build_role_permission_response(link: RolePermission) -> RolePermissionResponse:
    return RolePermissionResponse(
        id=link.id,
        role_id=link.role_id,
        permission_id=link.permission_id,
        permission_slug=link.permission.slug,
        permission_name=link.permission.name,
        created_at=link.created_at,
    )


@router.post("", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def create_permission(
    payload: PermissionCreateRequest,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> Permission:
    """Create a permission inside the current user's organization."""
    _ensure_unique_slug(
        db,
        organization_id=current_user.organization_id,
        slug=payload.slug,
    )

    permission = Permission(
        organization_id=current_user.organization_id,
        name=payload.name,
        slug=payload.slug,
        description=payload.description,
    )
    db.add(permission)
    db.commit()
    db.refresh(permission)
    return permission


@router.get("", response_model=list[PermissionResponse])
def list_permissions(
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[Permission]:
    """List all permissions in the current user's organization."""
    return list(
        db.scalars(
            select(Permission)
            .where(Permission.organization_id == current_user.organization_id)
            .order_by(Permission.slug)
        ).all()
    )


@router.get("/{permission_id}", response_model=PermissionResponse)
def get_permission(
    permission_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> Permission:
    """Get one permission by id within the current organization."""
    return _get_permission_or_404(
        db,
        permission_id=permission_id,
        organization_id=current_user.organization_id,
    )


@router.patch("/{permission_id}", response_model=PermissionResponse)
def update_permission(
    permission_id: uuid.UUID,
    payload: PermissionUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> Permission:
    """Update a permission in the current organization."""
    permission = _get_permission_or_404(
        db,
        permission_id=permission_id,
        organization_id=current_user.organization_id,
    )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if "name" in updates:
        permission.name = updates["name"]

    if "description" in updates:
        permission.description = updates["description"]

    if "is_active" in updates:
        permission.is_active = updates["is_active"]

    if "slug" in updates:
        _ensure_unique_slug(
            db,
            organization_id=current_user.organization_id,
            slug=updates["slug"],
            exclude_permission_id=permission.id,
        )
        permission.slug = updates["slug"]

    db.commit()
    db.refresh(permission)
    return permission


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permission(
    permission_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_DELETE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Delete a permission from the current organization."""
    permission = _get_permission_or_404(
        db,
        permission_id=permission_id,
        organization_id=current_user.organization_id,
    )
    ensure_can_delete_permission(permission)
    db.delete(permission)
    db.commit()


@router.post(
    "/roles/{role_id}/assign",
    response_model=RolePermissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_permission_to_role(
    role_id: uuid.UUID,
    payload: RolePermissionAssignRequest,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_ASSIGN))],
    db: Annotated[Session, Depends(get_db)],
) -> RolePermissionResponse:
    """Grant a permission to a role within the current organization."""
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )
    permission = _get_permission_or_404(
        db,
        permission_id=payload.permission_id,
        organization_id=current_user.organization_id,
    )

    existing = db.scalar(
        select(RolePermission).where(
            RolePermission.role_id == role.id,
            RolePermission.permission_id == permission.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Permission is already assigned to this role",
        )

    link = RolePermission(role_id=role.id, permission_id=permission.id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return RolePermissionResponse(
        id=link.id,
        role_id=link.role_id,
        permission_id=permission.id,
        permission_slug=permission.slug,
        permission_name=permission.name,
        created_at=link.created_at,
    )


@router.get("/roles/{role_id}", response_model=list[RolePermissionResponse])
def list_role_permissions(
    role_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[RolePermissionResponse]:
    """List permissions granted to a role in the current organization."""
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )

    links = list(
        db.scalars(
            select(RolePermission)
            .where(RolePermission.role_id == role.id)
            .options(selectinload(RolePermission.permission))
            .order_by(RolePermission.created_at)
        ).all()
    )

    return [_build_role_permission_response(link) for link in links]


@router.delete(
    "/roles/{role_id}/assign/{permission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_permission_from_role(
    role_id: uuid.UUID,
    permission_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(PERMISSIONS_ASSIGN))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Revoke a permission from a role in the current organization."""
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )
    permission = _get_permission_or_404(
        db,
        permission_id=permission_id,
        organization_id=current_user.organization_id,
    )
    ensure_can_revoke_permission_from_role(role, permission)

    link = db.scalar(
        select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
    )
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission assignment not found for this role",
        )

    db.delete(link)
    db.commit()
