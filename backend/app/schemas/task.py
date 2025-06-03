from pydantic import BaseModel
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