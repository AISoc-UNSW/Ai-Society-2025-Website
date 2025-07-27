from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

if TYPE_CHECKING:
    from app.models.task import Task
    from app.models.user import User


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    assignment_id: Mapped[int] = mapped_column(primary_key=True, index=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.task_id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.user_id"), nullable=False)

    # Relationships
    task: Mapped["Task"] = relationship("Task", back_populates="task_assignments")
    user: Mapped["User"] = relationship("User")
