"""create explanations table

Revision ID: d4e5f6a1b2c3
Revises: c3d4e5f6a1b2
Create Date: 2026-04-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a1b2c3"
down_revision: Union[str, None] = "c3d4e5f6a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "explanations",
        sa.Column(
            "explanation_id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("generated_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("rating", sa.String(4), nullable=True),
        sa.Column("needs_regeneration", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("prompt_tokens", sa.Integer(), nullable=True),
        sa.Column("completion_tokens", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.user_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("explanation_id"),
        sa.UniqueConstraint(
            "user_id", "article_id", "mode", "version",
            name="uq_explanations_user_article_mode_version",
        ),
    )
    op.create_index(
        "ix_explanations_user_article_mode",
        "explanations",
        ["user_id", "article_id", "mode"],
    )


def downgrade() -> None:
    op.drop_index("ix_explanations_user_article_mode", table_name="explanations")
    op.drop_table("explanations")
