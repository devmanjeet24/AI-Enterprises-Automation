"""create research and browser automation tables

Revision ID: e4f8a2b93c15
Revises: d3e7f1a84c52
Create Date: 2026-06-11 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e4f8a2b93c15"
down_revision: Union[str, Sequence[str], None] = "d3e7f1a84c52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "research_projects",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("agent_team_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("research_brief", sa.Text(), nullable=True),
        sa.Column(
            "template_type",
            sa.Enum(
                "market_research",
                "competitor_analysis",
                "industry_analysis",
                "swot_analysis",
                name="research_template_type",
            ),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.Enum("draft", "active", "archived", name="research_project_status"),
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
            name="uq_research_projects_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_research_projects_organization_id"),
        "research_projects",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_research_projects_agent_team_id"),
        "research_projects",
        ["agent_team_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_research_projects_template_type"),
        "research_projects",
        ["template_type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_research_projects_status"),
        "research_projects",
        ["status"],
        unique=False,
    )

    op.create_table(
        "research_reports",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("research_project_id", sa.UUID(), nullable=False),
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
        sa.Column("intermediate_outputs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
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
            ["research_project_id"],
            ["research_projects.id"],
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
        op.f("ix_research_reports_organization_id"),
        "research_reports",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_research_reports_research_project_id"),
        "research_reports",
        ["research_project_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_research_reports_agent_task_id"),
        "research_reports",
        ["agent_task_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_research_reports_status"),
        "research_reports",
        ["status"],
        unique=False,
    )

    op.create_table(
        "browser_profiles",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("viewport_width", sa.Integer(), nullable=True),
        sa.Column("viewport_height", sa.Integer(), nullable=True),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
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
            name="uq_browser_profiles_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_browser_profiles_organization_id"),
        "browser_profiles",
        ["organization_id"],
        unique=False,
    )

    op.create_table(
        "browser_tasks",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("browser_profile_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_url", sa.String(length=2048), nullable=True),
        sa.Column("instructions", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("draft", "ready", "archived", name="browser_task_status"),
            nullable=False,
            server_default="draft",
        ),
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
            ["organization_id"],
            ["organizations.id"],
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
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_browser_tasks_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_browser_tasks_organization_id"),
        "browser_tasks",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_browser_tasks_browser_profile_id"),
        "browser_tasks",
        ["browser_profile_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_browser_tasks_status"),
        "browser_tasks",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_browser_tasks_status"), table_name="browser_tasks")
    op.drop_index(op.f("ix_browser_tasks_browser_profile_id"), table_name="browser_tasks")
    op.drop_index(op.f("ix_browser_tasks_organization_id"), table_name="browser_tasks")
    op.drop_table("browser_tasks")
    sa.Enum(name="browser_task_status").drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f("ix_browser_profiles_organization_id"), table_name="browser_profiles")
    op.drop_table("browser_profiles")

    op.drop_index(op.f("ix_research_reports_status"), table_name="research_reports")
    op.drop_index(op.f("ix_research_reports_agent_task_id"), table_name="research_reports")
    op.drop_index(op.f("ix_research_reports_research_project_id"), table_name="research_reports")
    op.drop_index(op.f("ix_research_reports_organization_id"), table_name="research_reports")
    op.drop_table("research_reports")

    op.drop_index(op.f("ix_research_projects_status"), table_name="research_projects")
    op.drop_index(op.f("ix_research_projects_template_type"), table_name="research_projects")
    op.drop_index(op.f("ix_research_projects_agent_team_id"), table_name="research_projects")
    op.drop_index(op.f("ix_research_projects_organization_id"), table_name="research_projects")
    op.drop_table("research_projects")
    sa.Enum(name="research_project_status").drop(op.get_bind(), checkfirst=True)
    sa.Enum(name="research_template_type").drop(op.get_bind(), checkfirst=True)
