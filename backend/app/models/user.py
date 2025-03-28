from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(Text, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    discord_id = Column(String, unique=True, nullable=False)
    # Add relationship with Role model
    role = relationship("Role", back_populates="users") 