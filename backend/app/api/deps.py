from collections.abc import Generator

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud import user
from app.database.session import SessionLocal
from app.models.user import User
from app.schemas.user import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/login/access-token")


def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # Try to get token from httpOnly cookie first
    token = request.cookies.get("session_token")

    # If no cookie, try Authorization header (for backwards compatibility)
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authentication token found",
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    if token_data.sub is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token payload",
        )
    user_record = user.get_by_id(db, id=token_data.sub)
    if not user_record:
        raise HTTPException(status_code=404, detail="User not found")
    return user_record


def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role_id != 2:
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return current_user


def get_current_director(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role_id != 3:
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return current_user
