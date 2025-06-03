from pydantic import BaseModel
from typing import Optional


# Shared properties
class PortfolioBase(BaseModel):
    name: str
    description: Optional[str] = None
    channel_id: Optional[str] = None


# Used when creating a portfolio
class PortfolioCreateRequestBody(PortfolioBase):
    name: str


# Used when updating a portfolio
class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    channel_id: Optional[str] = None


# Used for API responses
class PortfolioResponse(PortfolioBase):
    portfolio_id: int
    
    class Config:
        from_attributes = True


# Used for listing portfolios (minimal info)
class PortfolioListResponse(BaseModel):
    portfolio_id: int
    name: str
    description: Optional[str] = None
    has_channel: bool = False  # Computed field
    
    class Config:
        from_attributes = True


# Used for portfolio detail with statistics
class PortfolioDetailResponse(PortfolioResponse):
    # Statistics
    user_count: Optional[int] = None
    task_count: Optional[int] = None
    meeting_count: Optional[int] = None
    active_task_count: Optional[int] = None  # Tasks not completed
    
    class Config:
        from_attributes = True


# Used for portfolio summary statistics
class PortfolioStatsResponse(BaseModel):
    portfolio_id: int
    name: str
    user_count: int
    task_count: int
    meeting_count: int
    active_task_count: int
    completed_task_count: int
    
    class Config:
        from_attributes = True 