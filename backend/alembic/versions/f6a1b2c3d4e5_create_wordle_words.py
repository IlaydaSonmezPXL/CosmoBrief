"""create wordle_words table

Revision ID: f6a1b2c3d4e5
Revises: e5f6a1b2c3d4
Create Date: 2026-05-04
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f6a1b2c3d4e5"
down_revision: Union[str, None] = "e5f6a1b2c3d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "wordle_words",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("word", sa.String(5), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("word", name="uq_wordle_words_word"),
    )
    op.create_index("ix_wordle_words_id", "wordle_words", ["id"])


def downgrade() -> None:
    op.drop_index("ix_wordle_words_id", table_name="wordle_words")
    op.drop_table("wordle_words")
