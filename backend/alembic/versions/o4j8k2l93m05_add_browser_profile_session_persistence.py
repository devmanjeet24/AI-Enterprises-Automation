"""add browser profile session persistence

Revision ID: o4j8k2l93m05
Revises: n3i7j1k82l94
Create Date: 2026-06-16 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "o4j8k2l93m05"
down_revision: Union[str, Sequence[str], None] = "n3i7j1k82l94"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "browser_profiles",
        sa.Column(
            "session_persistence_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.add_column(
        "browser_profiles",
        sa.Column("session_updated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.alter_column("browser_profiles", "session_persistence_enabled", server_default=None)


def downgrade() -> None:
    op.drop_column("browser_profiles", "session_updated_at")
    op.drop_column("browser_profiles", "session_persistence_enabled")
