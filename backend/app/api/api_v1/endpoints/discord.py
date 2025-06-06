from urllib.parse import urlencode

import requests
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.core.config import settings
from app.crud import user
from app.schemas.user import (
    DiscordUser,
    DiscordUserCreateRequestBody,
    UserCreateResponse,
)

router = APIRouter()


@router.get("/")
def discord_login():
    # Construct Discord Authorization URL
    params = {
        "response_type": "code",
        "client_id": settings.DISCORD_CLIENT_ID,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "scope": "identify email",  # Add email scope to get user's email
    }
    url = f"{settings.DISCORD_API_URL}/oauth2/authorize?{urlencode(params)}"

    return RedirectResponse(url)


@router.get("/callback")
def discord_callback(db: Session = Depends(deps.get_db), code: str | None = None):
    if code is None:
        raise HTTPException(status_code=400, detail="No OAuth code provided")

    # Use code to exchange access token
    data = {
        "client_id": settings.DISCORD_CLIENT_ID,
        "client_secret": settings.DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": settings.DISCORD_REDIRECT_URI,
        "scope": "identify email",
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    # Exchange code for token using synchronous requests
    token_response = requests.post(
        f"{settings.DISCORD_API_URL}/oauth2/token", data=data, headers=headers
    )
    if token_response.status_code != 200:
        error_detail = token_response.json()
        raise HTTPException(
            status_code=token_response.status_code,
            detail=f"OAuth token failed to obtain: {error_detail}",
        )
    token_data = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token was obtained")

    # Use access token to obtain user information
    user_response = requests.get(
        f"{settings.DISCORD_API_URL}/users/@me", headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_response.status_code != 200:
        raise HTTPException(
            status_code=user_response.status_code, detail="Failed to obtain user information"
        )
    user_data = user_response.json()

    # Validate Discord user data using the Pydantic model
    try:
        discord_user = DiscordUser(**user_data)

        # Extract discord_id and username from validated model
        discord_id = discord_user.id
        username = discord_user.username
        email = discord_user.email
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Invalid Discord user data: {str(e)}")

    # Check if user exists by discord_id
    user_record = user.get_by_discord_id(db, discord_id=discord_id)
    if user_record:
        # If it exists, log in directly
        return JSONResponse(
            content={
                "message": "The user already exists, login is successful",
                "discord_id": discord_id,
                "username": username,
                "user": {
                    "user_id": user_record.user_id,
                    "email": user_record.email,
                    "username": user_record.username,
                    "role_id": user_record.role_id,
                    "discord_id": user_record.discord_id,
                },
            }
        )
    else:
        # If it does not exist, the user is prompted to set a password
        return JSONResponse(
            content={
                "message": "New users, please set your password to complete registration",
                "discord_id": discord_id,
                "username": username,
                "email": email,
                "global_name": discord_user.global_name,
            }
        )


@router.post("/register", response_model=UserCreateResponse)
async def discord_register(
    db: Session = Depends(deps.get_db),
    discord_user_in: DiscordUserCreateRequestBody = Body(...),
):
    """
    New user registration interface for processing password setting requests submitted by the front-end
    """
    # Check if the user already exists in the database (prevent repeated registrations)
    if user.get_by_discord_id(db, discord_id=discord_user_in.discord_id):
        raise HTTPException(status_code=400, detail="The user with this Discord ID already exists")

    # Check if email already exists
    if user.get_by_email(db, email=discord_user_in.email):
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )

    # Create user object
    user_in = DiscordUserCreateRequestBody(
        email=discord_user_in.email,
        username=discord_user_in.username,
        discord_id=discord_user_in.discord_id,
    )

    # Try to create user
    user_record = user.create_discord_user(db, obj_in=user_in)
    if not user_record:
        raise HTTPException(
            status_code=400,
            detail="Registration failed, please check whether the password meets the requirements",
        )

    return UserCreateResponse(
        user_id=user_record.user_id,
        email=user_record.email,
        username=user_record.username,
        role_id=user_record.role_id,
        discord_id=user_record.discord_id,
    )
