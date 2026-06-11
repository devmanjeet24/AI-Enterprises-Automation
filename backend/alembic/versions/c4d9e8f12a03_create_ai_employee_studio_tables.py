"""create ai employee studio tables

Revision ID: c4d9e8f12a03
Revises: b8e4f2a91c30
Create Date: 2026-06-10 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "c4d9e8f12a03"
down_revision: Union[str, Sequence[str], None] = "b8e4f2a91c30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "ai_employees",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "inactive", name="ai_employee_status"),
            nullable=False,
            server_default="inactive",
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
            ["created_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_ai_employees_organization_id"),
        "ai_employees",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_employees_created_by_id"),
        "ai_employees",
        ["created_by_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ai_employees_status"),
        "ai_employees",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_ai_employees_organization_id_status",
        "ai_employees",
        ["organization_id", "status"],
        unique=False,
    )

    op.create_table(
        "ai_employee_documents",
        sa.Column("ai_employee_id", sa.UUID(), nullable=False),
        sa.Column("knowledge_document_id", sa.UUID(), nullable=False),
        sa.Column(
            "assigned_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["ai_employee_id"],
            ["ai_employees.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["knowledge_document_id"],
            ["knowledge_documents.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("ai_employee_id", "knowledge_document_id"),
    )
    op.create_index(
        op.f("ix_ai_employee_documents_knowledge_document_id"),
        "ai_employee_documents",
        ["knowledge_document_id"],
        unique=False,
    )

    op.create_table(
        "ai_employee_tools",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("ai_employee_id", sa.UUID(), nullable=False),
        sa.Column("tool_slug", sa.String(length=50), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")),
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
            ["ai_employee_id"],
            ["ai_employees.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "ai_employee_id",
            "tool_slug",
            name="uq_ai_employee_tools_ai_employee_id_tool_slug",
        ),
    )
    op.create_index(
        op.f("ix_ai_employee_tools_ai_employee_id"),
        "ai_employee_tools",
        ["ai_employee_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_ai_employee_tools_ai_employee_id"), table_name="ai_employee_tools")
    op.drop_table("ai_employee_tools")
    op.drop_index(
        op.f("ix_ai_employee_documents_knowledge_document_id"),
        table_name="ai_employee_documents",
    )
    op.drop_table("ai_employee_documents")
    op.drop_index("ix_ai_employees_organization_id_status", table_name="ai_employees")
    op.drop_index(op.f("ix_ai_employees_status"), table_name="ai_employees")
    op.drop_index(op.f("ix_ai_employees_created_by_id"), table_name="ai_employees")
    op.drop_index(op.f("ix_ai_employees_organization_id"), table_name="ai_employees")
    op.drop_table("ai_employees")
    sa.Enum(name="ai_employee_status").drop(op.get_bind(), checkfirst=True)
