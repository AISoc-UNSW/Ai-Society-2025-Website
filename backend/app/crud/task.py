from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from datetime import datetime, timezone, timedelta
import pytz

from app.models.task import Task
from app.models.portfolio import Portfolio
from app.models.task_assignment import TaskAssignment
from app.models.user import User
from app.schemas.task import TaskCreateRequestBody, TaskUpdate
from app.utils.timezone import tz


def get_by_id(db: Session, task_id: int) -> Task | None:
    """Get task by ID"""
    return db.query(Task).filter(Task.task_id == task_id).first()


def get_by_portfolio(db: Session, portfolio_id: int, skip: int = 0, limit: int = 100) -> list[Task]:
    """Get tasks by portfolio ID"""
    return db.query(Task).filter(Task.portfolio_id == portfolio_id).offset(skip).limit(limit).all()


def get_by_status(db: Session, status: str, skip: int = 0, limit: int = 100) -> list[Task]:
    """Get tasks by status"""
    return db.query(Task).filter(Task.status == status).offset(skip).limit(limit).all()


def get_by_priority(db: Session, priority: str, skip: int = 0, limit: int = 100) -> list[Task]:
    """Get tasks by priority"""
    return db.query(Task).filter(Task.priority == priority).offset(skip).limit(limit).all()


def get_subtasks(db: Session, parent_task_id: int) -> list[Task]:
    """Get subtasks of a parent task"""
    return db.query(Task).filter(Task.parent_task_id == parent_task_id).all()


def get_by_meeting(db: Session, meeting_id: int) -> list[Task]:
    """Get tasks created from a specific meeting"""
    return db.query(Task).filter(Task.source_meeting_id == meeting_id).all()


def get_multi(
    db: Session,
    *,
    portfolio_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    skip: int = 0,
    limit: int = 100
) -> list[Task]:
    """Get multiple tasks with optional filters"""
    query = db.query(Task)
    
    if portfolio_id:
        query = query.filter(Task.portfolio_id == portfolio_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    
    return query.offset(skip).limit(limit).all()


def create_task(db: Session, *, obj_in: TaskCreateRequestBody) -> Task:
    """Create new task"""
    db_obj = Task()
    db_obj.title = obj_in.title
    db_obj.description = obj_in.description
    db_obj.status = obj_in.status or "Not Started"
    db_obj.priority = obj_in.priority or "medium"
    
    # Ensure deadline is converted to UTC for storage
    if obj_in.deadline.tzinfo is None:
        # If no timezone info, assume project default timezone
        db_obj.deadline = tz.to_utc(obj_in.deadline)
    else:
        db_obj.deadline = obj_in.deadline.astimezone(pytz.UTC)
    
    db_obj.portfolio_id = obj_in.portfolio_id
    db_obj.parent_task_id = obj_in.parent_task_id
    db_obj.source_meeting_id = obj_in.source_meeting_id
    db_obj.created_at = tz.now_utc()
    db_obj.updated_at = tz.now_utc()

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_task(db: Session, *, db_obj: Task, obj_in: dict | TaskUpdate) -> Task:
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
    return db_obj


def delete_task(db: Session, *, task_id: int) -> bool:
    """Delete task by ID"""
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if task:
        db.delete(task)
        db.commit()
        return True
    return False


def search_tasks(db: Session, *, search_term: str, portfolio_id: int | None = None) -> list[Task]:
    """Search tasks by title or description"""
    query = db.query(Task)
    
    if portfolio_id:
        query = query.filter(Task.portfolio_id == portfolio_id)
    
    search_filter = or_(
        Task.title.ilike(f"%{search_term}%"),
        Task.description.ilike(f"%{search_term}%")
    )
    
    return query.filter(search_filter).all()


def get_tomorrow_reminders(db: Session, portfolio_id: int | None = None) -> list[dict]:
    """Get tasks due tomorrow and not completed with portfolio and user info (project timezone)"""
    
    # Get current project timezone time
    now_local = tz.now_local()
    
    # Calculate tomorrow's date range (project timezone)
    tomorrow_start = (now_local + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
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
        Task.status.in_(['Not Started', 'In Progress'])
    )
    
    # Optional portfolio filter
    if portfolio_id:
        query = query.filter(Task.portfolio_id == portfolio_id)
    
    tasks = query.order_by(Task.priority.desc(), Task.deadline.asc()).all()
    
    # Build result with portfolio and user info
    result = []
    for task in tasks:
        # Get assigned users for this task
        assigned_users = db.query(User).join(TaskAssignment).filter(
            TaskAssignment.task_id == task.task_id
        ).all()
        
        # Build task data with portfolio and user info
        task_data = {
            'task_id': task.task_id,
            'title': task.title,
            'description': task.description,
            'deadline': task.deadline,
            'priority': task.priority,
            'status': task.status,
            'portfolio_id': task.portfolio_id,
            'portfolio_name': task.portfolio.name,
            'portfolio_channel': task.portfolio.channel_id,
            'assigned_users': [
                {
                    'user_id': user.user_id,
                    'username': user.username,
                    'discord_id': user.discord_id
                }
                for user in assigned_users
            ]
        }
        result.append(task_data)
    
    return result 