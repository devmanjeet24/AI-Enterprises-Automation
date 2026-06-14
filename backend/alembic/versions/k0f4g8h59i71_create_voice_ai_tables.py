"""create voice ai tables

Revision ID: k0f4g8h59i71
Revises: j9e3f7g48h60
Create Date: 2026-06-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "k0f4g8h59i71"
down_revision: Union[str, Sequence[str], None] = "j9e3f7g48h60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "voice_agents",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("ai_employee_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("slug", sa.String(length=50), nullable=False),
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
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "organization_id",
            "slug",
            name="uq_voice_agents_organization_id_slug",
        ),
    )
    op.create_index(
        op.f("ix_voice_agents_organization_id"),
        "voice_agents",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_agents_ai_employee_id"),
        "voice_agents",
        ["ai_employee_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_agents_created_by_id"),
        "voice_agents",
        ["created_by_id"],
        unique=False,
    )

    op.create_table(
        "voice_sessions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("voice_agent_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "processing",
                "completed",
                "failed",
                name="voice_session_status",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("audio_file_path", sa.String(length=512), nullable=True),
        sa.Column("audio_mime_type", sa.String(length=100), nullable=True),
        sa.Column("audio_duration_seconds", sa.Float(), nullable=True),
        sa.Column("result", sa.dialects.postgresql.JSONB(), nullable=True),
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
            ["voice_agent_id"],
            ["voice_agents.id"],
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
        op.f("ix_voice_sessions_organization_id"),
        "voice_sessions",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_sessions_voice_agent_id"),
        "voice_sessions",
        ["voice_agent_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_sessions_created_by_id"),
        "voice_sessions",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_sessions_status"),
        "voice_sessions",
        ["status"],
        unique=False,
    )

    op.create_table(
        "voice_transcripts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("voice_session_id", sa.UUID(), nullable=False),
        sa.Column("author_ai_employee_id", sa.UUID(), nullable=True),
        sa.Column(
            "role",
            sa.Enum(
                "caller",
                "ai_assistant",
                "system",
                name="voice_transcript_role",
            ),
            nullable=False,
        ),
        sa.Column("content", sa.Text(), nullable=False),
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
            ["voice_session_id"],
            ["voice_sessions.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["author_ai_employee_id"],
            ["ai_employees.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_voice_transcripts_voice_session_id"),
        "voice_transcripts",
        ["voice_session_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_transcripts_author_ai_employee_id"),
        "voice_transcripts",
        ["author_ai_employee_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_voice_transcripts_role"),
        "voice_transcripts",
        ["role"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_voice_transcripts_role"), table_name="voice_transcripts")
    op.drop_index(
        op.f("ix_voice_transcripts_author_ai_employee_id"),
        table_name="voice_transcripts",
    )
    op.drop_index(
        op.f("ix_voice_transcripts_voice_session_id"),
        table_name="voice_transcripts",
    )
    op.drop_table("voice_transcripts")
    op.execute("DROP TYPE IF EXISTS voice_transcript_role")

    op.drop_index(op.f("ix_voice_sessions_status"), table_name="voice_sessions")
    op.drop_index(op.f("ix_voice_sessions_created_by_id"), table_name="voice_sessions")
    op.drop_index(op.f("ix_voice_sessions_voice_agent_id"), table_name="voice_sessions")
    op.drop_index(op.f("ix_voice_sessions_organization_id"), table_name="voice_sessions")
    op.drop_table("voice_sessions")
    op.execute("DROP TYPE IF EXISTS voice_session_status")

    op.drop_index(op.f("ix_voice_agents_created_by_id"), table_name="voice_agents")
    op.drop_index(op.f("ix_voice_agents_ai_employee_id"), table_name="voice_agents")
    op.drop_index(op.f("ix_voice_agents_organization_id"), table_name="voice_agents")
    op.drop_table("voice_agents")
