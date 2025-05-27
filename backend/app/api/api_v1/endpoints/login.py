from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.crud import user
from app.schemas.user import Token

router = APIRouter()


@router.post("/login/access-token", response_model=Token)
def login_access_token(
    db: Session = Depends(deps.get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Token:
    """
    username should be email of user
    OAuth2 compatible token login, get an access token for future requests
    """
    user_record = user.authenticate(db, email=form_data.username, password=form_data.password)
    if not user_record:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            user_record.user_id, expires_delta=access_token_expires
        ),
        token_type="bearer",
    )
