from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import user
from app.models.user import User
from app.schemas.user import UserCreateRequestBody, UserCreateResponse, UserListResponse, UserAdminUpdate, UserSelfUpdate

router = APIRouter()


@router.post("/", response_model=UserCreateResponse)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreateRequestBody,
) -> UserCreateResponse:
    """
    Create new user
    """
    # Check if email already exists
    user_record = user.get_by_email(db, email=user_in.email)
    if user_record:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    user_record = user.create_user(db, obj_in=user_in)
    user_response = UserCreateResponse(
        user_id=user_record.user_id,
        email=user_record.email,
        username=user_record.username,
        role_id=1,
    )
    return user_response


@router.get("/me", response_model=UserListResponse)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> UserListResponse:
    """
    Get current user
    """
    user_record = user.get_by_id(db, id=current_user.user_id)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    if user_record.discord_id:
        user_response = UserListResponse(
            user_id=user_record.user_id,
            email=user_record.email,
            username=user_record.username,
            role_id=user_record.role_id,
            discord_id=user_record.discord_id,
            portfolio_id=user_record.portfolio_id,
        )
    else:
        user_response = UserListResponse(
            user_id=user_record.user_id,
            email=user_record.email,
            username=user_record.username,
            role_id=user_record.role_id,
            portfolio_id=user_record.portfolio_id,
        )
    return user_response


@router.put("/me", response_model=UserListResponse)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserSelfUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> UserListResponse:
    """
    Update current user's information
    
    Business rule: portfolio_id can only be modified once.
    If the user already has a portfolio_id set, it cannot be changed.
    """
    user_record = user.update_user_self(db, db_obj=current_user, obj_in=user_in)
    return UserListResponse(
        user_id=user_record.user_id,
        email=user_record.email,
        username=user_record.username,
        role_id=user_record.role_id,
        discord_id=user_record.discord_id,
        portfolio_id=user_record.portfolio_id,
    )


@router.get("/portfolio/{portfolio_id}", response_model=list[UserListResponse])
def get_users_by_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> list[UserListResponse]:
    """
    Get all users belonging to a specific portfolio
    """
    users = user.get_users_by_portfolio(db, portfolio_id=portfolio_id)
    return [UserListResponse(**user_record.__dict__) for user_record in users]


@router.get("/search", response_model=list[UserListResponse])
def search_users(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, description="Search term for username or email"),
    limit: int = Query(10, ge=1, le=100, description="Limit number of results"),
    current_user: User = Depends(deps.get_current_user),
) -> list[UserListResponse]:
    """
    Search users by username or email with fuzzy matching
    """
    users = user.search_users(db, search_term=q, limit=limit)
    return [UserListResponse(**user_record.__dict__) for user_record in users]


@router.get("/", response_model=list[UserListResponse])
def get_all_users(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_admin: User = Depends(deps.get_current_admin),
) -> list[UserListResponse]:
    """
    Get all users (Admin only)
    """
    users = user.get_all_users(db, skip=skip, limit=limit)
    return [UserListResponse(**user_record.__dict__) for user_record in users]


@router.put("/{user_id}", response_model=UserListResponse)
def update_user_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: UserAdminUpdate,
    current_admin: User = Depends(deps.get_current_admin),
) -> UserListResponse:
    """
    Update user's role and portfolio (Admin only)
    """
    user_record = user.get_by_id(db, id=user_id)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_record = user.update_user(db, db_obj=user_record, obj_in=user_in)
    return UserListResponse(**user_record.__dict__)
