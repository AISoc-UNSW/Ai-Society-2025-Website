from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: EmailStr | None = None
    username: str | None = None


# Used when creating a user
class UserCreateRequestBody(UserBase):
    email: EmailStr
    username: str
    password: str
    role_id: int
    discord_id: str | None = None


class UserCreateResponse(UserBase):
    user_id: int
    email: EmailStr
    username: str
    role_id: int
    discord_id: str | None = None


# Used when updating a user
class UserUpdate(UserBase):
    password: str | None = None


# Used when logging in
class UserLogin(BaseModel):
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
