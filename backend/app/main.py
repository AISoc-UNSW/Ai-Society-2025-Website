from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.endpoints.discord import router as discord_router
from app.api.api_v1.endpoints.login import router as login_router
from app.api.api_v1.endpoints.users import router as user_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",")]

# Set CORS middleware to allow frontend access to API
app.add_middleware(
    CORSMiddleware,
    # allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(login_router, prefix=settings.API_V1_STR, tags=["Login"])
app.include_router(user_router, prefix=settings.API_V1_USERS_STR, tags=["Users"])
app.include_router(discord_router, prefix=settings.API_V1_DISCORD_AUTH_STR, tags=["Discord"])


@app.get("/")
def root():
    return {"message": "Welcome to AI Society Dashboard API"}
