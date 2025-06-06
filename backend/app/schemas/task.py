from pydantic import BaseModel, computed_field
from datetime import datetime


# Shared properties
class TaskBase(BaseModel):
    title: str
    description: str | None = None
    status: str | None = "Not Started"
    priority: str | None = "medium"
    deadline: datetime
    portfolio_id: int
    parent_task_id: int | None = None
    source_meeting_id: int | None = None


# Used when creating a task
class TaskCreateRequestBody(TaskBase):
    title: str
    deadline: datetime
    portfolio_id: int


# Used when updating a task
class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    deadline: datetime | None = None
    portfolio_id: int | None = None
    parent_task_id: int | None = None
    source_meeting_id: int | None = None


# Used for API responses
class TaskResponse(TaskBase):
    task_id: int
    created_at: datetime | None = None
    updated_at: datetime | None = None
    
    class Config:
        from_attributes = True


# Used for listing tasks (minimal info)
class TaskListResponse(BaseModel):
    task_id: int
    title: str
    status: str | None = None
    priority: str | None = None
    deadline: datetime
    portfolio_id: int
    
    class Config:
        from_attributes = True


# Used for task detail with relationships
class TaskDetailResponse(TaskResponse):
    # Include subtasks if needed
    subtasks: list["TaskListResponse"] | None = None
    
    class Config:
        from_attributes = True


# Used for assigned user info in reminders
class AssignedUserResponse(BaseModel):
    user_id: int
    username: str
    discord_id: str | None = None
    
    class Config:
        from_attributes = True


# Used for task reminders (includes portfolio info and assigned users)
class TaskReminderResponse(BaseModel):
    task_id: int
    title: str
    description: str | None = None
    deadline: datetime  # UTC time from database
    priority: str | None = None
    status: str | None = None
    portfolio_id: int
    portfolio_name: str
    portfolio_channel: str | None = None  # Discord channel ID for the portfolio
    assigned_users: list[AssignedUserResponse] = []  # Users assigned to this task
    
    @computed_field
    @property
    def deadline_local(self) -> str:
        """Get deadline formatted in project timezone"""
        from app.utils.timezone import tz
        return tz.format_local_time(self.deadline)
    
    @computed_field
    @property
    def deadline_local_date(self) -> str:
        """Get deadline date in project timezone"""
        from app.utils.timezone import tz
        local_dt = tz.to_local(self.deadline)
        return local_dt.strftime('%Y-%m-%d')
    
    @computed_field
    @property
    def deadline_local_time(self) -> str:
        """Get deadline time in project timezone"""
        from app.utils.timezone import tz
        local_dt = tz.to_local(self.deadline)
        return local_dt.strftime('%H:%M:%S')
    
    class Config:
        from_attributes = True


# Response for tomorrow's reminders
class TomorrowRemindersResponse(BaseModel):
    tasks: list[TaskReminderResponse]
    total_count: int 