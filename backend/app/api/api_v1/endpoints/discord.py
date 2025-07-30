from datetime import timedelta
from urllib.parse import urlencode

import requests
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
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
        # Redirect to frontend with error instead of raising HTTP exception
        frontend_url = "http://localhost:3000"
        error_url = f"{frontend_url}/auth/login?error=no_oauth_code"
        return RedirectResponse(url=error_url)

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

        # Redirect to frontend with error
        frontend_url = "http://localhost:3000"
        error_url = f"{frontend_url}/auth/login?error=oauth_token_failed&details={token_response.status_code}"
        return RedirectResponse(url=error_url)

    token_data = token_response.json()
    access_token = token_data.get("access_token")
    if not access_token:
        # Redirect to frontend with error
        frontend_url = "http://localhost:3000"
        error_url = f"{frontend_url}/auth/login?error=no_access_token"
        return RedirectResponse(url=error_url)

    # Use access token to obtain user information
    user_response = requests.get(
        f"{settings.DISCORD_API_URL}/users/@me", headers={"Authorization": f"Bearer {access_token}"}
    )
    if user_response.status_code != 200:
        # Redirect to frontend with error
        frontend_url = "http://localhost:3000"
        error_url = f"{frontend_url}/auth/login?error=failed_to_get_user_info"
        return RedirectResponse(url=error_url)

    user_data = user_response.json()

    # Validate Discord user data using the Pydantic model
    try:
        discord_user = DiscordUser(**user_data)

        # Extract discord_id and username from validated model
        discord_id = discord_user.id
        username = discord_user.username
        email = discord_user.email
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = "http://localhost:3000"
        error_url = f"{frontend_url}/auth/login?error=invalid_discord_user_data"
        return RedirectResponse(url=error_url)

    # Check if user exists by discord_id
    user_record = user.get_by_discord_id(db, discord_id=discord_id)
    if user_record:
        # If user exists, generate JWT token and redirect to frontend
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            user_record.user_id, expires_delta=access_token_expires
        )

        # Redirect to frontend callback page with token
        frontend_url = "http://localhost:3000"  # This should be configurable
        callback_url = (
            f"{frontend_url}/auth/discord/callback?token={access_token}&token_type=bearer"
        )
        return RedirectResponse(url=callback_url)
    else:
        # If user doesn't exist, create new user and generate token
        try:
            # Create user object for Discord registration
            user_in = DiscordUserCreateRequestBody(
                email=email,
                username=username,
                discord_id=discord_id,
            )

            # Create user in database
            user_record = user.create_discord_user(db, obj_in=user_in)
            if not user_record:
                # Redirect to frontend with error
                frontend_url = "http://localhost:3000"
                error_url = f"{frontend_url}/auth/login?error=registration_failed"
                return RedirectResponse(url=error_url)

            # Generate JWT token for new user
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = security.create_access_token(
                user_record.user_id, expires_delta=access_token_expires
            )

            # Redirect to frontend callback page with token
            frontend_url = "http://localhost:3000"
            callback_url = (
                f"{frontend_url}/auth/discord/callback?token={access_token}&token_type=bearer"
            )
            return RedirectResponse(url=callback_url)

        except Exception as e:
            # Handle registration errors
            frontend_url = "http://localhost:3000"
            error_url = f"{frontend_url}/auth/login?error=discord_registration_failed"
            return RedirectResponse(url=error_url)


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
