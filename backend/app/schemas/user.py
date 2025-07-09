from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: EmailStr
    username: str


# Used when creating a user
class UserCreateRequestBody(UserBase):
    email: EmailStr
    username: str
    password: str


class DiscordUserCreateRequestBody(UserBase):
    discord_id: str


class UserCreateResponse(UserBase):
    user_id: int
    email: EmailStr
    username: str
    role_id: int
    discord_id: str | None = None


class UserListResponse(BaseModel):
    """Used for listing users with basic info"""
    user_id: int
    email: EmailStr
    username: str
    role_id: int
    portfolio_id: int | None = None
    discord_id: str | None = None
    
    class Config:
        from_attributes = True


# Used when updating a user
class UserUpdate(UserBase):
    password: str | None = None


class UserAdminUpdate(BaseModel):
    """Used by admin to update user's role and portfolio"""
    role_id: int | None = None
    portfolio_id: int | None = None


# Used when logging in
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# Token response
class Token(BaseModel):
    access_token: str
    token_type: str


# Token content
class TokenPayload(BaseModel):
    # 'sub' (subject) is a standard JWT claim that identifies the principal subject of the token
    # In this context, it typically contains the user's ID after authentication
    # This field can be an integer (user_id) or None if not authenticated
    sub: int | None = None


class DiscordUser(BaseModel):
    """Discord User structure as returned by Discord API"""

    id: str
    username: str
    discriminator: str
    global_name: str | None = None
    avatar: str | None = None
    bot: bool | None = None
    system: bool | None = None
    mfa_enabled: bool | None = None
    banner: str | None = None
    accent_color: int | None = None
    locale: str | None = None
    verified: bool | None = None
    email: str | None = None
    flags: int | None = None
    premium_type: int | None = None
    public_flags: int | None = None
    avatar_decoration_data: dict | None = None
