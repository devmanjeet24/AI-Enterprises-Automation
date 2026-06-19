"""create user invitations table

Revision ID: q6l0m4n17o28
Revises: p5k9l3m04n16
Create Date: 2026-06-16 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "q6l0m4n17o28"
down_revision: Union[str, Sequence[str], None] = "p5k9l3m04n16"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_invitations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=True),
        sa.Column("last_name", sa.String(length=100), nullable=True),
        sa.Column("role_id", sa.UUID(), nullable=False),
        sa.Column("invited_by_id", sa.UUID(), nullable=True),
        sa.Column("accepted_by_id", sa.UUID(), nullable=True),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["accepted_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["invited_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash", name="uq_user_invitations_token_hash"),
    )
    op.create_index(op.f("ix_user_invitations_accepted_by_id"), "user_invitations", ["accepted_by_id"], unique=False)
    op.create_index(op.f("ix_user_invitations_email"), "user_invitations", ["email"], unique=False)
    op.create_index(op.f("ix_user_invitations_invited_by_id"), "user_invitations", ["invited_by_id"], unique=False)
    op.create_index(op.f("ix_user_invitations_organization_id"), "user_invitations", ["organization_id"], unique=False)
    op.create_index(op.f("ix_user_invitations_role_id"), "user_invitations", ["role_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_invitations_role_id"), table_name="user_invitations")
    op.drop_index(op.f("ix_user_invitations_organization_id"), table_name="user_invitations")
    op.drop_index(op.f("ix_user_invitations_invited_by_id"), table_name="user_invitations")
    op.drop_index(op.f("ix_user_invitations_email"), table_name="user_invitations")
    op.drop_index(op.f("ix_user_invitations_accepted_by_id"), table_name="user_invitations")
    op.drop_table("user_invitations")
