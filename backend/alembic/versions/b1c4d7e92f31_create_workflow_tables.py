"""create workflow tables

Revision ID: b1c4d7e92f31
Revises: a9e5f1c82d40
Create Date: 2026-06-11 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "b1c4d7e92f31"
down_revision: Union[str, Sequence[str], None] = "a9e5f1c82d40"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workflows",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("agent_team_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "archived", name="workflow_status"),
            nullable=False,
            server_default="draft",
        ),
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
        sa.ForeignKeyConstraint(
            ["agent_team_id"],
            ["agent_teams.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_workflows_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_workflows_organization_id"),
        "workflows",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflows_agent_team_id"),
        "workflows",
        ["agent_team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflows_created_by_id"),
        "workflows",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflows_status"),
        "workflows",
        ["status"],
        unique=False,
    )

    op.create_table(
        "workflow_steps",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("workflow_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
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
            ["workflow_id"],
            ["workflows.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "workflow_id",
            "sequence_order",
            name="uq_workflow_steps_workflow_id_sequence_order",
        ),
    )
    op.create_index(
        op.f("ix_workflow_steps_workflow_id"),
        "workflow_steps",
        ["workflow_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_workflow_steps_workflow_id"), table_name="workflow_steps")
    op.drop_table("workflow_steps")

    op.drop_index(op.f("ix_workflows_status"), table_name="workflows")
    op.drop_index(op.f("ix_workflows_created_by_id"), table_name="workflows")
    op.drop_index(op.f("ix_workflows_agent_team_id"), table_name="workflows")
    op.drop_index(op.f("ix_workflows_organization_id"), table_name="workflows")
    op.drop_table("workflows")
    sa.Enum(name="workflow_status").drop(op.get_bind(), checkfirst=True)
