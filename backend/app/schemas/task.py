from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# Shared properties
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "Not Started"
    priority: Optional[str] = "medium"
    deadline: datetime
    portfolio_id: int
    parent_task_id: Optional[int] = None
    source_meeting_id: Optional[int] = None


# Used when creating a task
class TaskCreateRequestBody(TaskBase):
    title: str
    deadline: datetime
    portfolio_id: int


# Used when updating a task
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    deadline: Optional[datetime] = None
    portfolio_id: Optional[int] = None
    parent_task_id: Optional[int] = None
    source_meeting_id: Optional[int] = None


# Used for API responses
class TaskResponse(TaskBase):
    task_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# Used for listing tasks (minimal info)
class TaskListResponse(BaseModel):
    task_id: int
    title: str
    status: Optional[str] = None
    priority: Optional[str] = None
    deadline: datetime
    portfolio_id: int
    
    class Config:
        from_attributes = True


# Used for task detail with relationships
class TaskDetailResponse(TaskResponse):
    # Include subtasks if needed
    subtasks: Optional[list["TaskListResponse"]] = None
    
    class Config:
        from_attributes = True 