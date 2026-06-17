"""extend omnichannel for production connectors, audit logs, escalation

Revision ID: t9o3p7q40r51
Revises: s8n2o6p39q40
Create Date: 2026-06-17 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "t9o3p7q40r51"
down_revision: Union[str, Sequence[str], None] = "s8n2o6p39q40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE omnichannel_channel_type ADD VALUE IF NOT EXISTS 'email'")
    op.execute("ALTER TYPE omnichannel_channel_type ADD VALUE IF NOT EXISTS 'whatsapp'")

    op.add_column(
        "omnichannel_channels",
        sa.Column("public_key", sa.String(length=64), nullable=True),
    )
    op.create_index(
        op.f("ix_omnichannel_channels_public_key"),
        "omnichannel_channels",
        ["public_key"],
        unique=True,
    )

    op.add_column(
        "omnichannel_conversations",
        sa.Column("support_ticket_id", sa.UUID(), nullable=True),
    )
    op.add_column(
        "omnichannel_conversations",
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "omnichannel_conversations",
        sa.Column("reopened_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        op.f("ix_omnichannel_conversations_support_ticket_id"),
        "omnichannel_conversations",
        ["support_ticket_id"],
        unique=False,
    )
    op.create_foreign_key(
        "fk_omnichannel_conversations_support_ticket_id",
        "omnichannel_conversations",
        "support_tickets",
        ["support_ticket_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.create_table(
        "omnichannel_audit_logs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=True),
        sa.Column("channel_id", sa.UUID(), nullable=True),
        sa.Column("actor_user_id", sa.UUID(), nullable=True),
        sa.Column(
            "action",
            sa.Enum(
                "conversation_created",
                "message_sent",
                "status_changed",
                "handoff_requested",
                "handoff_assigned",
                "agent_assigned",
                "ticket_escalated",
                "channel_updated",
                "widget_message",
                "webhook_received",
                name="omnichannel_audit_action",
            ),
            nullable=False,
        ),
        sa.Column("details", sa.dialects.postgresql.JSONB(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["omnichannel_conversations.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["channel_id"],
            ["omnichannel_channels.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_omnichannel_audit_logs_organization_id"),
        "omnichannel_audit_logs",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_audit_logs_conversation_id"),
        "omnichannel_audit_logs",
        ["conversation_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_omnichannel_audit_logs_action"),
        "omnichannel_audit_logs",
        ["action"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_omnichannel_audit_logs_action"), table_name="omnichannel_audit_logs")
    op.drop_index(
        op.f("ix_omnichannel_audit_logs_conversation_id"),
        table_name="omnichannel_audit_logs",
    )
    op.drop_index(
        op.f("ix_omnichannel_audit_logs_organization_id"),
        table_name="omnichannel_audit_logs",
    )
    op.drop_table("omnichannel_audit_logs")
    op.execute("DROP TYPE IF EXISTS omnichannel_audit_action")

    op.drop_constraint(
        "fk_omnichannel_conversations_support_ticket_id",
        "omnichannel_conversations",
        type_="foreignkey",
    )
    op.drop_index(
        op.f("ix_omnichannel_conversations_support_ticket_id"),
        table_name="omnichannel_conversations",
    )
    op.drop_column("omnichannel_conversations", "reopened_at")
    op.drop_column("omnichannel_conversations", "resolved_at")
    op.drop_column("omnichannel_conversations", "support_ticket_id")

    op.drop_index(op.f("ix_omnichannel_channels_public_key"), table_name="omnichannel_channels")
    op.drop_column("omnichannel_channels", "public_key")
