from pydantic import BaseModel
from typing import Optional


# Shared properties
class TaskAssignmentBase(BaseModel):
    task_id: int
    user_id: int


# Used when creating a task assignment
class TaskAssignmentCreateRequestBody(TaskAssignmentBase):
    task_id: int
    user_id: int


# Used when updating a task assignment (rarely needed, but for completeness)
class TaskAssignmentUpdate(BaseModel):
    task_id: Optional[int] = None
    user_id: Optional[int] = None


# Used for API responses
class TaskAssignmentResponse(TaskAssignmentBase):
    assignment_id: int
    
    class Config:
        from_attributes = True


# Used for listing task assignments with user/task details
class TaskAssignmentDetailResponse(TaskAssignmentResponse):
    # Optional fields for related data
    task_title: Optional[str] = None
    user_username: Optional[str] = None
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


# Used for bulk assignment operations
class BulkTaskAssignmentCreate(BaseModel):
    task_id: int
    user_ids: list[int]


# Used for user's task assignments view
class UserTaskAssignmentResponse(BaseModel):
    assignment_id: int
    task_id: int
    task_title: str
    task_status: Optional[str] = None
    task_priority: Optional[str] = None
    task_deadline: Optional[str] = None  # Will be datetime as string
    
    class Config:
        from_attributes = True


# Used for task's assigned users view
class TaskUserAssignmentResponse(BaseModel):
    assignment_id: int
    user_id: int
    user_username: str
    user_email: str
    
    class Config:
        from_attributes = True 