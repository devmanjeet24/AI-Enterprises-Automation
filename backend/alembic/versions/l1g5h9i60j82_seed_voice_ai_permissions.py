"""seed voice ai permissions

Revision ID: l1g5h9i60j82
Revises: k0f4g8h59i71
Create Date: 2026-06-14 12:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "l1g5h9i60j82"
down_revision: Union[str, Sequence[str], None] = "k0f4g8h59i71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    (
        "Read Voice Agents",
        "voice_agents:read",
        "View voice AI agents and their configuration",
    ),
    (
        "Write Voice Agents",
        "voice_agents:write",
        "Create and update voice AI agents",
    ),
    (
        "Delete Voice Agents",
        "voice_agents:delete",
        "Delete voice AI agents",
    ),
    (
        "Read Voice Sessions",
        "voice_sessions:read",
        "View voice session history and transcripts",
    ),
    (
        "Write Voice Sessions",
        "voice_sessions:write",
        "Create voice sessions",
    ),
    (
        "Delete Voice Sessions",
        "voice_sessions:delete",
        "Delete voice sessions",
    ),
    (
        "Execute Voice Sessions",
        "voice_sessions:execute",
        "Upload audio and run voice transcription with AI responses",
    ),
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": tuple(permission[1] for permission in PERMISSIONS),
    "manager": (
        "voice_agents:read",
        "voice_agents:write",
        "voice_sessions:read",
        "voice_sessions:write",
        "voice_sessions:execute",
    ),
    "member": (
        "voice_agents:read",
        "voice_sessions:read",
        "voice_sessions:execute",
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
