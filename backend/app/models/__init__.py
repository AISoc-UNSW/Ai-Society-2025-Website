# Import all models to ensure SQLAlchemy recognizes all table relationships
from app.models.user import User
from app.models.role import Role
from app.models.portfolio import Portfolio
from app.models.task import Task
from app.models.meeting_record import MeetingRecord
from app.models.task_assignment import TaskAssignment

__all__ = [
    "User",
    "Role", 
    "Portfolio",
    "Task",
    "MeetingRecord",
    "TaskAssignment",
] 