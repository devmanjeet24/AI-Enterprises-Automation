"""create customer support tables

Revision ID: i8d2e6f37g59
Revises: h7c1d5e26f48
Create Date: 2026-06-14 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "i8d2e6f37g59"
down_revision: Union[str, Sequence[str], None] = "h7c1d5e26f48"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "support_ticket_categories",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("color", sa.String(length=20), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_support_ticket_categories_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_support_ticket_categories_organization_id"),
        "support_ticket_categories",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "support_tickets",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("category_id", sa.UUID(), nullable=True),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("assigned_user_id", sa.UUID(), nullable=True),
        sa.Column("assigned_ai_employee_id", sa.UUID(), nullable=True),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("customer_name", sa.String(length=200), nullable=True),
        sa.Column("customer_email", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "open",
                "in_progress",
                "waiting",
                "resolved",
                "closed",
                name="support_ticket_status",
            ),
            nullable=False,
            server_default="open",
        ),
        sa.Column(
            "priority",
            sa.Enum(
                "low",
                "normal",
                "high",
                "urgent",
                name="support_ticket_priority",
            ),
            nullable=False,
            server_default="normal",
        ),
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
            ["category_id"],
            ["support_ticket_categories.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["assigned_ai_employee_id"],
            ["ai_employees.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_support_tickets_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_support_tickets_organization_id"),
        "support_tickets",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_tickets_category_id"),
        "support_tickets",
        ["category_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_tickets_created_by_id"),
        "support_tickets",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_tickets_assigned_user_id"),
        "support_tickets",
        ["assigned_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_tickets_assigned_ai_employee_id"),
        "support_tickets",
        ["assigned_ai_employee_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_tickets_status"),
        "support_tickets",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_tickets_priority"),
        "support_tickets",
        ["priority"],
        unique=False,
    )

    op.create_table(
        "support_ticket_messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("ticket_id", sa.UUID(), nullable=False),
        sa.Column("author_user_id", sa.UUID(), nullable=True),
        sa.Column("author_ai_employee_id", sa.UUID(), nullable=True),
        sa.Column(
            "role",
            sa.Enum(
                "customer",
                "agent",
                "ai_assistant",
                "system",
                name="support_message_role",
            ),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
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
            ["ticket_id"],
            ["support_tickets.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["author_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["author_ai_employee_id"],
            ["ai_employees.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_support_ticket_messages_ticket_id"),
        "support_ticket_messages",
        ["ticket_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_ticket_messages_author_user_id"),
        "support_ticket_messages",
        ["author_user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_support_ticket_messages_author_ai_employee_id"),
        "support_ticket_messages",
        ["author_ai_employee_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_support_ticket_messages_author_ai_employee_id"),
        table_name="support_ticket_messages",
    )
    op.drop_index(
        op.f("ix_support_ticket_messages_author_user_id"),
        table_name="support_ticket_messages",
    )
    op.drop_index(
        op.f("ix_support_ticket_messages_ticket_id"),
        table_name="support_ticket_messages",
    )
    op.drop_table("support_ticket_messages")
    op.execute("DROP TYPE IF EXISTS support_message_role")

    op.drop_index(op.f("ix_support_tickets_priority"), table_name="support_tickets")
    op.drop_index(op.f("ix_support_tickets_status"), table_name="support_tickets")
    op.drop_index(
        op.f("ix_support_tickets_assigned_ai_employee_id"),
        table_name="support_tickets",
    )
    op.drop_index(op.f("ix_support_tickets_assigned_user_id"), table_name="support_tickets")
    op.drop_index(op.f("ix_support_tickets_created_by_id"), table_name="support_tickets")
    op.drop_index(op.f("ix_support_tickets_category_id"), table_name="support_tickets")
    op.drop_index(op.f("ix_support_tickets_organization_id"), table_name="support_tickets")
    op.drop_table("support_tickets")
    op.execute("DROP TYPE IF EXISTS support_ticket_priority")
    op.execute("DROP TYPE IF EXISTS support_ticket_status")

    op.drop_index(
        op.f("ix_support_ticket_categories_organization_id"),
        table_name="support_ticket_categories",
    )
    op.drop_table("support_ticket_categories")
