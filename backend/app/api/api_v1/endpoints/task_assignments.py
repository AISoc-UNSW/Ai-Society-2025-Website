from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import task_assignment
from app.models.user import User
from app.schemas.task_assignment import (
    TaskAssignmentCreateRequestBody,
    TaskAssignmentUpdate,
    TaskAssignmentResponse,
    TaskAssignmentDetailResponse,
    BulkTaskAssignmentCreate,
    UserTaskAssignmentResponse,
    TaskUserAssignmentResponse
)

router = APIRouter()


@router.post("/", response_model=TaskAssignmentResponse)
def create_task_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_in: TaskAssignmentCreateRequestBody,
    current_user: User = Depends(deps.get_current_user),
) -> TaskAssignmentResponse:
    """
    Create new task assignment
    """
    assignment = task_assignment.create_task_assignment(db, obj_in=assignment_in)
    return TaskAssignmentResponse(**assignment.__dict__)


@router.post("/bulk", response_model=List[TaskAssignmentResponse])
def create_bulk_task_assignments(
    *,
    db: Session = Depends(deps.get_db),
    bulk_assignment_in: BulkTaskAssignmentCreate,
    current_user: User = Depends(deps.get_current_user),
) -> List[TaskAssignmentResponse]:
    """
    Create multiple task assignments for a single task
    """
    assignments = task_assignment.create_bulk_task_assignments(
        db, task_id=bulk_assignment_in.task_id, user_ids=bulk_assignment_in.user_ids
    )
    return [TaskAssignmentResponse(**assignment.__dict__) for assignment in assignments]


@router.get("/{assignment_id}", response_model=TaskAssignmentDetailResponse)
def read_task_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> TaskAssignmentDetailResponse:
    """
    Get task assignment by ID with details
    """
    assignment = task_assignment.get_by_id(db, assignment_id=assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    return TaskAssignmentDetailResponse(**assignment.__dict__)


@router.get("/", response_model=List[TaskAssignmentResponse])
def read_task_assignments(
    db: Session = Depends(deps.get_db),
    task_id: Optional[int] = Query(None, description="Filter by task ID"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_user: User = Depends(deps.get_current_user),
) -> List[TaskAssignmentResponse]:
    """
    Get task assignments with optional filters
    """
    assignments = task_assignment.get_multi(
        db,
        task_id=task_id,
        user_id=user_id,
        skip=skip,
        limit=limit
    )
    return [TaskAssignmentResponse(**assignment.__dict__) for assignment in assignments]


@router.put("/{assignment_id}", response_model=TaskAssignmentResponse)
def update_task_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    assignment_in: TaskAssignmentUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> TaskAssignmentResponse:
    """
    Update task assignment
    """
    assignment = task_assignment.get_by_id(db, assignment_id=assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    assignment = task_assignment.update_task_assignment(db, db_obj=assignment, obj_in=assignment_in)
    return TaskAssignmentResponse(**assignment.__dict__)


@router.delete("/{assignment_id}")
def delete_task_assignment(
    *,
    db: Session = Depends(deps.get_db),
    assignment_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete task assignment
    """
    success = task_assignment.delete_task_assignment(db, assignment_id=assignment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    return {"message": "Task assignment deleted successfully"}


@router.delete("/task/{task_id}/user/{user_id}")
def delete_task_assignment_by_task_and_user(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete task assignment by task ID and user ID
    """
    success = task_assignment.delete_by_task_and_user(db, task_id=task_id, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task assignment not found")
    
    return {"message": "Task assignment deleted successfully"}


@router.get("/task/{task_id}/users", response_model=List[TaskUserAssignmentResponse])
def read_task_assigned_users(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> List[TaskUserAssignmentResponse]:
    """
    Get users assigned to a specific task with details
    """
    user_details = task_assignment.get_task_user_details(db, task_id=task_id)
    return [TaskUserAssignmentResponse(**user_detail) for user_detail in user_details]


@router.get("/user/{user_id}/tasks", response_model=List[UserTaskAssignmentResponse])
def read_user_assigned_tasks(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_user),
) -> List[UserTaskAssignmentResponse]:
    """
    Get tasks assigned to a specific user with details
    """
    task_details = task_assignment.get_user_task_details(db, user_id=user_id, skip=skip, limit=limit)
    return [UserTaskAssignmentResponse(**task_detail) for task_detail in task_details]


@router.get("/user/me/tasks", response_model=List[UserTaskAssignmentResponse])
def read_my_assigned_tasks(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_user),
) -> List[UserTaskAssignmentResponse]:
    """
    Get tasks assigned to current user with details
    """
    task_details = task_assignment.get_user_task_details(db, user_id=current_user.user_id, skip=skip, limit=limit)
    return [UserTaskAssignmentResponse(**task_detail) for task_detail in task_details]


@router.delete("/task/{task_id}/all")
def delete_all_task_assignments(
    *,
    db: Session = Depends(deps.get_db),
    task_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete all assignments for a specific task
    """
    count = task_assignment.delete_all_task_assignments(db, task_id=task_id)
    return {"message": f"Deleted {count} task assignments"}


@router.delete("/user/{user_id}/all")
def delete_all_user_assignments(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete all assignments for a specific user
    """
    count = task_assignment.delete_all_user_assignments(db, user_id=user_id)
    return {"message": f"Deleted {count} user assignments"} 