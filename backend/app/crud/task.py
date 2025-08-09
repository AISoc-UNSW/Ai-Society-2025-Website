from datetime import datetime, timedelta

import pytz
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.portfolio import Portfolio
from app.models.task import Task
from app.models.task_assignment import TaskAssignment
from app.models.user import User
from app.schemas.task import TaskCreateRequestBody, TaskResponse, TaskUpdate
from app.utils.timezone import tz


def get_by_id(db: Session, task_id: int) -> Task | None:
    """Get task by ID"""
    return db.query(Task).filter(Task.task_id == task_id).first()


def _build_task_list_response_data(task: Task, include_subtasks: bool = True) -> dict:
    """Helper function to build TaskListResponse data from Task model"""
    task_data = {
        "task_id": task.task_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "deadline": task.deadline,
        "parent_task_id": task.parent_task_id,
        "source_meeting_id": task.source_meeting_id,
        "portfolio": {
            "portfolio_id": task.portfolio_id,
            "name": task.portfolio.name,
        },
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "created_by": {
            "user_id": task.created_by_user.user_id,
            "username": task.created_by_user.username,
            "email": task.created_by_user.email,
        },
        "assignees": [],
    }

    if hasattr(task, "task_assignments") and task.task_assignments:
        task_data["assignees"] = [
            {
                "assignment_id": assignment.assignment_id,
                "user_id": assignment.user.user_id,
                "username": assignment.user.username,
                "email": assignment.user.email,
            }
            for assignment in task.task_assignments
        ]

    if include_subtasks and hasattr(task, "subtasks"):
        task_data["subtasks"] = (
            [
                _build_task_list_response_data(subtask, include_subtasks=False)
                for subtask in task.subtasks
            ]
            if task.subtasks
            else []
        )
    else:
        task_data["subtasks"] = None

    return task_data


