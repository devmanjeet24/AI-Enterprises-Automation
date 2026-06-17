"""Shared RBAC guard helpers for role and permission mutations."""

from fastapi import HTTPException, status

from app.core.permissions import ALL_PERMISSION_SLUGS, ROLE_PERMISSION_SLUGS, SYSTEM_ROLE_SLUGS
from app.models.permission import Permission
from app.models.role import Role


def is_system_role(role: Role) -> bool:
    return role.slug in SYSTEM_ROLE_SLUGS


def is_canonical_permission_slug(slug: str) -> bool:
    """Return True when the slug is part of the built-in permission catalog."""
    return slug in ALL_PERMISSION_SLUGS


def is_default_role_permission(role_slug: str, permission_slug: str) -> bool:
    """Return True when a permission is part of the default grant for a system role."""
    return permission_slug in ROLE_PERMISSION_SLUGS.get(role_slug, ())


def ensure_can_revoke_permission_from_role(role: Role, permission: Permission) -> None:
    """Block revoking default grants from built-in roles to prevent lockout."""
    if not is_system_role(role):
        return

    if is_default_role_permission(role.slug, permission.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot revoke default permission '{permission.slug}' "
                f"from the built-in '{role.slug}' role"
            ),
        )


def ensure_can_delete_permission(permission: Permission) -> None:
    """Block deleting canonical permissions that power endpoint enforcement."""
    if is_canonical_permission_slug(permission.slug):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete built-in permission '{permission.slug}'",
        )
