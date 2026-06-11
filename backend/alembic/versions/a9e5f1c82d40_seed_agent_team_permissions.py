"""seed agent team permissions for existing organizations

Revision ID: a9e5f1c82d40
Revises: f3b2c8d41a07
Create Date: 2026-06-10 23:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a9e5f1c82d40"
down_revision: Union[str, Sequence[str], None] = "f3b2c8d41a07"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    ("Read Agent Teams", "agent_teams:read", "View multi-agent collaboration teams"),
    (
        "Write Agent Teams",
        "agent_teams:write",
        "Create and configure agent teams and memberships",
    ),
    ("Delete Agent Teams", "agent_teams:delete", "Delete agent teams"),
    (
        "Execute Agent Teams",
        "agent_teams:execute",
        "Submit and run multi-agent collaboration tasks",
    ),
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": tuple(permission[1] for permission in PERMISSIONS),
    "manager": ("agent_teams:read", "agent_teams:write", "agent_teams:execute"),
    "member": ("agent_teams:read", "agent_teams:execute"),
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
