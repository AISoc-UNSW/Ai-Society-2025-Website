from pydantic import BaseModel


# Shared properties
class PortfolioBase(BaseModel):
    name: str
    description: str | None = None
    channel_id: str | None = None


# Used when creating a portfolio
class PortfolioCreateRequestBody(PortfolioBase):
    name: str


# Used when updating a portfolio
class PortfolioUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    channel_id: str | None = None


# Used for API responses
class PortfolioResponse(PortfolioBase):
    portfolio_id: int
    
    class Config:
        from_attributes = True


# Used for listing portfolios (minimal info)
class PortfolioListResponse(BaseModel):
    portfolio_id: int
    name: str
    description: str | None = None
    has_channel: bool = False  # Computed field
    
    class Config:
        from_attributes = True


# Used for portfolio detail with statistics
class PortfolioDetailResponse(PortfolioResponse):
    # Statistics
    user_count: int | None = None
    task_count: int | None = None
    meeting_count: int | None = None
    active_task_count: int | None = None  # Tasks not completed
    
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