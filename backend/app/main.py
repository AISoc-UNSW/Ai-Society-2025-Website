from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.api import api_router
from app.core.config import settings
from app import models
from fastapi import HTTPException, Request, Body
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
import os
import httpx
from fastapi.responses import JSONResponse
from app.db import get_user, create_user
from app.config import DISCORD_API_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS middleware to allow frontend access to API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to AI Society Dashboard API"} 

# app.include_router(auth_router)
@app.get("/auth/discord")
async def discord_login():
    # Construct Discord Authorization URL
    # print("Redirect URI:", os.getenv("DISCORD_REDIRECT_URI"))
    params = {
        "response_type": "code",
        "client_id": DISCORD_CLIENT_ID,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "scope": "identify",  # Get basic identity information
    }
    url = f"{DISCORD_API_URL}/oauth2/authorize?{urlencode(params)}"
    
    return RedirectResponse(url)

@app.get("/auth/discord/callback")
async def discord_callback(request: Request, code: str = None):
    
    if code is None:
        raise HTTPException(status_code=400, detail="没有提供 OAuth code")
    
   # Use code to exchange access token
    data = {
        "client_id": DISCORD_CLIENT_ID,
        "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": DISCORD_REDIRECT_URI,
        "scope": "identify"
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    async with httpx.AsyncClient() as client:
        token_response = await client.post(f"{DISCORD_API_URL}/oauth2/token", data=data, headers=headers)
        if token_response.status_code != 200:
            error_detail = token_response.json()
            raise HTTPException(status_code=token_response.status_code, detail=f"OAuth token failed to obtain: {error_detail}")
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token was obtained")
        
        # Use access token to obtain user information
        user_response = await client.get(f"{DISCORD_API_URL}/users/@me", headers={"Authorization": f"Bearer {access_token}"})
        if user_response.status_code != 200:
            raise HTTPException(status_code=user_response.status_code, detail="Failed to obtain user information")
        user_data = user_response.json()
    
    # Extract discord_id and username
    discord_id = user_data.get("id")
    username = user_data.get("username")
    #Here you can add new user registration logic: determine whether it is the first login, boot to set the password and save it to the database
    user = get_user(discord_id)
    if user:
        # If it exists, log in directly
        return JSONResponse(content={
            "message": "The user already exists, login is successful",
            "discord_id": discord_id,
            "username": username,
            "db_user": user
        })
    else:
        # If it does not exist, the user is prompted to set a password (here you can also directly return a front-end jump or status flag)
        return JSONResponse(content={
            "message": "New users, please set your password to complete registration",
            "discord_id": discord_id,
            "username": username
        })


@app.post("/auth/discord/register")
async def discord_register(
    discord_id: str = Body(...),
    username: str = Body(...),
    password: str = Body(...)
):
    """
    New user registration interface for processing password setting requests submitted by the front-end
    """
    # Check if the user already exists in the database (prevent repeated registrations)
    if get_user(discord_id):
        raise HTTPException(status_code=400, detail="The user already exists")

    # 尝试创建用户Try to create a user
    new_user = create_user(discord_id, username, password)
    if not new_user:
        raise HTTPException(status_code=400, detail="Registration failed, please check whether the password meets the requirements")
    
    return JSONResponse(content={
        "message": "Registered successfully",
        "user": new_user
    })