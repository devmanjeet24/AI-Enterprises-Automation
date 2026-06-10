"""Canonical permission catalog and organization bootstrap helpers."""

import uuid
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission

# --- Permission slugs (resource:action) ---

DEPARTMENTS_READ = "departments:read"
DEPARTMENTS_WRITE = "departments:write"
DEPARTMENTS_DELETE = "departments:delete"

TEAMS_READ = "teams:read"
TEAMS_WRITE = "teams:write"
TEAMS_DELETE = "teams:delete"

PERMISSIONS_READ = "permissions:read"
PERMISSIONS_WRITE = "permissions:write"
PERMISSIONS_DELETE = "permissions:delete"
PERMISSIONS_ASSIGN = "permissions:assign"

USERS_READ = "users:read"
USERS_WRITE = "users:write"
USERS_ASSIGN_ROLE = "users:assign-role"

ROLES_READ = "roles:read"
ROLES_WRITE = "roles:write"
ROLES_DELETE = "roles:delete"

# Built-in roles created for every organization; their slugs cannot be deleted.
SYSTEM_ROLE_SLUGS: frozenset[str] = frozenset({"admin", "manager", "member"})

ALL_PERMISSION_SLUGS: tuple[str, ...] = (
    DEPARTMENTS_READ,
    DEPARTMENTS_WRITE,
    DEPARTMENTS_DELETE,
    TEAMS_READ,
    TEAMS_WRITE,
    TEAMS_DELETE,
    PERMISSIONS_READ,
    PERMISSIONS_WRITE,
    PERMISSIONS_DELETE,
    PERMISSIONS_ASSIGN,
    USERS_READ,
    USERS_WRITE,
    USERS_ASSIGN_ROLE,
    ROLES_READ,
    ROLES_WRITE,
    ROLES_DELETE,
)


@dataclass(frozen=True)
class PermissionDefinition:
    name: str
    slug: str
    description: str


DEFAULT_PERMISSIONS: tuple[PermissionDefinition, ...] = (
    PermissionDefinition("Read Departments", DEPARTMENTS_READ, "View department records"),
    PermissionDefinition("Write Departments", DEPARTMENTS_WRITE, "Create and update departments"),
    PermissionDefinition("Delete Departments", DEPARTMENTS_DELETE, "Delete departments"),
    PermissionDefinition("Read Teams", TEAMS_READ, "View team records"),
    PermissionDefinition("Write Teams", TEAMS_WRITE, "Create and update teams"),
    PermissionDefinition("Delete Teams", TEAMS_DELETE, "Delete teams"),
    PermissionDefinition("Read Permissions", PERMISSIONS_READ, "View permissions and role grants"),
    PermissionDefinition("Write Permissions", PERMISSIONS_WRITE, "Create and update permissions"),
    PermissionDefinition("Delete Permissions", PERMISSIONS_DELETE, "Delete permissions"),
    PermissionDefinition("Assign Permissions", PERMISSIONS_ASSIGN, "Grant or revoke permissions on roles"),
    PermissionDefinition("Read Users", USERS_READ, "View user accounts in the organization"),
    PermissionDefinition("Write Users", USERS_WRITE, "Update user profiles and deactivate accounts"),
    PermissionDefinition("Assign User Roles", USERS_ASSIGN_ROLE, "Grant or revoke roles on user accounts"),
    PermissionDefinition("Read Roles", ROLES_READ, "View roles in the organization"),
    PermissionDefinition("Write Roles", ROLES_WRITE, "Create and update roles"),
    PermissionDefinition("Delete Roles", ROLES_DELETE, "Delete custom roles"),
)

# Which permission slugs each default role receives on organization creation.
ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": ALL_PERMISSION_SLUGS,
    "manager": (
        DEPARTMENTS_READ,
        DEPARTMENTS_WRITE,
        DEPARTMENTS_DELETE,
        TEAMS_READ,
        TEAMS_WRITE,
        TEAMS_DELETE,
        PERMISSIONS_READ,
        USERS_READ,
        ROLES_READ,
    ),
    "member": (
        DEPARTMENTS_READ,
        TEAMS_READ,
    ),
}


def seed_organization_permissions(
    db: Session,
    organization_id: uuid.UUID,
    roles: dict[str, Role],
) -> dict[str, Permission]:
    """Create the default permission set and assign them to standard roles."""
    permissions_by_slug: dict[str, Permission] = {}

    for definition in DEFAULT_PERMISSIONS:
        permission = Permission(
            organization_id=organization_id,
            name=definition.name,
            slug=definition.slug,
            description=definition.description,
        )
        db.add(permission)
        permissions_by_slug[definition.slug] = permission

    db.flush()

    for role_slug, permission_slugs in ROLE_PERMISSION_SLUGS.items():
        role = roles[role_slug]
        for permission_slug in permission_slugs:
            db.add(
                RolePermission(
                    role_id=role.id,
                    permission_id=permissions_by_slug[permission_slug].id,
                )
            )

    db.flush()
    return permissions_by_slug
