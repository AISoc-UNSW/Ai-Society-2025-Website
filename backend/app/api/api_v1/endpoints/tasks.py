from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import task
from app.models.user import User
from app.schemas.task import (
    TaskCreatedByResponse,
    TaskCreateRequestBody,
    TaskDetailResponse,
    TaskGroupCreateRequest,
    TaskGroupCreateResponse,
    TaskListResponse,
    TaskReminderResponse,
    TaskResponse,
    TaskUpdate,
    TomorrowRemindersResponse,
)

router = APIRouter()


@router.post("/", response_model=TaskResponse)
def create_task(
    *,
    db: Session = Depends(deps.get_db),
    task_in: TaskCreateRequestBody,
    current_user: User = Depends(deps.get_current_user),
) -> TaskResponse:
    """
    Create new task
    """
    task_record = task.create_task(db, obj_in=task_in, created_by=current_user.user_id)
    return TaskResponse(**task_record.__dict__)


@router.get("/", response_model=list[TaskListResponse])
def read_tasks(
    db: Session = Depends(deps.get_db),
    portfolio_id: int | None = Query(None, description="Filter by portfolio ID"),
    status: str | None = Query(None, description="Filter by status"),
    priority: str | None = Query(None, description="Filter by priority"),
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Get tasks with optional filters
    """
    tasks = task.get_multi(
        db, portfolio_id=portfolio_id, status=status, priority=priority, skip=skip, limit=limit
    )
    return [TaskListResponse(**task_record.__dict__) for task_record in tasks]


@router.get("/created-by/{user_id}", response_model=list[TaskListResponse])
def read_tasks_created_by(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Get tasks created by a specific user
    """
    tasks = task.get_by_created_by(db, user_id=user_id, skip=skip, limit=limit)
    return [TaskListResponse(**task_record.__dict__) for task_record in tasks]


@router.get("/{task_id}/created-by", response_model=TaskCreatedByResponse)
def read_task_created_by(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> TaskCreatedByResponse:
    """
    Get the user who created the task
    """
    task_record = task.get_by_id(db, task_id=task_id)
    if not task_record:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskCreatedByResponse(**task_record.created_by_user.__dict__)


@router.get("/{task_id}", response_model=TaskDetailResponse)
def read_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> TaskDetailResponse:
    """
    Get task by ID with details
    """
    task_record = task.get_by_id(db, task_id=task_id)
    if not task_record:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get subtasks if any
    subtasks = task.get_subtasks(db, parent_task_id=task_id)
    subtasks_data = [TaskListResponse(**subtask.__dict__) for subtask in subtasks]

    task_data = TaskDetailResponse(**task_record.__dict__)
    task_data.subtasks = subtasks_data
    return task_data


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> TaskResponse:
    """
    Update task
    """
    task_record = task.get_by_id(db, task_id=task_id)
    if not task_record:
        raise HTTPException(status_code=404, detail="Task not found")

    task_record = task.update_task(db, db_obj=task_record, obj_in=task_in)
    return TaskResponse(**task_record.__dict__)


@router.delete("/{task_id}")
def delete_task(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete task
    """
    success = task.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}


@router.get("/portfolio/{portfolio_id}", response_model=list[TaskListResponse])
def read_tasks_by_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Get tasks by portfolio ID
    """
    tasks = task.get_by_portfolio(db, portfolio_id=portfolio_id, skip=skip, limit=limit)
    return [TaskListResponse(**task_record.__dict__) for task_record in tasks]


@router.get("/subtasks/{parent_task_id}", response_model=list[TaskListResponse])
def read_subtasks(
    *,
    db: Session = Depends(deps.get_db),
    parent_task_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Get subtasks of a parent task
    """
    subtasks = task.get_subtasks(db, parent_task_id=parent_task_id)
    return [TaskListResponse(**subtask.__dict__) for subtask in subtasks]


@router.get("/meeting/{meeting_id}", response_model=list[TaskListResponse])
def read_tasks_by_meeting(
    *,
    db: Session = Depends(deps.get_db),
    meeting_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Get tasks created from a specific meeting
    """
    tasks = task.get_by_meeting(db, meeting_id=meeting_id)
    return [TaskListResponse(**task_record.__dict__) for task_record in tasks]


@router.get("/meeting/{meeting_id}/pending", response_model=list[TaskListResponse])
def get_pending_tasks_by_meeting(
    *,
    db: Session = Depends(deps.get_db),
    meeting_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Get pending tasks created from a specific meeting
    """
    tasks = task.get_pending_tasks_by_meeting(db, meeting_id=meeting_id)
    return [TaskListResponse(**task_record.__dict__) for task_record in tasks]


@router.get("/search/", response_model=list[TaskListResponse])
def search_tasks(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, description="Search term"),
    portfolio_id: int | None = Query(None, description="Filter by portfolio ID"),
    current_user: User = Depends(deps.get_current_user),
) -> list[TaskListResponse]:
    """
    Search tasks by title or description
    """
    tasks = task.search_tasks(db, search_term=q, portfolio_id=portfolio_id)
    return [TaskListResponse(**task_record.__dict__) for task_record in tasks]


@router.get("/reminders/tomorrow", response_model=TomorrowRemindersResponse)
def get_tomorrow_reminders(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int | None = Query(None, description="Filter by portfolio ID"),
    current_user: User = Depends(deps.get_current_user),
) -> TomorrowRemindersResponse:
    """
    Get tasks due tomorrow and not completed (Sydney timezone)
    Returns tasks with status 'Not Started' or 'In Progress' that are due tomorrow
    Includes portfolio channel and assigned users with their Discord IDs
    """
    tasks_data = task.get_tomorrow_reminders(db, portfolio_id=portfolio_id)

    # Convert to response model with portfolio and user info
    task_reminders = []
    for task_data in tasks_data:
        reminder = TaskReminderResponse(
            task_id=task_data["task_id"],
            title=task_data["title"],
            description=task_data["description"],
            deadline=task_data["deadline"],
            priority=task_data["priority"],
            status=task_data["status"],
            portfolio_id=task_data["portfolio_id"],
            portfolio_name=task_data["portfolio_name"],
            portfolio_channel=task_data["portfolio_channel"],
            assigned_users=task_data["assigned_users"],
        )
        task_reminders.append(reminder)

    return TomorrowRemindersResponse(tasks=task_reminders, total_count=len(task_reminders))


@router.post("/group", response_model=TaskGroupCreateResponse)
def create_task_group(
    *,
    db: Session = Depends(deps.get_db),
    task_group_in: TaskGroupCreateRequest,
    current_user: User = Depends(deps.get_current_user),
) -> TaskGroupCreateResponse:
    """
    Create a group of related tasks with hierarchical structure

    This endpoint allows creating multiple tasks at once with parent-child relationships.
    Each task can have subtasks, and subtasks can have their own subtasks (nested structure).

    Args:
        task_group_in: Request body containing list of tasks and metadata
        current_user: Current authenticated user

    Returns:
        Response with created task IDs and summary
    """
    try:
        # Convert pydantic models to dictionaries for processing
        tasks_data = [task_item.model_dump() for task_item in task_group_in.tasks]

        # Create the task group
        created_task_ids = task.create_task_group(
            db,
            tasks_data=tasks_data,
            portfolio_id=task_group_in.portfolio_id,
            source_meeting_id=task_group_in.source_meeting_id,
            created_by=current_user.user_id,
        )

        return TaskGroupCreateResponse(
            created_task_ids=created_task_ids,
            total_created=len(created_task_ids),
            message=f"Successfully created {len(created_task_ids)} tasks",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create task group: {str(e)}")
