from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import task
from app.models.user import User
from app.schemas.task import (
    TaskCreateRequestBody,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    TaskDetailResponse,
    TaskReminderResponse,
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
    task_record = task.create_task(db, obj_in=task_in)
    return TaskResponse(**task_record.__dict__)


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
    """
    tasks = task.get_tomorrow_reminders(db, portfolio_id=portfolio_id)
    
    # Convert to response model with portfolio info
    task_reminders = []
    for task_record in tasks:
        reminder = TaskReminderResponse(
            task_id=task_record.task_id,
            title=task_record.title,
            description=task_record.description,
            deadline=task_record.deadline,
            priority=task_record.priority,
            status=task_record.status,
            portfolio_id=task_record.portfolio_id,
            portfolio_name=task_record.portfolio.name if task_record.portfolio else "Unknown"
        )
        task_reminders.append(reminder)
    
    return TomorrowRemindersResponse(
        tasks=task_reminders,
        total_count=len(task_reminders)
    )
