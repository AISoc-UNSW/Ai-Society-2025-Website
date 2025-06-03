from typing import TYPE_CHECKING
from sqlalchemy import String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.task import Task
    from app.models.meeting_record import MeetingRecord

class Portfolio(Base):
    __tablename__ = "portfolios"

    portfolio_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    channel_id: Mapped[str | None] = mapped_column(String, nullable=True)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="portfolio")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="portfolio")
    meeting_records: Mapped[list["MeetingRecord"]] = relationship("MeetingRecord", back_populates="portfolio") 