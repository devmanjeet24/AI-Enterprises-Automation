"""create multi-agent collaboration tables

Revision ID: f3b2c8d41a07
Revises: e8a1c4f92b15
Create Date: 2026-06-10 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f3b2c8d41a07"
down_revision: Union[str, Sequence[str], None] = "e8a1c4f92b15"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_teams",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
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
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_agent_teams_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_agent_teams_organization_id"),
        "agent_teams",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_teams_created_by_id"),
        "agent_teams",
        ["created_by_id"],
        unique=False,
    )

    op.create_table(
        "agent_team_members",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("agent_team_id", sa.UUID(), nullable=False),
        sa.Column("ai_employee_id", sa.UUID(), nullable=False),
        sa.Column("collaboration_role", sa.String(length=100), nullable=False),
        sa.Column("sequence_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["agent_team_id"],
            ["agent_teams.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ai_employee_id"],
            ["ai_employees.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "agent_team_id",
            "ai_employee_id",
            name="uq_agent_team_members_team_id_employee_id",
        ),
    )
    op.create_index(
        op.f("ix_agent_team_members_agent_team_id"),
        "agent_team_members",
        ["agent_team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_team_members_ai_employee_id"),
        "agent_team_members",
        ["ai_employee_id"],
        unique=False,
    )

    op.create_table(
        "agent_tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("agent_team_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "in_progress",
                "completed",
                "failed",
                "cancelled",
                name="agent_task_status",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("input_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("result", sa.Text(), nullable=True),
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
    )
    op.create_index(
        op.f("ix_agent_tasks_organization_id"),
        "agent_tasks",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_tasks_agent_team_id"),
        "agent_tasks",
        ["agent_team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_tasks_created_by_id"),
        "agent_tasks",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_tasks_status"),
        "agent_tasks",
        ["status"],
        unique=False,
    )

    op.create_table(
        "agent_task_executions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("agent_task_id", sa.UUID(), nullable=False),
        sa.Column("ai_employee_id", sa.UUID(), nullable=False),
        sa.Column("agent_team_member_id", sa.UUID(), nullable=True),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "running",
                "completed",
                "failed",
                "skipped",
                name="agent_task_execution_status",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("input_summary", sa.Text(), nullable=True),
        sa.Column("output", sa.Text(), nullable=True),
        sa.Column("output_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
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
            ["agent_task_id"],
            ["agent_tasks.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["ai_employee_id"],
            ["ai_employees.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_team_member_id"],
            ["agent_team_members.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_agent_task_executions_agent_task_id"),
        "agent_task_executions",
        ["agent_task_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_task_executions_ai_employee_id"),
        "agent_task_executions",
        ["ai_employee_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_task_executions_agent_team_member_id"),
        "agent_task_executions",
        ["agent_team_member_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_agent_task_executions_status"),
        "agent_task_executions",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_agent_task_executions_status"),
        table_name="agent_task_executions",
    )
    op.drop_index(
        op.f("ix_agent_task_executions_agent_team_member_id"),
        table_name="agent_task_executions",
    )
    op.drop_index(
        op.f("ix_agent_task_executions_ai_employee_id"),
        table_name="agent_task_executions",
    )
    op.drop_index(
        op.f("ix_agent_task_executions_agent_task_id"),
        table_name="agent_task_executions",
    )
    op.drop_table("agent_task_executions")
    sa.Enum(name="agent_task_execution_status").drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f("ix_agent_tasks_status"), table_name="agent_tasks")
    op.drop_index(op.f("ix_agent_tasks_created_by_id"), table_name="agent_tasks")
    op.drop_index(op.f("ix_agent_tasks_agent_team_id"), table_name="agent_tasks")
    op.drop_index(op.f("ix_agent_tasks_organization_id"), table_name="agent_tasks")
    op.drop_table("agent_tasks")
    sa.Enum(name="agent_task_status").drop(op.get_bind(), checkfirst=True)

    op.drop_index(
        op.f("ix_agent_team_members_ai_employee_id"),
        table_name="agent_team_members",
    )
    op.drop_index(
        op.f("ix_agent_team_members_agent_team_id"),
        table_name="agent_team_members",
    )
    op.drop_table("agent_team_members")

    op.drop_index(op.f("ix_agent_teams_created_by_id"), table_name="agent_teams")
    op.drop_index(op.f("ix_agent_teams_organization_id"), table_name="agent_teams")
    op.drop_table("agent_teams")
