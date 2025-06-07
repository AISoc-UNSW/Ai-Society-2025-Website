from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import role
from app.models.user import User
from app.schemas.role import (
    RoleCreateRequestBody,
    RoleUpdate,
    RoleResponse,
    RoleListResponse,
    RoleDetailResponse,
)

router = APIRouter()


@router.post("/", response_model=RoleResponse)
def create_role(
    *,
    db: Session = Depends(deps.get_db),
    role_in: RoleCreateRequestBody,
    current_user: User = Depends(deps.get_current_admin),  # Only admin can create roles
) -> RoleResponse:
    """
    Create new role (Admin only)
    """
    try:
        role_record = role.create_role(db, obj_in=role_in)
        return RoleResponse(**role_record.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{role_id}", response_model=RoleDetailResponse)
def read_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> RoleDetailResponse:
    """
    Get role by ID with details
    """
    role_record = role.get_by_id(db, role_id=role_id)
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")

    # Get user count for this role
    user_count = role.get_user_count(db, role_id=role_id)

    role_data = RoleDetailResponse(**role_record.__dict__)
    role_data.user_count = user_count
    return role_data


@router.get("/", response_model=list[RoleListResponse])
def read_roles(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_user: User = Depends(deps.get_current_user),
) -> list[RoleListResponse]:
    """
    Get roles list
    """
    roles = role.get_multi(db, skip=skip, limit=limit)
    return [RoleListResponse(**role_record.__dict__) for role_record in roles]


@router.get("/all/simple", response_model=list[RoleListResponse])
def read_all_roles_simple(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[RoleListResponse]:
    """
    Get all roles (for dropdown lists, no pagination)
    """
    roles = role.get_all(db)
    return [RoleListResponse(**role_record.__dict__) for role_record in roles]


@router.get("/with-counts/", response_model=list[RoleDetailResponse])
def read_roles_with_user_counts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> list[RoleDetailResponse]:
    """
    Get all roles with user counts
    """
    role_details = role.get_roles_with_user_counts(db)
    return [RoleDetailResponse(**role_detail) for role_detail in role_details]


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: int,
    role_in: RoleUpdate,
    current_user: User = Depends(deps.get_current_admin),  # Only admin can update roles
) -> RoleResponse:
    """
    Update role (Admin only)
    """
    role_record = role.get_by_id(db, role_id=role_id)
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")

    try:
        role_record = role.update_role(db, db_obj=role_record, obj_in=role_in)
        return RoleResponse(**role_record.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{role_id}")
def delete_role(
    *,
    db: Session = Depends(deps.get_db),
    role_id: int,
    current_user: User = Depends(deps.get_current_admin),  # Only admin can delete roles
):
    """
    Delete role (Admin only)
    """
    try:
        success = role.delete_role(db, role_id=role_id)
        if not success:
            raise HTTPException(status_code=404, detail="Role not found")

        return {"message": "Role deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/", response_model=list[RoleListResponse])
def search_roles(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, description="Search term"),
    current_user: User = Depends(deps.get_current_user),
) -> list[RoleListResponse]:
    """
    Search roles by name or description
    """
    roles = role.search_roles(db, search_term=q)
    return [RoleListResponse(**role_record.__dict__) for role_record in roles]


@router.get("/name/{role_name}", response_model=RoleDetailResponse)
def read_role_by_name(
    *,
    db: Session = Depends(deps.get_db),
    role_name: str,
    current_user: User = Depends(deps.get_current_user),
) -> RoleDetailResponse:
    """
    Get role by name with details
    """
    role_record = role.get_by_name(db, role_name=role_name)
    if not role_record:
        raise HTTPException(status_code=404, detail="Role not found")

    # Get user count for this role
    user_count = role.get_user_count(db, role_id=role_record.role_id)

    role_data = RoleDetailResponse(**role_record.__dict__)
    role_data.user_count = user_count
    return role_data
