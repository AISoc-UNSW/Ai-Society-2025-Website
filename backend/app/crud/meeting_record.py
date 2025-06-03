from typing import Any, Dict, Union, List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.meeting_record import MeetingRecord
from app.schemas.meeting_record import MeetingRecordCreateRequestBody, MeetingRecordUpdate


def get_by_id(db: Session, meeting_id: int) -> MeetingRecord | None:
    """Get meeting record by ID"""
    return db.query(MeetingRecord).filter(MeetingRecord.meeting_id == meeting_id).first()


def get_by_portfolio(db: Session, portfolio_id: int, skip: int = 0, limit: int = 100) -> List[MeetingRecord]:
    """Get meeting records by portfolio ID"""
    return db.query(MeetingRecord).filter(MeetingRecord.portfolio_id == portfolio_id).offset(skip).limit(limit).all()


def get_by_date_range(db: Session, start_date: date, end_date: date, skip: int = 0, limit: int = 100) -> List[MeetingRecord]:
    """Get meeting records within date range"""
    return db.query(MeetingRecord).filter(
        and_(
            MeetingRecord.meeting_date >= start_date,
            MeetingRecord.meeting_date <= end_date
        )
    ).offset(skip).limit(limit).all()


def get_with_recordings(db: Session, skip: int = 0, limit: int = 100) -> List[MeetingRecord]:
    """Get meeting records that have recording files"""
    return db.query(MeetingRecord).filter(
        MeetingRecord.recording_file_link.isnot(None)
    ).offset(skip).limit(limit).all()


def get_with_summaries(db: Session, skip: int = 0, limit: int = 100) -> List[MeetingRecord]:
    """Get meeting records that have summaries"""
    return db.query(MeetingRecord).filter(
        MeetingRecord.summary.isnot(None)
    ).offset(skip).limit(limit).all()


def get_multi(
    db: Session,
    *,
    portfolio_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    has_recording: Optional[bool] = None,
    has_summary: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
) -> List[MeetingRecord]:
    """Get multiple meeting records with optional filters"""
    query = db.query(MeetingRecord)
    
    if portfolio_id:
        query = query.filter(MeetingRecord.portfolio_id == portfolio_id)
    
    if start_date and end_date:
        query = query.filter(
            and_(
                MeetingRecord.meeting_date >= start_date,
                MeetingRecord.meeting_date <= end_date
            )
        )
    elif start_date:
        query = query.filter(MeetingRecord.meeting_date >= start_date)
    elif end_date:
        query = query.filter(MeetingRecord.meeting_date <= end_date)
    
    if has_recording is True:
        query = query.filter(MeetingRecord.recording_file_link.isnot(None))
    elif has_recording is False:
        query = query.filter(MeetingRecord.recording_file_link.is_(None))
    
    if has_summary is True:
        query = query.filter(MeetingRecord.summary.isnot(None))
    elif has_summary is False:
        query = query.filter(MeetingRecord.summary.is_(None))
    
    return query.order_by(MeetingRecord.meeting_date.desc()).offset(skip).limit(limit).all()


def create_meeting_record(db: Session, *, obj_in: MeetingRecordCreateRequestBody) -> MeetingRecord:
    """Create new meeting record"""
    db_obj = MeetingRecord()
    db_obj.meeting_date = obj_in.meeting_date
    db_obj.meeting_name = obj_in.meeting_name
    db_obj.recording_file_link = obj_in.recording_file_link
    db_obj.auto_caption = obj_in.auto_caption
    db_obj.summary = obj_in.summary
    db_obj.portfolio_id = obj_in.portfolio_id

    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_meeting_record(db: Session, *, db_obj: MeetingRecord, obj_in: Union[MeetingRecordUpdate, Dict[str, Any]]) -> MeetingRecord:
    """Update existing meeting record"""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_meeting_record(db: Session, *, meeting_id: int) -> bool:
    """Delete meeting record by ID"""
    meeting = db.query(MeetingRecord).filter(MeetingRecord.meeting_id == meeting_id).first()
    if meeting:
        db.delete(meeting)
        db.commit()
        return True
    return False


def search_meeting_records(db: Session, *, search_term: str, portfolio_id: Optional[int] = None) -> List[MeetingRecord]:
    """Search meeting records by name or summary"""
    query = db.query(MeetingRecord)
    
    if portfolio_id:
        query = query.filter(MeetingRecord.portfolio_id == portfolio_id)
    
    search_filter = or_(
        MeetingRecord.meeting_name.ilike(f"%{search_term}%"),
        MeetingRecord.summary.ilike(f"%{search_term}%"),
        MeetingRecord.auto_caption.ilike(f"%{search_term}%")
    )
    
    return query.filter(search_filter).order_by(MeetingRecord.meeting_date.desc()).all()


def get_related_tasks_count(db: Session, meeting_id: int) -> int:
    """Get count of tasks related to this meeting"""
    from app.models.task import Task
    return db.query(func.count(Task.task_id)).filter(Task.source_meeting_id == meeting_id).scalar() or 0 