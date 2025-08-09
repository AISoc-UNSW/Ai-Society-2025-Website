from typing import Any

from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.task import Task
from app.models.task_assignment import TaskAssignment
from app.models.user import User
from app.schemas.task_assignment import (
    TaskAssignmentCreateRequestBody,
    TaskAssignmentUpdate,
)


def get_by_id(db: Session, assignment_id: int) -> TaskAssignment | None:
    """Get task assignment by ID"""
    return db.query(TaskAssignment).filter(TaskAssignment.assignment_id == assignment_id).first()


def get_by_task_and_user(db: Session, task_id: int, user_id: int) -> TaskAssignment | None:
    """Get task assignment by task ID and user ID"""
    return (
        db.query(TaskAssignment)
        .filter(and_(TaskAssignment.task_id == task_id, TaskAssignment.user_id == user_id))
        .first()
    )


def get_by_task(db: Session, task_id: int) -> list[TaskAssignment]:
    """Get all assignments for a specific task"""
    return db.query(TaskAssignment).filter(TaskAssignment.task_id == task_id).all()


def get_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> list[TaskAssignment]:
    """Get all assignments for a specific user"""
    return (
        db.query(TaskAssignment)
        .filter(TaskAssignment.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_by_task_with_users(db: Session, task_id: int) -> list[TaskAssignment]:
    """Get task assignments with user details"""
    return (
        db.query(TaskAssignment)
        .options(joinedload(TaskAssignment.user))
        .filter(TaskAssignment.task_id == task_id)
        .all()
    )


def get_by_user_with_tasks(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> list[TaskAssignment]:
    """Get user assignments with task details"""
    return (
        db.query(TaskAssignment)
        .options(joinedload(TaskAssignment.task))
        .filter(TaskAssignment.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_multi(
    db: Session,
    *,
    task_id: int | None = None,
    user_id: int | None = None,
    skip: int = 0,
    limit: int = 100
) -> list[TaskAssignment]:
    """Get multiple task assignments with optional filters"""
    query = db.query(TaskAssignment)

    if task_id:
        query = query.filter(TaskAssignment.task_id == task_id)
    if user_id:
        query = query.filter(TaskAssignment.user_id == user_id)

    return query.offset(skip).limit(limit).all()


def create_task_assignment(
    db: Session, *, obj_in: TaskAssignmentCreateRequestBody
) -> TaskAssignment:
    """Create new task assignment"""
    # Check if assignment already exists
    existing = get_by_task_and_user(db, task_id=obj_in.task_id, user_id=obj_in.user_id)
    if existing:
        return existing  # Return existing assignment instead of creating duplicate

    db_obj = TaskAssignment()
    db_obj.task_id = obj_in.task_id
    db_obj.user_id = obj_in.user_id

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def create_bulk_task_assignments(
    db: Session, *, task_id: int, user_ids: list[int]
) -> list[TaskAssignment]:
    """Create multiple task assignments for a single task"""
    assignments = []

    for user_id in user_ids:
        # Check if assignment already exists
        existing = get_by_task_and_user(db, task_id=task_id, user_id=user_id)
        if existing:
            assignments.append(existing)
            continue

        db_obj = TaskAssignment()
        db_obj.task_id = task_id
        db_obj.user_id = user_id
        db.add(db_obj)
        assignments.append(db_obj)

    db.commit()

    # Refresh all new objects
    for assignment in assignments:
        if assignment.assignment_id is None:  # Only refresh new objects
            db.refresh(assignment)

    return assignments


def update_task_assignment(
    db: Session, *, db_obj: TaskAssignment, obj_in: TaskAssignmentUpdate | dict[str, Any]
) -> TaskAssignment:
    """Update existing task assignment"""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)

    for field in update_data:
        setattr(db_obj, field, update_data[field])

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_task_assignment(db: Session, *, assignment_id: int) -> bool:
    """Delete task assignment by ID"""
    assignment = (
        db.query(TaskAssignment).filter(TaskAssignment.assignment_id == assignment_id).first()
    )
    if assignment:
        db.delete(assignment)
        db.commit()
        return True
    return False


def delete_by_task_and_user(db: Session, *, task_id: int, user_id: int) -> bool:
    """Delete task assignment by task ID and user ID"""
    assignment = get_by_task_and_user(db, task_id=task_id, user_id=user_id)
    if assignment:
        db.delete(assignment)
        db.commit()
        return True
    return False


def delete_all_task_assignments(db: Session, *, task_id: int) -> int:
    """Delete all assignments for a specific task, return count of deleted assignments"""
    assignments = get_by_task(db, task_id=task_id)
    count = len(assignments)

    for assignment in assignments:
        db.delete(assignment)

    db.commit()
    return count


def delete_all_user_assignments(db: Session, *, user_id: int) -> int:
    """Delete all assignments for a specific user, return count of deleted assignments"""
    assignments = get_by_user(db, user_id=user_id)
    count = len(assignments)

    for assignment in assignments:
        db.delete(assignment)

    db.commit()
    return count


def get_user_assigned_tasks(
    db: Session, user_id: int, skip: int = 0, limit: int = 100
) -> list[dict]:
    """Get user's assigned tasks in TaskListResponse format"""
    # Join TaskAssignment to Task and preload related data
    query = (
        db.query(Task)
        .join(TaskAssignment, Task.task_id == TaskAssignment.task_id)
        .options(
            joinedload(Task.portfolio),
            joinedload(Task.created_by_user),
            selectinload(Task.task_assignments).joinedload(
                TaskAssignment.user
            ),  # 预加载所有assignees
            selectinload(Task.subtasks).options(
                joinedload(Task.portfolio),
                joinedload(Task.created_by_user),
                selectinload(Task.task_assignments).joinedload(
                    TaskAssignment.user
                ),  # subtasks的assignees
            ),
        )
        .filter(TaskAssignment.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )

    tasks = query.all()

    from app.crud.task import _build_task_list_response_data

    return [_build_task_list_response_data(task) for task in tasks]


def get_task_user_details(db: Session, task_id: int) -> list[dict[str, Any]]:
    """Get task's assigned users with user details"""
    query = db.query(TaskAssignment, User).join(User).filter(TaskAssignment.task_id == task_id)
    results = query.all()

    user_details = []
    for assignment, user in results:
        user_details.append(
            {
                "assignment_id": assignment.assignment_id,
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
            }
        )

    return user_details


def update_task_users(db: Session, *, task_id: int, user_ids: list[int]) -> list[dict[str, Any]]:
    """
    Update users assigned to a specific task
    Replace all existing assignments with new ones
    """
    # First, delete all existing assignments for this task
    existing_assignments = get_by_task(db, task_id=task_id)
    for assignment in existing_assignments:
        db.delete(assignment)

    # Create new assignments
    new_assignments = []
    for user_id in user_ids:
        db_obj = TaskAssignment()
        db_obj.task_id = task_id
        db_obj.user_id = user_id
        db.add(db_obj)
        new_assignments.append(db_obj)

    # Commit all changes
    db.commit()

    # Refresh all new objects
    for assignment in new_assignments:
        db.refresh(assignment)

    # Return user details for the new assignments
    return get_task_user_details(db, task_id=task_id)


def update_task_users_smart(
    db: Session, *, task_id: int, user_ids: list[int]
) -> list[dict[str, Any]]:
    """
    Smart update: only add/remove users that have changed
    """
    # Get current assignments
    current_assignments = get_by_task(db, task_id=task_id)
    current_user_ids = {assignment.user_id for assignment in current_assignments}
    new_user_ids = set(user_ids)

    # Remove users no longer assigned
    users_to_remove = current_user_ids - new_user_ids
    for assignment in current_assignments:
        if assignment.user_id in users_to_remove:
            db.delete(assignment)

    # Add new users
    users_to_add = new_user_ids - current_user_ids
    for user_id in users_to_add:
        db_obj = TaskAssignment()
        db_obj.task_id = task_id
        db_obj.user_id = user_id
        db.add(db_obj)

    db.commit()
    return get_task_user_details(db, task_id=task_id)
