from typing import TYPE_CHECKING, Optional
from sqlalchemy import ForeignKey, String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.portfolio import Portfolio
    from app.models.task import Task

class MeetingRecord(Base):
    __tablename__ = "meeting_records"

    meeting_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    meeting_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    meeting_name: Mapped[str] = mapped_column(String, nullable=False)
    recording_file_link: Mapped[str | None] = mapped_column(Text, nullable=True)
    auto_caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.portfolio_id"), nullable=False)
    user_can_see: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="meeting_records")
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="source_meeting") 