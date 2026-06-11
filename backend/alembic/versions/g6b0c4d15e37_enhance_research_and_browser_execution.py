"""enhance research reports and add browser task executions

Revision ID: g6b0c4d15e37
Revises: f5a9b3c04d26
Create Date: 2026-06-11 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "g6b0c4d15e37"
down_revision: Union[str, Sequence[str], None] = "f5a9b3c04d26"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "research_reports",
        sa.Column("version_number", sa.Integer(), nullable=True),
    )
    op.execute(
        sa.text(
            """
            WITH numbered AS (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        PARTITION BY research_project_id
                        ORDER BY created_at ASC
                    ) AS rn
                FROM research_reports
            )
            UPDATE research_reports AS rr
            SET version_number = numbered.rn
            FROM numbered
            WHERE rr.id = numbered.id
            """
        )
    )
    op.alter_column("research_reports", "version_number", nullable=False)
    op.create_index(
        op.f("ix_research_reports_version_number"),
        "research_reports",
        ["version_number"],
        unique=False,
    )
    op.create_unique_constraint(
        "uq_research_reports_project_id_version",
        "research_reports",
        ["research_project_id", "version_number"],
    )

    op.create_table(
        "browser_task_executions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("browser_task_id", sa.UUID(), nullable=False),
        sa.Column("browser_profile_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "running",
                "completed",
                "failed",
                "cancelled",
                name="browser_task_execution_status",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("result", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("logs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("execution_metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
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
            ["browser_task_id"],
            ["browser_tasks.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["browser_profile_id"],
            ["browser_profiles.id"],
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
        op.f("ix_browser_task_executions_organization_id"),
        "browser_task_executions",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_browser_task_executions_browser_task_id"),
        "browser_task_executions",
        ["browser_task_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_browser_task_executions_browser_profile_id"),
        "browser_task_executions",
        ["browser_profile_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_browser_task_executions_status"),
        "browser_task_executions",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_browser_task_executions_status"),
        table_name="browser_task_executions",
    )
    op.drop_index(
        op.f("ix_browser_task_executions_browser_profile_id"),
        table_name="browser_task_executions",
    )
    op.drop_index(
        op.f("ix_browser_task_executions_browser_task_id"),
        table_name="browser_task_executions",
    )
    op.drop_index(
        op.f("ix_browser_task_executions_organization_id"),
        table_name="browser_task_executions",
    )
    op.drop_table("browser_task_executions")
    sa.Enum(name="browser_task_execution_status").drop(op.get_bind(), checkfirst=True)

    op.drop_constraint(
        "uq_research_reports_project_id_version",
        "research_reports",
        type_="unique",
    )
    op.drop_index(op.f("ix_research_reports_version_number"), table_name="research_reports")
    op.drop_column("research_reports", "version_number")
