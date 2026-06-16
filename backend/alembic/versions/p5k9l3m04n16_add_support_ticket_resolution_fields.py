"""add support ticket resolution fields

Revision ID: p5k9l3m04n16
Revises: o4j8k2l93m05
Create Date: 2026-06-16 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "p5k9l3m04n16"
down_revision: Union[str, Sequence[str], None] = "o4j8k2l93m05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "support_tickets",
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "support_tickets",
        sa.Column("resolved_message_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "support_tickets",
        sa.Column("reopened_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_support_tickets_resolved_message_id",
        "support_tickets",
        "support_ticket_messages",
        ["resolved_message_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_support_tickets_resolved_message_id"),
        "support_tickets",
        ["resolved_message_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_support_tickets_resolved_message_id"), table_name="support_tickets")
    op.drop_constraint(
        "fk_support_tickets_resolved_message_id",
        "support_tickets",
        type_="foreignkey",
    )
    op.drop_column("support_tickets", "reopened_at")
    op.drop_column("support_tickets", "resolved_message_id")
    op.drop_column("support_tickets", "resolved_at")
