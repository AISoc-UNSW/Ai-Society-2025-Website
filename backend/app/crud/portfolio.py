from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.portfolio import Portfolio
from app.schemas.portfolio import PortfolioCreateRequestBody, PortfolioUpdate


def get_by_id(db: Session, portfolio_id: int) -> Portfolio | None:
    """Get portfolio by ID"""
    return db.query(Portfolio).filter(Portfolio.portfolio_id == portfolio_id).first()


def get_by_name(db: Session, name: str) -> Portfolio | None:
    """Get portfolio by name"""
    return db.query(Portfolio).filter(Portfolio.name == name).first()


def get_by_channel_id(db: Session, channel_id: str) -> Portfolio | None:
    """Get portfolio by Discord channel ID"""
    return db.query(Portfolio).filter(Portfolio.channel_id == channel_id).first()


def get_multi(db: Session, *, skip: int = 0, limit: int = 100) -> list[Portfolio]:
    """Get multiple portfolios"""
    return db.query(Portfolio).offset(skip).limit(limit).all()


def get_all(db: Session) -> list[Portfolio]:
    """Get all portfolios (for simple dropdown lists)"""
    return db.query(Portfolio).all()


def create_portfolio(db: Session, *, obj_in: PortfolioCreateRequestBody) -> Portfolio:
    """Create new portfolio"""
    # Check if portfolio name already exists
    existing = get_by_name(db, name=obj_in.name)
    if existing:
        raise ValueError(f"Portfolio with name '{obj_in.name}' already exists")
    
    # Check if channel_id already exists (if provided)
    if obj_in.channel_id:
        existing_channel = get_by_channel_id(db, channel_id=obj_in.channel_id)
        if existing_channel:
            raise ValueError(f"Portfolio with channel ID '{obj_in.channel_id}' already exists")
    
    db_obj = Portfolio()
    db_obj.name = obj_in.name
    db_obj.description = obj_in.description
    db_obj.channel_id = obj_in.channel_id

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_portfolio(db: Session, *, db_obj: Portfolio, obj_in: PortfolioUpdate | dict[str, Any]) -> Portfolio:
    """Update existing portfolio"""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    
    # Check if portfolio name already exists (if updating name)
    if "name" in update_data and update_data["name"] != db_obj.name:
        existing = get_by_name(db, name=update_data["name"])
        if existing:
            raise ValueError(f"Portfolio with name '{update_data['name']}' already exists")
    
    # Check if channel_id already exists (if updating channel_id)
    if "channel_id" in update_data and update_data["channel_id"] != db_obj.channel_id:
        if update_data["channel_id"]:  # Only check if not None/empty
            existing_channel = get_by_channel_id(db, channel_id=update_data["channel_id"])
            if existing_channel:
                raise ValueError(f"Portfolio with channel ID '{update_data['channel_id']}' already exists")
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_portfolio(db: Session, *, portfolio_id: int) -> bool:
    """Delete portfolio by ID"""
    portfolio = get_by_id(db, portfolio_id=portfolio_id)
    if not portfolio:
        return False
    
    # Check dependencies
    user_count = get_user_count(db, portfolio_id=portfolio_id)
    task_count = get_task_count(db, portfolio_id=portfolio_id)
    meeting_count = get_meeting_count(db, portfolio_id=portfolio_id)
    
    total_dependencies = user_count + task_count + meeting_count
    if total_dependencies > 0:
        raise ValueError(
            f"Cannot delete portfolio '{portfolio.name}' because it has "
            f"{user_count} users, {task_count} tasks, and {meeting_count} meetings assigned"
        )
    
    db.delete(portfolio)
    db.commit()
    return True


def get_user_count(db: Session, portfolio_id: int) -> int:
    """Get count of users in this portfolio"""
    from app.models.user import User
    return db.query(func.count(User.user_id)).filter(User.portfolio_id == portfolio_id).scalar() or 0


def get_task_count(db: Session, portfolio_id: int) -> int:
    """Get count of tasks in this portfolio"""
    from app.models.task import Task
    return db.query(func.count(Task.task_id)).filter(Task.portfolio_id == portfolio_id).scalar() or 0


def get_active_task_count(db: Session, portfolio_id: int) -> int:
    """Get count of active (non-completed) tasks in this portfolio"""
    from app.models.task import Task
    return db.query(func.count(Task.task_id)).filter(
        and_(Task.portfolio_id == portfolio_id, Task.status != "Completed")
    ).scalar() or 0


def get_completed_task_count(db: Session, portfolio_id: int) -> int:
    """Get count of completed tasks in this portfolio"""
    from app.models.task import Task
    return db.query(func.count(Task.task_id)).filter(
        and_(Task.portfolio_id == portfolio_id, Task.status == "Completed")
    ).scalar() or 0


def get_meeting_count(db: Session, portfolio_id: int) -> int:
    """Get count of meeting records in this portfolio"""
    from app.models.meeting_record import MeetingRecord
    return db.query(func.count(MeetingRecord.meeting_id)).filter(
        MeetingRecord.portfolio_id == portfolio_id
    ).scalar() or 0


def search_portfolios(db: Session, *, search_term: str) -> list[Portfolio]:
    """Search portfolios by name or description"""
    search_filter = Portfolio.name.ilike(f"%{search_term}%")
    if search_term:
        # Also search in description if it exists
        search_filter = search_filter | Portfolio.description.ilike(f"%{search_term}%")
    
    return db.query(Portfolio).filter(search_filter).all()


def get_portfolio_statistics(db: Session, portfolio_id: int) -> dict[str, Any]:
    """Get comprehensive statistics for a portfolio"""
    portfolio = get_by_id(db, portfolio_id=portfolio_id)
    if not portfolio:
        return {}
    
    user_count = get_user_count(db, portfolio_id=portfolio_id)
    task_count = get_task_count(db, portfolio_id=portfolio_id)
    active_task_count = get_active_task_count(db, portfolio_id=portfolio_id)
    completed_task_count = get_completed_task_count(db, portfolio_id=portfolio_id)
    meeting_count = get_meeting_count(db, portfolio_id=portfolio_id)
    
    return {
        "portfolio_id": portfolio.portfolio_id,
        "name": portfolio.name,
        "user_count": user_count,
        "task_count": task_count,
        "active_task_count": active_task_count,
        "completed_task_count": completed_task_count,
        "meeting_count": meeting_count,
    }


def get_all_portfolio_statistics(db: Session) -> list[dict[str, Any]]:
    """Get statistics for all portfolios"""
    portfolios = get_all(db)
    statistics = []
    
    for portfolio in portfolios:
        stats = get_portfolio_statistics(db, portfolio_id=portfolio.portfolio_id)
        statistics.append(stats)
    
    return statistics


def get_portfolios_with_channels(db: Session) -> list[Portfolio]:
    """Get portfolios that have Discord channels assigned"""
    return db.query(Portfolio).filter(Portfolio.channel_id.isnot(None)).all()


def get_portfolios_without_channels(db: Session) -> list[Portfolio]:
    """Get portfolios that don't have Discord channels assigned"""
    return db.query(Portfolio).filter(Portfolio.channel_id.is_(None)).all() 