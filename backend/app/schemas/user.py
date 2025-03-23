from typing import Optional

from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False


# Used when creating a user
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str


# Used when updating a user
class UserUpdate(UserBase):
    password: Optional[str] = None


# User model in API response
class User(UserBase):
    id: Optional[int] = None

    class Config:
        from_attributes = True


# Used when logging in
class UserLogin(BaseModel):
    email: str
    password: str


# Token response
class Token(BaseModel):
    access_token: str
    token_type: str


# Token content
class TokenPayload(BaseModel):
    sub: Optional[int] = None 