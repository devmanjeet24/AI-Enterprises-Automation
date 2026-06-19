"""add linkedin omnichannel channel type

Revision ID: v1q5r9s62t73
Revises: u0p4q8r51s62
Create Date: 2026-06-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "v1q5r9s62t73"
down_revision: Union[str, Sequence[str], None] = "u0p4q8r51s62"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE omnichannel_channel_type ADD VALUE IF NOT EXISTS 'linkedin'")


def downgrade() -> None:
    pass
