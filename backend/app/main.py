from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.api_v1.endpoints.discord import router as discord_router
from app.api.api_v1.endpoints.login import router as login_router
from app.api.api_v1.endpoints.users import router as user_router
from app.api.api_v1.endpoints.tasks import router as tasks_router
from app.api.api_v1.endpoints.meeting_records import router as meeting_records_router
from app.api.api_v1.endpoints.task_assignments import router as task_assignments_router
from app.api.api_v1.endpoints.roles import router as roles_router
from app.api.api_v1.endpoints.portfolios import router as portfolios_router
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

# Authentication and user management
app.include_router(login_router, prefix=settings.API_V1_STR, tags=["Login"])
app.include_router(user_router, prefix=settings.API_V1_USERS_STR, tags=["Users"])
app.include_router(discord_router, prefix=settings.API_V1_DISCORD_AUTH_STR, tags=["Discord"])

# Core functionality
app.include_router(roles_router, prefix=f"{settings.API_V1_STR}/roles", tags=["Roles"])
app.include_router(portfolios_router, prefix=f"{settings.API_V1_STR}/portfolios", tags=["Portfolios"])
app.include_router(tasks_router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(meeting_records_router, prefix=f"{settings.API_V1_STR}/meeting-records", tags=["Meeting Records"])
app.include_router(task_assignments_router, prefix=f"{settings.API_V1_STR}/task-assignments", tags=["Task Assignments"])


@app.get("/")
def root():
    return {"message": "Welcome to AI Society Dashboard API"}
