from typing import Optional

from pydantic import BaseModel, EmailStr


# Shared properties
class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None


# Used when creating a user
class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str
    role_id: int
    discord_id: str


# Used when updating a user
class UserUpdate(UserBase):
    password: Optional[str] = None


# User model in API response
class UserInDBBase(UserBase):
    user_id: int
    
    class Config:
        orm_mode = True


# User model in API response
class User(UserInDBBase):
    pass


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
    sub: Optional[int] = None


# User model in database
class UserInDB(UserInDBBase):
    hashed_password: str 