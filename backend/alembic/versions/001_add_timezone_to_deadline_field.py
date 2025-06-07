"""Add timezone to deadline field

Revision ID: 001
Revises: 
Create Date: 2025-06-07 17:35:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Upgrade the database schema"""
    # Convert deadline field from TIMESTAMP to TIMESTAMPTZ
    # Assuming existing data is in Australia/Sydney timezone
    op.execute("""
        ALTER TABLE tasks 
        ALTER COLUMN deadline TYPE TIMESTAMPTZ 
        USING deadline AT TIME ZONE 'Australia/Sydney' AT TIME ZONE 'UTC'
    """)


def downgrade():
    """Downgrade the database schema"""
    # Convert back from TIMESTAMPTZ to TIMESTAMP
    op.execute("""
        ALTER TABLE tasks 
        ALTER COLUMN deadline TYPE TIMESTAMP 
        USING deadline AT TIME ZONE 'UTC'
    """) 