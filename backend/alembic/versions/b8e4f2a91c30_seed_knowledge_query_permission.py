"""seed knowledge query permission for existing organizations

Revision ID: b8e4f2a91c30
Revises: a1bc7c084225
Create Date: 2026-06-10 18:00:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = "b8e4f2a91c30"
down_revision: Union[str, Sequence[str], None] = "a1bc7c084225"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PERMISSION = (
    "Query Knowledge",
    "knowledge:query",
    "Ask questions against the organization knowledge base",
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": ("knowledge:query",),
    "manager": ("knowledge:query",),
    "member": ("knowledge:query",),
}


def upgrade() -> None:
    conn = op.get_bind()
    organizations = conn.execute(sa.text("SELECT id FROM organizations")).fetchall()

    for (organization_id,) in organizations:
        existing = conn.execute(
            sa.text(
                """
                SELECT id
                FROM permissions
                WHERE organization_id = :organization_id AND slug = :slug
                """
            ),
            {"organization_id": organization_id, "slug": PERMISSION[1]},
        ).fetchone()

        if existing is not None:
            permission_id = existing[0]
        else:
            permission_id = uuid.uuid4()
            conn.execute(
                sa.text(
                    """
                    INSERT INTO permissions (
                        id, organization_id, name, slug, description, is_active, created_at, updated_at
                    )
                    VALUES (
                        :id, :organization_id, :name, :slug, :description, true, now(), now()
                    )
                    """
                ),
                {
                    "id": permission_id,
                    "organization_id": organization_id,
                    "name": PERMISSION[0],
                    "slug": PERMISSION[1],
                    "description": PERMISSION[2],
                },
            )

        for role_slug in ROLE_PERMISSION_SLUGS:
            role = conn.execute(
                sa.text(
                    """
                    SELECT id
                    FROM roles
                    WHERE organization_id = :organization_id AND slug = :slug
                    """
                ),
                {"organization_id": organization_id, "slug": role_slug},
            ).fetchone()
            if role is None:
                continue

            assignment = conn.execute(
                sa.text(
                    """
                    SELECT id
                    FROM role_permissions
                    WHERE role_id = :role_id AND permission_id = :permission_id
                    """
                ),
                {"role_id": role[0], "permission_id": permission_id},
            ).fetchone()
            if assignment is not None:
                continue

            conn.execute(
                sa.text(
                    """
                    INSERT INTO role_permissions (
                        id, role_id, permission_id, created_at, updated_at
                    )
                    VALUES (:id, :role_id, :permission_id, now(), now())
                    """
                ),
                {
                    "id": uuid.uuid4(),
                    "role_id": role[0],
                    "permission_id": permission_id,
                },
            )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            DELETE FROM role_permissions
            WHERE permission_id IN (
                SELECT id FROM permissions WHERE slug = :slug
            )
            """
        ),
        {"slug": PERMISSION[1]},
    )
    conn.execute(
        sa.text("DELETE FROM permissions WHERE slug = :slug"),
        {"slug": PERMISSION[1]},
    )
