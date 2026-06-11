"""seed employee permissions for existing organizations

Revision ID: d7f3a2b91e04
Revises: c4d9e8f12a03
Create Date: 2026-06-10 21:00:00.000000

"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa


revision: str = "d7f3a2b91e04"
down_revision: Union[str, Sequence[str], None] = "c4d9e8f12a03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

PERMISSIONS: tuple[tuple[str, str, str], ...] = (
    ("Read Employees", "employees:read", "View AI employees in the organization"),
    ("Write Employees", "employees:write", "Create and configure AI employees"),
    ("Delete Employees", "employees:delete", "Delete AI employees"),
    ("Chat with Employees", "employees:chat", "Send messages to active AI employees"),
)

ROLE_PERMISSION_SLUGS: dict[str, tuple[str, ...]] = {
    "admin": tuple(permission[1] for permission in PERMISSIONS),
    "manager": ("employees:read", "employees:write", "employees:chat"),
    "member": ("employees:read", "employees:chat"),
}


def upgrade() -> None:
    conn = op.get_bind()
    organizations = conn.execute(sa.text("SELECT id FROM organizations")).fetchall()

    for (organization_id,) in organizations:
        permission_ids_by_slug: dict[str, uuid.UUID] = {}

        for name, slug, description in PERMISSIONS:
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
            inserted = conn.execute(
                sa.text(
                    """
                    INSERT INTO permissions (
                        id, organization_id, name, slug, description, is_active, created_at, updated_at
                    )
                    VALUES (
                        :id, :organization_id, :name, :slug, :description, true, now(), now()
                    )
                    ON CONFLICT ON CONSTRAINT uq_permissions_organization_id_slug DO NOTHING
                    RETURNING id
                    """
                ),
                {
                    "id": permission_id,
                    "organization_id": organization_id,
                    "name": name,
                    "slug": slug,
                    "description": description,
                },
            ).fetchone()
            if inserted is not None:
                permission_ids_by_slug[slug] = inserted[0]
                continue

            fallback = conn.execute(
                sa.text(
                    """
                    SELECT id
                    FROM permissions
                    WHERE organization_id = :organization_id AND slug = :slug
                    """
                ),
                {"organization_id": organization_id, "slug": slug},
            ).fetchone()
            if fallback is None:
                raise RuntimeError(
                    f"Failed to seed permission '{slug}' for organization {organization_id}"
                )
            permission_ids_by_slug[slug] = fallback[0]

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

            for permission_slug in permission_slugs:
                permission_id = permission_ids_by_slug.get(permission_slug)
                if permission_id is None:
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