def get_by_portfolio(
    db: Session,
    portfolio_id: int,
    skip: int = 0,
    limit: int = 100,
    include_subtasks: bool = True,
) -> list[dict]:
    """Get tasks by portfolio ID"""
    tasks = (
        db.query(Task)
        .options(joinedload(Task.portfolio), joinedload(Task.created_by_user))
        .filter(Task.portfolio_id == portfolio_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def get_by_status(db: Session, status: str, skip: int = 0, limit: int = 100) -> list[Task]:
    """Get tasks by status"""
    return db.query(Task).filter(Task.status == status).offset(skip).limit(limit).all()


def get_by_priority(db: Session, priority: str, skip: int = 0, limit: int = 100) -> list[Task]:
    """Get tasks by priority"""
    return db.query(Task).filter(Task.priority == priority).offset(skip).limit(limit).all()


def get_by_created_by(
    db: Session, user_id: int, skip: int = 0, limit: int = 100, include_subtasks: bool = True
) -> list[dict]:
    """Get tasks created by a specific user"""
    tasks = (
        db.query(Task)
        .options(joinedload(Task.portfolio), joinedload(Task.created_by_user))
        .filter(Task.created_by == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def get_subtasks(db: Session, parent_task_id: int, include_subtasks: bool = True) -> list[dict]:
    """Get subtasks of a parent task"""
    tasks = (
        db.query(Task)
        .options(joinedload(Task.portfolio), joinedload(Task.created_by_user))
        .filter(Task.parent_task_id == parent_task_id)
        .all()
    )

    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def get_by_meeting(db: Session, meeting_id: int, include_subtasks: bool = True) -> list[dict]:
    """Get tasks created from a specific meeting"""
    tasks = (
        db.query(Task)
        .options(joinedload(Task.portfolio), joinedload(Task.created_by_user))
        .filter(Task.source_meeting_id == meeting_id)
        .all()
    )

    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def get_pending_tasks_by_meeting(
    db: Session, meeting_id: int, include_subtasks: bool = True
) -> list[dict]:
    """Get pending tasks created from a specific meeting"""
    tasks = (
        db.query(Task)
        .options(joinedload(Task.portfolio), joinedload(Task.created_by_user))
        .filter(Task.source_meeting_id == meeting_id, Task.status == "Pending")
        .all()
    )

    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def get_multi(
    db: Session,
    *,
    portfolio_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    skip: int = 0,
    limit: int = 100,
    include_subtasks: bool = True,
) -> list[dict]:
    """Get multiple tasks with optional filters, including portfolio and user info"""
    query = db.query(Task).options(joinedload(Task.portfolio), joinedload(Task.created_by_user))

    # If include subtasks, use selectinload to preload subtasks
    if include_subtasks:
        query = query.options(
            selectinload(Task.subtasks).options(
                joinedload(Task.portfolio), joinedload(Task.created_by_user)
            )
        )

    if portfolio_id:
        query = query.filter(Task.portfolio_id == portfolio_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)

    tasks = query.offset(skip).limit(limit).all()

    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def _build_task_response_data(task: Task | None) -> dict:
    """Helper function to build TaskResponse data from Task model"""
    if not task:
        raise ValueError("Task cannot be None")

    return {
        "task_id": task.task_id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "deadline": task.deadline,
        "parent_task_id": task.parent_task_id,
        "source_meeting_id": task.source_meeting_id,
        "portfolio": {
            "portfolio_id": task.portfolio_id,
            "name": task.portfolio.name,
        },
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "created_by": {
            "user_id": task.created_by_user.user_id,
            "username": task.created_by_user.username,
            "email": task.created_by_user.email,
        },
        "assignees": (
            [
                {
                    "assignment_id": assignment.assignment_id,
                    "user_id": assignment.user.user_id,
                    "username": assignment.user.username,
                    "email": assignment.user.email,
                }
                for assignment in task.task_assignments
            ]
            if hasattr(task, "task_assignments") and task.task_assignments
            else []
        ),
    }


def create_task(db: Session, *, obj_in: TaskCreateRequestBody, created_by: int) -> TaskResponse:
    """Create new task"""
    db_obj = Task()
    db_obj.title = obj_in.title
    db_obj.description = obj_in.description
    db_obj.status = "Not Started"
    db_obj.priority = obj_in.priority or "Medium"

    # Ensure deadline is converted to UTC for storage
    if obj_in.deadline.tzinfo is None:
        # If no timezone info, assume project default timezone
        db_obj.deadline = tz.to_utc(obj_in.deadline)
    else:
        db_obj.deadline = obj_in.deadline.astimezone(pytz.UTC)

    db_obj.portfolio_id = obj_in.portfolio_id
    db_obj.parent_task_id = getattr(obj_in, "parent_task_id", None)
    db_obj.source_meeting_id = getattr(obj_in, "source_meeting_id", None)
    db_obj.created_by = created_by
    db_obj.created_at = tz.now_utc()
    db_obj.updated_at = tz.now_utc()

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Load relationships for proper response construction
    task_with_relations = (
        db.query(Task)
        .options(
            joinedload(Task.portfolio),
            joinedload(Task.created_by_user),
            selectinload(Task.task_assignments).joinedload(TaskAssignment.user),
        )
        .filter(Task.task_id == db_obj.task_id)
        .first()
    )

    # Use helper function to build proper TaskResponse
    task_data = _build_task_response_data(task_with_relations)
    return TaskResponse(**task_data)


def update_task(db: Session, *, db_obj: Task, obj_in: dict | TaskUpdate) -> TaskResponse:
    """Update existing task"""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)

    # Handle deadline timezone conversion if being updated
    if "deadline" in update_data and update_data["deadline"] is not None:
        deadline = update_data["deadline"]
        if isinstance(deadline, datetime):
            if deadline.tzinfo is None:
                # If no timezone info, assume project default timezone
                update_data["deadline"] = tz.to_utc(deadline)
            else:
                update_data["deadline"] = deadline.astimezone(pytz.UTC)

    # Always update the updated_at timestamp
    update_data["updated_at"] = tz.now_utc()

    for field in update_data:
        setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    # Load relationships for proper response construction
    task_with_relations = (
        db.query(Task)
        .options(
            joinedload(Task.portfolio),
            joinedload(Task.created_by_user),
            selectinload(Task.task_assignments).joinedload(TaskAssignment.user),
        )
        .filter(Task.task_id == db_obj.task_id)
        .first()
    )

    # Use helper function to build proper TaskResponse
    task_data = _build_task_response_data(task_with_relations)
    return TaskResponse(**task_data)


def delete_task(db: Session, *, task_id: int) -> bool:
    """Delete task by ID"""
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if task:
        db.delete(task)
        db.commit()
        return True
    return False


def search_tasks(
    db: Session,
    search_term: str,
    portfolio_id: int | None = None,
    include_subtasks: bool = True,
) -> list[dict]:
    """Search tasks by title or description"""
    query = (
        db.query(Task)
        .options(joinedload(Task.portfolio), joinedload(Task.created_by_user))
        .filter(
            or_(Task.title.ilike(f"%{search_term}%"), Task.description.ilike(f"%{search_term}%"))
        )
    )

    if portfolio_id:
        query = query.filter(Task.portfolio_id == portfolio_id)

    tasks = query.all()
    return [_build_task_list_response_data(task, include_subtasks) for task in tasks]


def get_tomorrow_reminders(db: Session, portfolio_id: int | None = None) -> list[dict]:
    """Get tasks due tomorrow and not completed with portfolio and user info (project timezone)"""

    # Get current project timezone time
    now_local = tz.now_local()

    # Calculate tomorrow's date range (project timezone)
    tomorrow_start = (now_local + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    tomorrow_end = tomorrow_start + timedelta(days=1)

    # Convert to UTC time for database query
    tomorrow_start_utc = tz.to_utc(tomorrow_start)
    tomorrow_end_utc = tz.to_utc(tomorrow_end)

    # Query tasks with join to get portfolio info
    query = db.query(Task).join(Portfolio)

    # Use UTC time range for query (since deadline is now stored with timezone in UTC)
    query = query.filter(
        Task.deadline >= tomorrow_start_utc,
        Task.deadline < tomorrow_end_utc,
        Task.status.in_(["Not Started", "In Progress"]),
    )

    # Optional portfolio filter
    if portfolio_id:
        query = query.filter(Task.portfolio_id == portfolio_id)

    tasks = query.order_by(Task.priority.desc(), Task.deadline.asc()).all()

    # Build result with portfolio and user info
    result = []
    for task in tasks:
        # Get assigned users for this task
        assigned_users = (
            db.query(User).join(TaskAssignment).filter(TaskAssignment.task_id == task.task_id).all()
        )

        # Build task data with portfolio and user info
        task_data = {
            "task_id": task.task_id,
            "title": task.title,
            "description": task.description,
            "deadline": task.deadline,
            "priority": task.priority,
            "status": task.status,
            "portfolio_id": task.portfolio_id,
            "portfolio_name": task.portfolio.name,
            "portfolio_channel": task.portfolio.channel_id,
            "created_by": task.created_by,
            "assigned_users": [
                {"user_id": user.user_id, "username": user.username, "discord_id": user.discord_id}
                for user in assigned_users
            ],
        }
        result.append(task_data)

    return result


def create_task_group(
    db: Session,
    *,
    tasks_data: list[dict],
    portfolio_id: int | None = None,
    source_meeting_id: int | None = None,
    created_by: int,
) -> list[int]:
    """
    Create a group of tasks with hierarchical structure (parent-child relationships)

    Args:
        db: Database session
        tasks_data: List of task dictionaries with potential subtasks
        portfolio_id: Optional portfolio ID for all tasks
        source_meeting_id: Optional meeting ID these tasks come from
        created_by: User ID of the person creating the tasks

    Returns:
        List of created task IDs
    """
    created_task_ids = []

    def create_single_task(task_data: dict, parent_task_id: int | None = None) -> int | None:
        """
        Create a single task and its subtasks recursively
        """
        try:
            # Create the main task
            db_obj = Task()
            db_obj.title = task_data.get("title", "Untitled Task")
            db_obj.description = task_data.get("description", "")
            db_obj.status = "Pending"  # Force status to be Pending as required
            db_obj.priority = task_data.get("priority", "Medium")

            # Handle deadline - convert string to datetime
            deadline_str = task_data.get("deadline", "2025-12-31")
            if isinstance(deadline_str, str):
                try:
                    # Parse date string and set time to end of day
                    deadline_date = datetime.strptime(deadline_str, "%Y-%m-%d")
                    deadline_with_time = deadline_date.replace(hour=23, minute=59, second=59)
                    db_obj.deadline = tz.to_utc(deadline_with_time)
                except ValueError:
                    # Fallback to default if parsing fails
                    default_deadline = datetime.strptime("2025-12-31", "%Y-%m-%d").replace(
                        hour=23, minute=59, second=59
                    )
                    db_obj.deadline = tz.to_utc(default_deadline)
            else:
                # If it's already a datetime object
                db_obj.deadline = tz.to_utc(deadline_str)

            db_obj.portfolio_id = portfolio_id or 100  # 100 is the No Portfolio ID
            db_obj.parent_task_id = parent_task_id
            db_obj.source_meeting_id = source_meeting_id
            db_obj.created_by = created_by
            db_obj.created_at = tz.now_utc()
            db_obj.updated_at = tz.now_utc()

            db.add(db_obj)
            db.flush()  # Flush to get the ID without committing

            task_id = db_obj.task_id

            # Handle subtasks if they exist
            subtasks = task_data.get("subtasks", [])
            if subtasks and isinstance(subtasks, list):
                for subtask_data in subtasks:
                    if isinstance(subtask_data, dict) and subtask_data.get("title"):
                        create_single_task(subtask_data, parent_task_id=task_id)

            return task_id

        except Exception as e:
            print(f"Error creating task {task_data.get('title', 'Unknown')}: {e}")
            db.rollback()
            return None

    try:
        # Create all top-level tasks
        for task_data in tasks_data:
            if isinstance(task_data, dict) and task_data.get("title"):
                task_id = create_single_task(task_data)
                if task_id:
                    created_task_ids.append(task_id)

        # Commit all changes at once
        db.commit()

    except Exception as e:
        print(f"Error in task group creation: {e}")
        db.rollback()
        raise

    return created_task_ids
