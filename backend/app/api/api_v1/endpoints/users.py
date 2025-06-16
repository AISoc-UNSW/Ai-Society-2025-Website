from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import user
from app.models.user import User
from app.schemas.user import UserCreateRequestBody, UserCreateResponse, UserListResponse

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


@router.get("/me", response_model=UserCreateResponse)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> UserCreateResponse:
    """
    Get current user
    """
    user_record = user.get_by_id(db, id=current_user.user_id)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    if user_record.discord_id:
        user_response = UserCreateResponse(
            user_id=user_record.user_id,
            email=user_record.email,
            username=user_record.username,
            role_id=user_record.role_id,
            discord_id=user_record.discord_id,
        )
    else:
        user_response = UserCreateResponse(
            user_id=user_record.user_id,
            email=user_record.email,
            username=user_record.username,
            role_id=user_record.role_id,
        )
    return user_response


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
    limit: int = Query(10, ge=1, le=50, description="Limit number of results"),
    current_user: User = Depends(deps.get_current_user),
) -> list[UserListResponse]:
    """
    Search users by username or email with fuzzy matching
    """
    users = user.search_users(db, search_term=q, limit=limit)
    return [UserListResponse(**user_record.__dict__) for user_record in users]
