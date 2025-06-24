from datetime import datetime

from pydantic import BaseModel


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
    task_id: int | None = None
    user_id: int | None = None


# Used for API responses
class TaskAssignmentResponse(TaskAssignmentBase):
    assignment_id: int

    class Config:
        from_attributes = True


# Used for listing task assignments with user/task details
class TaskAssignmentDetailResponse(TaskAssignmentResponse):
    # Optional fields for related data
    task_title: str | None = None
    user_username: str | None = None
    user_email: str | None = None

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
    task_description: str
    task_status: str | None = None
    task_priority: str | None = None
    task_deadline: str | None = None  # Will be datetime as string
    task_portfolio_id: int
    task_parent_task_id: int | None = None
    task_source_meeting_id: int | None = None
    task_created_at: datetime | None = None
    task_updated_at: datetime | None = None

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


class UpdateTaskUsersRequest(BaseModel):
    user_ids: list[int]
