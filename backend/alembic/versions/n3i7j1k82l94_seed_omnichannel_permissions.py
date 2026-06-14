"""seed omnichannel permissions

Revision ID: n3i7j1k82l94
Revises: m2h6i0j71k83
Create Date: 2026-06-14 14:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "n3i7j1k82l94"
down_revision: Union[str, Sequence[str], None] = "m2h6i0j71k83"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    (
        "Read Omnichannel Channels",
        "omnichannel_channels:read",
        "View omnichannel communication channels",
    ),
    (
        "Write Omnichannel Channels",
        "omnichannel_channels:write",
        "Create and update omnichannel communication channels",
    ),
    (
        "Delete Omnichannel Channels",
        "omnichannel_channels:delete",
        "Delete omnichannel communication channels",
    ),
    (
        "Read Omnichannel Conversations",
        "omnichannel_conversations:read",
        "View unified inbox and conversation history",
    ),
    (
        "Write Omnichannel Conversations",
        "omnichannel_conversations:write",
        "Create and update omnichannel conversations",
    ),
    (
        "Delete Omnichannel Conversations",
        "omnichannel_conversations:delete",
        "Delete omnichannel conversations",
    ),
    (
        "Execute Omnichannel Conversations",
        "omnichannel_conversations:execute",
        "Send messages, request handoff, and use AI-assisted responses",
    ),
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": tuple(permission[1] for permission in PERMISSIONS),
    "manager": (
        "omnichannel_channels:read",
        "omnichannel_channels:write",
        "omnichannel_conversations:read",
        "omnichannel_conversations:write",
        "omnichannel_conversations:execute",
    ),
    "member": (
        "omnichannel_channels:read",
        "omnichannel_conversations:read",
        "omnichannel_conversations:execute",
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
