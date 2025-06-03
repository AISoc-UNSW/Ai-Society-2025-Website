from pydantic import BaseModel
from typing import Optional


# Shared properties
class RoleBase(BaseModel):
    role_name: str
    description: Optional[str] = None


# Used when creating a role
class RoleCreateRequestBody(RoleBase):
    role_name: str


# Used when updating a role
class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    description: Optional[str] = None


# Used for API responses
class RoleResponse(RoleBase):
    role_id: int
    
    class Config:
        from_attributes = True


# Used for listing roles (same as response for simple table)
class RoleListResponse(RoleResponse):
    pass


# Used for role detail with user count
class RoleDetailResponse(RoleResponse):
    user_count: Optional[int] = None  # Count of users with this role
    
    class Config:
        from_attributes = True 