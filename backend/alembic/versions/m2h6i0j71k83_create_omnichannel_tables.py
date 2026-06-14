"""create omnichannel communication tables

Revision ID: m2h6i0j71k83
Revises: l1g5h9i60j82
Create Date: 2026-06-14 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m2h6i0j71k83"
down_revision: Union[str, Sequence[str], None] = "l1g5h9i60j82"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "omnichannel_channels",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("ai_employee_id", sa.UUID(), nullable=True),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column(
            "channel_type",
            sa.Enum(
                "website_chat",
                "telegram",
                "slack",
                "internal",
                name="omnichannel_channel_type",
            ),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("config", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["ai_employee_id"], ["ai_employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_omnichannel_channels_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_omnichannel_channels_organization_id"),
        "omnichannel_channels",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_channels_channel_type"),
        "omnichannel_channels",
        ["channel_type"],
        unique=False,
    )

    op.create_table(
        "omnichannel_conversations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("channel_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("assigned_user_id", sa.UUID(), nullable=True),
        sa.Column("assigned_ai_employee_id", sa.UUID(), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("external_contact_name", sa.String(length=200), nullable=True),
        sa.Column("external_contact_id", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "open",
                "ai_handling",
                "waiting_human",
                "resolved",
                "closed",
                name="omnichannel_conversation_status",
            ),
            nullable=False,
            server_default="open",
        ),
        sa.Column(
            "handoff_status",
            sa.Enum(
                "none",
                "requested",
                "assigned",
                "completed",
                name="omnichannel_handoff_status",
            ),
            nullable=False,
            server_default="none",
        ),
        sa.Column("shared_context", sa.dialects.postgresql.JSONB(), nullable=True),
        sa.Column("last_message_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["channel_id"], ["omnichannel_channels.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_ai_employee_id"], ["ai_employees.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_omnichannel_conversations_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_organization_id"),
        "omnichannel_conversations",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_channel_id"),
        "omnichannel_conversations",
        ["channel_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_status"),
        "omnichannel_conversations",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_handoff_status"),
        "omnichannel_conversations",
        ["handoff_status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_last_message_at"),
        "omnichannel_conversations",
        ["last_message_at"],
        unique=False,
    )

    op.create_table(
        "omnichannel_messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("author_user_id", sa.UUID(), nullable=True),
        sa.Column("author_ai_employee_id", sa.UUID(), nullable=True),
        sa.Column(
            "role",
            sa.Enum(
                "customer",
                "agent",
                "ai_assistant",
                "system",
                name="omnichannel_message_role",
            ),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("metadata", sa.dialects.postgresql.JSONB(), nullable=True),
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
            ["omnichannel_conversations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["author_ai_employee_id"], ["ai_employees.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_omnichannel_messages_conversation_id"),
        "omnichannel_messages",
        ["conversation_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_messages_role"),
        "omnichannel_messages",
        ["role"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_omnichannel_messages_role"), table_name="omnichannel_messages")
    op.drop_index(
        op.f("ix_omnichannel_messages_conversation_id"),
        table_name="omnichannel_messages",
    )
    op.drop_table("omnichannel_messages")
    op.execute("DROP TYPE IF EXISTS omnichannel_message_role")

    op.drop_index(
        op.f("ix_omnichannel_conversations_last_message_at"),
        table_name="omnichannel_conversations",
    )
    op.drop_index(
        op.f("ix_omnichannel_conversations_handoff_status"),
        table_name="omnichannel_conversations",
    )
    op.drop_index(
        op.f("ix_omnichannel_conversations_status"),
        table_name="omnichannel_conversations",
    )
    op.drop_index(
        op.f("ix_omnichannel_conversations_channel_id"),
        table_name="omnichannel_conversations",
    )
    op.drop_index(
        op.f("ix_omnichannel_conversations_organization_id"),
        table_name="omnichannel_conversations",
    )
    op.drop_table("omnichannel_conversations")
    op.execute("DROP TYPE IF EXISTS omnichannel_handoff_status")
    op.execute("DROP TYPE IF EXISTS omnichannel_conversation_status")

    op.drop_index(
        op.f("ix_omnichannel_channels_channel_type"),
        table_name="omnichannel_channels",
    )
    op.drop_index(
        op.f("ix_omnichannel_channels_organization_id"),
        table_name="omnichannel_channels",
    )
    op.drop_table("omnichannel_channels")
    op.execute("DROP TYPE IF EXISTS omnichannel_channel_type")
