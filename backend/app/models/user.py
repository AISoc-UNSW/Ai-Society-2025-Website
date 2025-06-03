from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.portfolio import Portfolio


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(Text, unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(nullable=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.role_id"), nullable=False)
    discord_id: Mapped[str | None] = mapped_column(unique=True, nullable=True)
    portfolio_id: Mapped[int | None] = mapped_column(ForeignKey("portfolios.portfolio_id"), nullable=True)
    
    # Relationships
    role: Mapped["Role"] = relationship("Role", back_populates="users")
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="users")
