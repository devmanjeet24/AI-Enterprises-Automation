"""create ai employee conversations and messages tables

Revision ID: e8a1c4f92b15
Revises: d7f3a2b91e04
Create Date: 2026-06-10 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e8a1c4f92b15"
down_revision: Union[str, Sequence[str], None] = "d7f3a2b91e04"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "ai_employee_conversations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("ai_employee_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ai_employee_id"],
            ["ai_employees.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_employee_conversations_organization_id"),
        "ai_employee_conversations",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_employee_conversations_ai_employee_id"),
        "ai_employee_conversations",
        ["ai_employee_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_employee_conversations_user_id"),
        "ai_employee_conversations",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_ai_employee_conversations_employee_user",
        "ai_employee_conversations",
        ["ai_employee_id", "user_id"],
        unique=False,
    )

    op.create_table(
        "ai_employee_messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column(
            "role",
            sa.Enum("user", "assistant", name="message_role"),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sources", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["ai_employee_conversations.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_employee_messages_conversation_id"),
        "ai_employee_messages",
        ["conversation_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        op.f("ix_ai_employee_messages_conversation_id"),
        table_name="ai_employee_messages",
    )
    op.drop_table("ai_employee_messages")
    op.drop_index(
        "ix_ai_employee_conversations_employee_user",
        table_name="ai_employee_conversations",
    )
    op.drop_index(
        op.f("ix_ai_employee_conversations_user_id"),
        table_name="ai_employee_conversations",
    )
    op.drop_index(
        op.f("ix_ai_employee_conversations_ai_employee_id"),
        table_name="ai_employee_conversations",
    )
    op.drop_index(
        op.f("ix_ai_employee_conversations_organization_id"),
        table_name="ai_employee_conversations",
    )
    op.drop_table("ai_employee_conversations")
    sa.Enum(name="message_role").drop(op.get_bind(), checkfirst=True)
