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
    DiscordUserRegisterRequestBody,
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
        # If user exists, redirect to dashboard with user info in query params
        params = {
            "login": "success",
            "user_id": str(user_record.user_id),
            "username": user_record.username,
            "discord_id": str(user_record.discord_id),
        }
        tasks_url = f"{settings.FRONTEND_URL}/tasks?{urlencode(params)}"
        
        # Create redirect response and optionally set cookies for authentication
        response = RedirectResponse(url=tasks_url)
        # Optional: Set authentication cookies here if needed
        # response.set_cookie(key="user_id", value=str(user_record.user_id), httponly=True)
        # response.set_cookie(key="discord_id", value=str(user_record.discord_id), httponly=True)
        
        return response
    else:
        # If new user, redirect to registration page with Discord info in query params
        register_params = {
            "discord_id": str(discord_id),
            "username": username,
            "email": email or "",  # Handle case where email might be None
            "global_name": discord_user.global_name or "",  # Handle case where global_name might be None
        }
        register_url = f"{settings.FRONTEND_URL}/register?{urlencode(register_params)}"
        
        return RedirectResponse(url=register_url)


@router.post("/register", response_model=UserCreateResponse)
async def discord_register(
    db: Session = Depends(deps.get_db),
    discord_user_in: DiscordUserRegisterRequestBody = Body(...),
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

    # Try to create user with password
    user_record = user.create_discord_user_with_password(db, obj_in=discord_user_in)
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
