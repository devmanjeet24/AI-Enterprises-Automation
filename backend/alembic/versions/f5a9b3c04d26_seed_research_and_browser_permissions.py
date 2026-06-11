"""seed research and browser automation permissions

Revision ID: f5a9b3c04d26
Revises: e4f8a2b93c15
Create Date: 2026-06-11 16:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f5a9b3c04d26"
down_revision: Union[str, Sequence[str], None] = "e4f8a2b93c15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    (
        "Read Research Projects",
        "research_projects:read",
        "View business research projects and reports",
    ),
    (
        "Write Research Projects",
        "research_projects:write",
        "Create and update business research projects",
    ),
    (
        "Delete Research Projects",
        "research_projects:delete",
        "Delete business research projects",
    ),
    (
        "Execute Research Projects",
        "research_projects:execute",
        "Run research projects and generate reports",
    ),
    (
        "Read Browser Profiles",
        "browser_profiles:read",
        "View browser automation profiles",
    ),
    (
        "Write Browser Profiles",
        "browser_profiles:write",
        "Create and update browser automation profiles",
    ),
    (
        "Delete Browser Profiles",
        "browser_profiles:delete",
        "Delete browser automation profiles",
    ),
    (
        "Read Browser Tasks",
        "browser_tasks:read",
        "View browser automation task definitions",
    ),
    (
        "Write Browser Tasks",
        "browser_tasks:write",
        "Create and update browser automation task definitions",
    ),
    (
        "Delete Browser Tasks",
        "browser_tasks:delete",
        "Delete browser automation task definitions",
    ),
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": tuple(permission[1] for permission in PERMISSIONS),
    "manager": (
        "research_projects:read",
        "research_projects:write",
        "research_projects:execute",
        "browser_profiles:read",
        "browser_profiles:write",
        "browser_tasks:read",
        "browser_tasks:write",
    ),
    "member": (
        "research_projects:read",
        "research_projects:execute",
        "browser_profiles:read",
        "browser_tasks:read",
    ),
}


def upgrade() -> None:
    conn = op.get_bind()

    for name, slug, description in PERMISSIONS:
        conn.execute(
            sa.text(
                """
                INSERT INTO permissions (
                    id, organization_id, name, slug, description, is_active, created_at, updated_at
                )
                SELECT
                    gen_random_uuid(),
                    o.id,
                    :name,
                    :slug,
                    :description,
                    true,
                    now(),
                    now()
                FROM organizations o
                ON CONFLICT ON CONSTRAINT uq_permissions_organization_id_slug DO NOTHING
                """
            ),
            {"name": name, "slug": slug, "description": description},
        )

    for role_slug, permission_slugs in ROLE_PERMISSION_SLUGS.items():
        for permission_slug in permission_slugs:
            conn.execute(
                sa.text(
                    """
                    INSERT INTO role_permissions (
                        id, role_id, permission_id, created_at, updated_at
                    )
                    SELECT
                        gen_random_uuid(),
                        r.id,
                        p.id,
                        now(),
                        now()
                    FROM roles r
                    JOIN permissions p
                        ON p.organization_id = r.organization_id
                        AND p.slug = :permission_slug
                    WHERE r.slug = :role_slug
                    ON CONFLICT ON CONSTRAINT uq_role_permissions_role_id_permission_id DO NOTHING
                    """
                ),
                {"role_slug": role_slug, "permission_slug": permission_slug},
            )


def downgrade() -> None:
    conn = op.get_bind()
    for _, slug, _ in PERMISSIONS:
        conn.execute(
            sa.text(
                """
                DELETE FROM role_permissions
                WHERE permission_id IN (
                    SELECT id FROM permissions WHERE slug = :slug
                )
                """
            ),
            {"slug": slug},
        )
        conn.execute(
            sa.text("DELETE FROM permissions WHERE slug = :slug"),
            {"slug": slug},
        )
