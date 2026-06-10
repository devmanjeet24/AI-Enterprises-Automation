"""seed document permissions for existing organizations

Revision ID: a3c8f1d92e47
Revises: 57ff0caed3dd
Create Date: 2026-06-10 16:30:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a3c8f1d92e47"
down_revision: Union[str, Sequence[str], None] = "57ff0caed3dd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

DOCUMENT_PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    ("Read Documents", "documents:read", "View knowledge documents"),
    ("Write Documents", "documents:write", "Upload and update knowledge documents"),
    ("Delete Documents", "documents:delete", "Delete knowledge documents"),
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": ("documents:read", "documents:write", "documents:delete"),
    "manager": ("documents:read", "documents:write"),
    "member": ("documents:read",),
}


def upgrade() -> None:
    """Add document permissions to every existing organization and assign them to default roles."""
    conn = op.get_bind()
    organizations = conn.execute(sa.text("SELECT id FROM organizations")).fetchall()

    for (organization_id,) in organizations:
        permission_ids_by_slug: dict[str, uuid.UUID] = {}

        for name, slug, description in DOCUMENT_PERMISSIONS:
            existing = conn.execute(
                sa.text(
                    """
                    SELECT id
                    FROM permissions
                    WHERE organization_id = :organization_id AND slug = :slug
                    """
                ),
                {"organization_id": organization_id, "slug": slug},
            ).fetchone()

            if existing is not None:
                permission_ids_by_slug[slug] = existing[0]
                continue

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
                    "name": name,
                    "slug": slug,
                    "description": description,
                },
            )
            permission_ids_by_slug[slug] = permission_id

        for role_slug, permission_slugs in ROLE_PERMISSION_SLUGS.items():
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

            role_id = role[0]
            for permission_slug in permission_slugs:
                permission_id = permission_ids_by_slug[permission_slug]
                existing_assignment = conn.execute(
                    sa.text(
                        """
                        SELECT id
                        FROM role_permissions
                        WHERE role_id = :role_id AND permission_id = :permission_id
                        """
                    ),
                    {"role_id": role_id, "permission_id": permission_id},
                ).fetchone()
                if existing_assignment is not None:
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
                        "role_id": role_id,
                        "permission_id": permission_id,
                    },
                )


def downgrade() -> None:
    """Remove document permissions and their role assignments."""
    conn = op.get_bind()
    slugs = tuple(slug for _, slug, _ in DOCUMENT_PERMISSIONS)

    conn.execute(
        sa.text(
            """
            DELETE FROM role_permissions
            WHERE permission_id IN (
                SELECT id FROM permissions WHERE slug = ANY(:slugs)
            )
            """
        ),
        {"slugs": list(slugs)},
    )
    conn.execute(
        sa.text("DELETE FROM permissions WHERE slug = ANY(:slugs)"),
        {"slugs": list(slugs)},
    )
