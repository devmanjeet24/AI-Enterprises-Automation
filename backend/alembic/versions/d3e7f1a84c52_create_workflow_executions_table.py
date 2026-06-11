"""create workflow executions table

Revision ID: d3e7f1a84c52
Revises: c2d8e5a13b44
Create Date: 2026-06-11 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d3e7f1a84c52"
down_revision: Union[str, Sequence[str], None] = "c2d8e5a13b44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "workflow_executions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("workflow_id", sa.UUID(), nullable=False),
        sa.Column("agent_task_id", sa.UUID(), nullable=True),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column(
            "status",
            postgresql.ENUM(
                "pending",
                "in_progress",
                "completed",
                "failed",
                "cancelled",
                name="agent_task_status",
                create_type=False,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("final_output", sa.Text(), nullable=True),
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
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["workflow_id"],
            ["workflows.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["agent_task_id"],
            ["agent_tasks.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_workflow_executions_organization_id"),
        "workflow_executions",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflow_executions_workflow_id"),
        "workflow_executions",
        ["workflow_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflow_executions_agent_task_id"),
        "workflow_executions",
        ["agent_task_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflow_executions_created_by_id"),
        "workflow_executions",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_workflow_executions_status"),
        "workflow_executions",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_workflow_executions_status"), table_name="workflow_executions")
    op.drop_index(
        op.f("ix_workflow_executions_created_by_id"),
        table_name="workflow_executions",
    )
    op.drop_index(
        op.f("ix_workflow_executions_agent_task_id"),
        table_name="workflow_executions",
    )
    op.drop_index(
        op.f("ix_workflow_executions_workflow_id"),
        table_name="workflow_executions",
    )
    op.drop_index(
        op.f("ix_workflow_executions_organization_id"),
        table_name="workflow_executions",
    )
    op.drop_table("workflow_executions")
