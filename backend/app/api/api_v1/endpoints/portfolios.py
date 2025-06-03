from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import portfolio
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioCreateRequestBody,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioListResponse,
    PortfolioDetailResponse,
    PortfolioStatsResponse
)

router = APIRouter()


@router.post("/", response_model=PortfolioResponse)
def create_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_in: PortfolioCreateRequestBody,
    current_user: User = Depends(deps.get_current_admin),  # Only admin can create portfolios
) -> PortfolioResponse:
    """
    Create new portfolio (Admin only)
    """
    try:
        portfolio_record = portfolio.create_portfolio(db, obj_in=portfolio_in)
        return PortfolioResponse(**portfolio_record.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{portfolio_id}", response_model=PortfolioDetailResponse)
def read_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> PortfolioDetailResponse:
    """
    Get portfolio by ID with details and statistics
    """
    portfolio_record = portfolio.get_by_id(db, portfolio_id=portfolio_id)
    if not portfolio_record:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get statistics for this portfolio
    user_count = portfolio.get_user_count(db, portfolio_id=portfolio_id)
    task_count = portfolio.get_task_count(db, portfolio_id=portfolio_id)
    meeting_count = portfolio.get_meeting_count(db, portfolio_id=portfolio_id)
    active_task_count = portfolio.get_active_task_count(db, portfolio_id=portfolio_id)
    
    portfolio_data = PortfolioDetailResponse(**portfolio_record.__dict__)
    portfolio_data.user_count = user_count
    portfolio_data.task_count = task_count
    portfolio_data.meeting_count = meeting_count
    portfolio_data.active_task_count = active_task_count
    return portfolio_data


@router.get("/", response_model=List[PortfolioListResponse])
def read_portfolios(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_user: User = Depends(deps.get_current_user),
) -> List[PortfolioListResponse]:
    """
    Get portfolios list
    """
    portfolios = portfolio.get_multi(db, skip=skip, limit=limit)
    
    result = []
    for portfolio_record in portfolios:
        portfolio_data = PortfolioListResponse(**portfolio_record.__dict__)
        portfolio_data.has_channel = bool(portfolio_record.channel_id)
        result.append(portfolio_data)
    
    return result


@router.get("/all/simple", response_model=List[PortfolioListResponse])
def read_all_portfolios_simple(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[PortfolioListResponse]:
    """
    Get all portfolios (for dropdown lists, no pagination)
    """
    portfolios = portfolio.get_all(db)
    
    result = []
    for portfolio_record in portfolios:
        portfolio_data = PortfolioListResponse(**portfolio_record.__dict__)
        portfolio_data.has_channel = bool(portfolio_record.channel_id)
        result.append(portfolio_data)
    
    return result


@router.get("/statistics/all", response_model=List[PortfolioStatsResponse])
def read_all_portfolio_statistics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[PortfolioStatsResponse]:
    """
    Get statistics for all portfolios
    """
    stats = portfolio.get_all_portfolio_statistics(db)
    return [PortfolioStatsResponse(**stat) for stat in stats]


@router.get("/{portfolio_id}/statistics", response_model=PortfolioStatsResponse)
def read_portfolio_statistics(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> PortfolioStatsResponse:
    """
    Get detailed statistics for a specific portfolio
    """
    stats = portfolio.get_portfolio_statistics(db, portfolio_id=portfolio_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    return PortfolioStatsResponse(**stats)


@router.put("/{portfolio_id}", response_model=PortfolioResponse)
def update_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    portfolio_in: PortfolioUpdate,
    current_user: User = Depends(deps.get_current_admin),  # Only admin can update portfolios
) -> PortfolioResponse:
    """
    Update portfolio (Admin only)
    """
    portfolio_record = portfolio.get_by_id(db, portfolio_id=portfolio_id)
    if not portfolio_record:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    try:
        portfolio_record = portfolio.update_portfolio(db, db_obj=portfolio_record, obj_in=portfolio_in)
        return PortfolioResponse(**portfolio_record.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{portfolio_id}")
def delete_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    current_user: User = Depends(deps.get_current_admin),  # Only admin can delete portfolios
):
    """
    Delete portfolio (Admin only)
    """
    try:
        success = portfolio.delete_portfolio(db, portfolio_id=portfolio_id)
        if not success:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        
        return {"message": "Portfolio deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/search/", response_model=List[PortfolioListResponse])
def search_portfolios(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, description="Search term"),
    current_user: User = Depends(deps.get_current_user),
) -> List[PortfolioListResponse]:
    """
    Search portfolios by name or description
    """
    portfolios = portfolio.search_portfolios(db, search_term=q)
    
    result = []
    for portfolio_record in portfolios:
        portfolio_data = PortfolioListResponse(**portfolio_record.__dict__)
        portfolio_data.has_channel = bool(portfolio_record.channel_id)
        result.append(portfolio_data)
    
    return result


@router.get("/name/{portfolio_name}", response_model=PortfolioDetailResponse)
def read_portfolio_by_name(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_name: str,
    current_user: User = Depends(deps.get_current_user),
) -> PortfolioDetailResponse:
    """
    Get portfolio by name with details
    """
    portfolio_record = portfolio.get_by_name(db, name=portfolio_name)
    if not portfolio_record:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get statistics for this portfolio
    user_count = portfolio.get_user_count(db, portfolio_id=portfolio_record.portfolio_id)
    task_count = portfolio.get_task_count(db, portfolio_id=portfolio_record.portfolio_id)
    meeting_count = portfolio.get_meeting_count(db, portfolio_id=portfolio_record.portfolio_id)
    active_task_count = portfolio.get_active_task_count(db, portfolio_id=portfolio_record.portfolio_id)
    
    portfolio_data = PortfolioDetailResponse(**portfolio_record.__dict__)
    portfolio_data.user_count = user_count
    portfolio_data.task_count = task_count
    portfolio_data.meeting_count = meeting_count
    portfolio_data.active_task_count = active_task_count
    return portfolio_data


@router.get("/channel/{channel_id}", response_model=PortfolioDetailResponse)
def read_portfolio_by_channel(
    *,
    db: Session = Depends(deps.get_db),
    channel_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> PortfolioDetailResponse:
    """
    Get portfolio by Discord channel ID with details
    """
    portfolio_record = portfolio.get_by_channel_id(db, channel_id=channel_id)
    if not portfolio_record:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    
    # Get statistics for this portfolio
    user_count = portfolio.get_user_count(db, portfolio_id=portfolio_record.portfolio_id)
    task_count = portfolio.get_task_count(db, portfolio_id=portfolio_record.portfolio_id)
    meeting_count = portfolio.get_meeting_count(db, portfolio_id=portfolio_record.portfolio_id)
    active_task_count = portfolio.get_active_task_count(db, portfolio_id=portfolio_record.portfolio_id)
    
    portfolio_data = PortfolioDetailResponse(**portfolio_record.__dict__)
    portfolio_data.user_count = user_count
    portfolio_data.task_count = task_count
    portfolio_data.meeting_count = meeting_count
    portfolio_data.active_task_count = active_task_count
    return portfolio_data


@router.get("/with-channels/", response_model=List[PortfolioListResponse])
def read_portfolios_with_channels(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[PortfolioListResponse]:
    """
    Get portfolios that have Discord channels assigned
    """
    portfolios = portfolio.get_portfolios_with_channels(db)
    
    result = []
    for portfolio_record in portfolios:
        portfolio_data = PortfolioListResponse(**portfolio_record.__dict__)
        portfolio_data.has_channel = True  # Always true for this endpoint
        result.append(portfolio_data)
    
    return result


@router.get("/without-channels/", response_model=List[PortfolioListResponse])
def read_portfolios_without_channels(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> List[PortfolioListResponse]:
    """
    Get portfolios that don't have Discord channels assigned
    """
    portfolios = portfolio.get_portfolios_without_channels(db)
    
    result = []
    for portfolio_record in portfolios:
        portfolio_data = PortfolioListResponse(**portfolio_record.__dict__)
        portfolio_data.has_channel = False  # Always false for this endpoint
        result.append(portfolio_data)
    
    return result 