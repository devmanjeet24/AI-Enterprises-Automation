"""align voice session execute permission on roles with write

Revision ID: s8n2o6p39q40
Revises: r7m1n5o28p39
Create Date: 2026-06-17 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "s8n2o6p39q40"
down_revision: Union[str, Sequence[str], None] = "r7m1n5o28p39"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            """
            INSERT INTO role_permissions (
                id, role_id, permission_id, created_at, updated_at
            )
            SELECT
                gen_random_uuid(),
                rp_write.role_id,
                p_execute.id,
                now(),
                now()
            FROM role_permissions rp_write
            JOIN permissions p_write
                ON p_write.id = rp_write.permission_id
                AND p_write.slug = 'voice_sessions:write'
            JOIN permissions p_execute
                ON p_execute.organization_id = p_write.organization_id
                AND p_execute.slug = 'voice_sessions:execute'
            WHERE NOT EXISTS (
                SELECT 1
                FROM role_permissions rp_execute
                WHERE rp_execute.role_id = rp_write.role_id
                  AND rp_execute.permission_id = p_execute.id
            )
            ON CONFLICT ON CONSTRAINT uq_role_permissions_role_id_permission_id DO NOTHING
            """
        )
    )


def downgrade() -> None:
    pass
