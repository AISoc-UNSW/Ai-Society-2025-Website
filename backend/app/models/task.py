from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.portfolio import Portfolio
    from app.models.meeting_record import MeetingRecord

class Task(Base):
    __tablename__ = "tasks"

    task_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String, nullable=True, default="Not Started")
    priority: Mapped[str | None] = mapped_column(String, nullable=True, default="medium")
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=datetime.utcnow)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=datetime.utcnow)
    portfolio_id: Mapped[int] = mapped_column(ForeignKey("portfolios.portfolio_id"), nullable=False)
    parent_task_id: Mapped[int | None] = mapped_column(ForeignKey("tasks.task_id"), nullable=True)
    source_meeting_id: Mapped[int | None] = mapped_column(ForeignKey("meeting_records.meeting_id"), nullable=True)

    # Relationships
    portfolio: Mapped["Portfolio"] = relationship("Portfolio", back_populates="tasks")
    parent_task: Mapped["Task | None"] = relationship("Task", remote_side=[task_id], back_populates="subtasks")
    subtasks: Mapped[list["Task"]] = relationship("Task", back_populates="parent_task", remote_side=[parent_task_id])
    source_meeting: Mapped["MeetingRecord | None"] = relationship("MeetingRecord", back_populates="tasks") 