"""add omnichannel conversation archive and soft delete

Revision ID: u0p4q8r51s62
Revises: t9o3p7q40r51
Create Date: 2026-06-18 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "u0p4q8r51s62"
down_revision: Union[str, Sequence[str], None] = "t9o3p7q40r51"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TYPE omnichannel_audit_action ADD VALUE IF NOT EXISTS 'conversation_archived'"
    )
    op.execute(
        "ALTER TYPE omnichannel_audit_action ADD VALUE IF NOT EXISTS 'conversation_unarchived'"
    )
    op.execute(
        "ALTER TYPE omnichannel_audit_action ADD VALUE IF NOT EXISTS 'conversation_deleted'"
    )

    op.add_column(
        "omnichannel_conversations",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "omnichannel_conversations",
        sa.Column(
            "archived_by_id",
            sa.UUID(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "omnichannel_conversations",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "omnichannel_conversations",
        sa.Column(
            "deleted_by_id",
            sa.UUID(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_archived_at"),
        "omnichannel_conversations",
        ["archived_at"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_deleted_at"),
        "omnichannel_conversations",
        ["deleted_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_omnichannel_conversations_deleted_at"),
        table_name="omnichannel_conversations",
    )
    op.drop_index(
        op.f("ix_omnichannel_conversations_archived_at"),
        table_name="omnichannel_conversations",
    )
    op.drop_column("omnichannel_conversations", "deleted_by_id")
    op.drop_column("omnichannel_conversations", "deleted_at")
    op.drop_column("omnichannel_conversations", "archived_by_id")
    op.drop_column("omnichannel_conversations", "archived_at")
