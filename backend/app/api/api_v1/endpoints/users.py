from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import user
from app.models.user import User
from app.schemas.user import UserCreateRequestBody, UserCreateResponse

router = APIRouter()


@router.post("/", response_model=UserCreateResponse)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreateRequestBody,
) -> UserCreateResponse:
    """
    Create new user.
    """
    # Check if email already exists
    user_record = user.get_by_email(db, email=user_in.email)
    if user_record:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    # Check if discord_id already exists (if provided)
    if user_in.discord_id:
        user_record = user.get_by_discord_id(db, discord_id=user_in.discord_id)
        if user_record:
            raise HTTPException(
                status_code=400,
                detail="The user with this Discord ID already exists in the system.",
            )

    user_record = user.create(db, obj_in=user_in)
    user_response = UserCreateResponse(
        user_id=user_record.user_id,
        email=user_record.email,
        username=user_record.username,
        role_id=user_record.role_id,
        discord_id=user_record.discord_id,
    )
    return user_response


@router.get("/me", response_model=UserCreateResponse)
def read_user_me(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> UserCreateResponse:
    """
    Get current user.
    """
    user_record = user.get_by_id(db, id=current_user.user_id)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    user_response = UserCreateResponse(
        user_id=user_record.user_id,
        email=user_record.email,
        username=user_record.username,
        role_id=user_record.role_id,
        discord_id=user_record.discord_id,
    )
    return user_response
