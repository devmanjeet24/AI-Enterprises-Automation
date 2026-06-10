"""Authorization helpers built on roles and permissions."""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.role import Role
from app.models.user import User
from app.models.user_role import UserRole


def get_user_permission_slugs(db: Session, user: User) -> set[str]:
    """Collect all active permission slugs granted to a user through their roles."""
    rows = db.execute(
        select(Permission.slug)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(
            UserRole.user_id == user.id,
            Permission.organization_id == user.organization_id,
            Permission.is_active.is_(True),
            Role.is_active.is_(True),
        )
        .distinct()
    ).all()
    return {slug for (slug,) in rows}


def require_permission(permission_slug: str) -> Callable[..., User]:
    """Return a dependency that enforces a specific permission slug."""

    def dependency(
        current_user: Annotated[User, Depends(get_current_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> User:
        permission_slugs = get_user_permission_slugs(db, current_user)
        if permission_slug not in permission_slugs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission '{permission_slug}' required",
            )
        return current_user

    return dependency


def load_user_with_permissions(
    db: Session,
    user: User,
) -> User:
    """Eager-load roles and permissions for authorization checks."""
    loaded = db.scalar(
        select(User)
        .where(User.id == user.id)
        .options(
            selectinload(User.roles)
            .selectinload(Role.permissions),
            selectinload(User.user_roles),
        )
    )
    return loaded or user
