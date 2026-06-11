"""User management endpoints — scoped to the authenticated user's organization."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.authorization import require_permission
from app.core.permissions import USERS_ASSIGN_ROLE, USERS_READ, USERS_WRITE
from app.db.session import get_db
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole
from app.schemas.auth import RoleSummary
from app.schemas.user import (
    UserResponse,
    UserRoleAssignRequest,
    UserRoleAssignmentResponse,
    UserUpdateRequest,
)

router = APIRouter(prefix="/users", tags=["users"])


def _build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        organization_id=user.organization_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        is_active=user.is_active,
        roles=[RoleSummary.model_validate(role) for role in user.roles],
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _get_user_or_404(
    db: Session,
    *,
    user_id: uuid.UUID,
    organization_id: uuid.UUID,
) -> User:
    user = db.scalar(
        select(User)
        .where(
            User.id == user_id,
            User.organization_id == organization_id,
        )
        .options(selectinload(User.roles))
    )
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


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


def _count_active_admins(db: Session, *, organization_id: uuid.UUID) -> int:
    """Count active users who hold the admin role in this organization."""
    return db.scalar(
        select(func.count(func.distinct(User.id)))
        .select_from(User)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .where(
            User.organization_id == organization_id,
            User.is_active.is_(True),
            Role.organization_id == organization_id,
            Role.slug == "admin",
            Role.is_active.is_(True),
        )
    ) or 0


def _user_has_role_slug(user: User, role_slug: str) -> bool:
    return any(role.slug == role_slug for role in user.roles)


def _ensure_not_last_admin(
    db: Session,
    *,
    organization_id: uuid.UUID,
    target_user: User,
    will_remain_admin: bool,
) -> None:
    if will_remain_admin:
        return
    if not _user_has_role_slug(target_user, "admin"):
        return
    if _count_active_admins(db, organization_id=organization_id) <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the last active administrator from the organization",
        )


@router.get("", response_model=list[UserResponse])
def list_users(
    current_user: Annotated[User, Depends(require_permission(USERS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> list[UserResponse]:
    """List all users in the current organization."""
    users = list(
        db.scalars(
            select(User)
            .where(User.organization_id == current_user.organization_id)
            .options(selectinload(User.roles))
            .order_by(User.last_name, User.first_name)
        ).all()
    )
    return [_build_user_response(user) for user in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(USERS_READ))],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Get one user by id within the current organization."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )
    return _build_user_response(user)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    current_user: Annotated[User, Depends(require_permission(USERS_WRITE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Update a user profile or deactivate the account (is_active=false)."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    if updates.get("is_active") is False:
        if user.id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account",
            )
        _ensure_not_last_admin(
            db,
            organization_id=current_user.organization_id,
            target_user=user,
            will_remain_admin=False,
        )

    if "first_name" in updates:
        user.first_name = updates["first_name"]

    if "last_name" in updates:
        user.last_name = updates["last_name"]

    if "is_active" in updates:
        user.is_active = updates["is_active"]

    db.commit()
    db.refresh(user)
    loaded = _get_user_or_404(
        db,
        user_id=user.id,
        organization_id=current_user.organization_id,
    )
    return _build_user_response(loaded)


@router.post(
    "/{user_id}/roles",
    response_model=UserRoleAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_role_to_user(
    user_id: uuid.UUID,
    payload: UserRoleAssignRequest,
    current_user: Annotated[User, Depends(require_permission(USERS_ASSIGN_ROLE))],
    db: Annotated[Session, Depends(get_db)],
) -> UserRoleAssignmentResponse:
    """Grant a role to a user within the current organization."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )
    role = _get_role_or_404(
        db,
        role_id=payload.role_id,
        organization_id=current_user.organization_id,
    )

    if not role.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign an inactive role",
        )

    existing = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
        )
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Role is already assigned to this user",
        )

    link = UserRole(user_id=user.id, role_id=role.id)
    db.add(link)
    db.commit()
    db.refresh(link)
    return UserRoleAssignmentResponse(
        id=link.id,
        user_id=link.user_id,
        role_id=link.role_id,
        role_slug=role.slug,
        role_name=role.name,
        created_at=link.created_at,
    )


@router.delete(
    "/{user_id}/roles/{role_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_role_from_user(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_permission(USERS_ASSIGN_ROLE))],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """Revoke a role from a user within the current organization."""
    user = _get_user_or_404(
        db,
        user_id=user_id,
        organization_id=current_user.organization_id,
    )
    role = _get_role_or_404(
        db,
        role_id=role_id,
        organization_id=current_user.organization_id,
    )

    if role.slug == "admin":
        still_admin = any(
            assigned_role.slug == "admin" and assigned_role.id != role.id
            for assigned_role in user.roles
        )
        _ensure_not_last_admin(
            db,
            organization_id=current_user.organization_id,
            target_user=user,
            will_remain_admin=still_admin,
        )

    link = db.scalar(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id == role.id,
        )
    )
    if link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found for this user",
        )

    db.delete(link)
    db.commit()
