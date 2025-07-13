"""Add user_can_see field to meeting_record table

Revision ID: 002
Revises: 001
Create Date: 2025-01-08 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database schema"""
    # Add user_can_see column to meeting_records table
    op.add_column('meeting_records', sa.Column('user_can_see', sa.Boolean(), nullable=False, server_default='true'))


def downgrade():
    """Downgrade the database schema"""
    # Remove user_can_see column from meeting_records table
    op.drop_column('meeting_records', 'user_can_see') 