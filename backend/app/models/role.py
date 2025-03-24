from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.session import Base


class Role(Base):
    __tablename__ = "roles"

    role_id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    # Add reverse relationship with User model
    users = relationship("User", back_populates="role") 