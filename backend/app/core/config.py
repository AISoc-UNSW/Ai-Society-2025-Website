import secrets

from pydantic import ValidationInfo, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    API_V1_USERS_STR: str = "/api/v1/users"
    API_V1_DISCORD_AUTH_STR: str = "/api/v1/auth/discord"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # The expiration time of the access token, 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    # Allow cross-domain requests from the following domain list
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000"
    # Frontend URL for redirects
    FRONTEND_URL: str = "http://localhost:3000"

    PROJECT_NAME: str = "AI Society Dashboard"

    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "ai_society_dashboard_db"
    POSTGRES_PORT: str = "5432"  # default port
    DATABASE_URL: str | None = None  # add optional full connection string

    DISCORD_CLIENT_ID: str = ""
    DISCORD_CLIENT_SECRET: str = ""
    DISCORD_REDIRECT_URI: str = ""
    DISCORD_API_URL: str = "https://discord.com/api"

    @field_validator("DATABASE_URL", mode="before")
    def assemble_db_connection(cls, v: str | None, info: ValidationInfo) -> str | None:
        if isinstance(v, str):
            return v

        data = info.data
        # Use DATABASE_URL if provided
        if data.get("DATABASE_URL"):
            return data.get("DATABASE_URL")

        # Otherwise, build the connection string
        return f"postgresql://{data.get('POSTGRES_USER')}:{data.get('POSTGRES_PASSWORD')}@{data.get('POSTGRES_SERVER')}:{data.get('POSTGRES_PORT')}/{data.get('POSTGRES_DB')}"

    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
