from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.crud import meeting_record
from app.models.user import User
from app.schemas.meeting_record import (
    MeetingRecordCreateRequestBody,
    MeetingRecordUpdate,
    MeetingRecordResponse,
    MeetingRecordListResponse,
    MeetingRecordDetailResponse,
)

router = APIRouter()


@router.post("/", response_model=MeetingRecordResponse)
def create_meeting_record(
    *,
    db: Session = Depends(deps.get_db),
    meeting_in: MeetingRecordCreateRequestBody,
    current_user: User = Depends(deps.get_current_user),
) -> MeetingRecordResponse:
    """
    Create new meeting record
    """
    meeting_rec = meeting_record.create_meeting_record(db, obj_in=meeting_in)
    return MeetingRecordResponse(**meeting_rec.__dict__)


@router.get("/{meeting_id}", response_model=MeetingRecordDetailResponse)
def read_meeting_record(
    *,
    db: Session = Depends(deps.get_db),
    meeting_id: int,
    current_user: User = Depends(deps.get_current_user),
) -> MeetingRecordDetailResponse:
    """
    Get meeting record by ID with details (permission-filtered)
    """
    meeting_rec = meeting_record.get_by_id_with_permissions(db, meeting_id=meeting_id, current_user=current_user)
    if not meeting_rec:
        raise HTTPException(status_code=404, detail="Meeting record not found")

    # Get related tasks count
    related_tasks_count = meeting_record.get_related_tasks_count(db, meeting_id=meeting_id)

    meeting_data = MeetingRecordDetailResponse(**meeting_rec.__dict__)
    meeting_data.related_tasks_count = related_tasks_count
    return meeting_data


@router.get("/", response_model=list[MeetingRecordListResponse])
def read_meeting_records(
    db: Session = Depends(deps.get_db),
    portfolio_id: int | None = Query(None, description="Filter by portfolio ID"),
    start_date: date | None = Query(None, description="Filter by start date"),
    end_date: date | None = Query(None, description="Filter by end date"),
    has_recording: bool | None = Query(None, description="Filter by recording availability"),
    has_summary: bool | None = Query(None, description="Filter by summary availability"),
    skip: int = Query(0, ge=0, description="Skip items"),
    limit: int = Query(100, ge=1, le=1000, description="Limit items"),
    current_user: User = Depends(deps.get_current_user),
) -> list[MeetingRecordListResponse]:
    """
    Get meeting records with optional filters (permission-filtered)
    """
    meetings = meeting_record.get_multi_with_permissions(
        db,
        current_user=current_user,
        portfolio_id=portfolio_id,
        start_date=start_date,
        end_date=end_date,
        has_recording=has_recording,
        has_summary=has_summary,
        skip=skip,
        limit=limit,
    )

    # Add computed fields
    result = []
    for meeting_rec in meetings:
        meeting_data = MeetingRecordListResponse(**meeting_rec.__dict__)
        meeting_data.has_recording = bool(meeting_rec.recording_file_link)
        meeting_data.has_summary = bool(meeting_rec.summary)
        result.append(meeting_data)

    return result


@router.put("/{meeting_id}", response_model=MeetingRecordResponse)
def update_meeting_record(
    *,
    db: Session = Depends(deps.get_db),
    meeting_id: int,
    meeting_in: MeetingRecordUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> MeetingRecordResponse:
    """
    Update meeting record (permission-checked)
    """
    meeting_rec = meeting_record.get_by_id_with_permissions(db, meeting_id=meeting_id, current_user=current_user)
    if not meeting_rec:
        raise HTTPException(status_code=404, detail="Meeting record not found")

    meeting_rec = meeting_record.update_meeting_record(db, db_obj=meeting_rec, obj_in=meeting_in)
    return MeetingRecordResponse(**meeting_rec.__dict__)


@router.delete("/{meeting_id}")
def delete_meeting_record(
    *,
    db: Session = Depends(deps.get_db),
    meeting_id: int,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Delete meeting record (permission-checked)
    """
    # Check if user has permission to access this meeting first
    meeting_rec = meeting_record.get_by_id_with_permissions(db, meeting_id=meeting_id, current_user=current_user)
    if not meeting_rec:
        raise HTTPException(status_code=404, detail="Meeting record not found")

    success = meeting_record.delete_meeting_record(db, meeting_id=meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting record not found")

    return {"message": "Meeting record deleted successfully"}


@router.get("/portfolio/{portfolio_id}", response_model=list[MeetingRecordListResponse])
def read_meeting_records_by_portfolio(
    *,
    db: Session = Depends(deps.get_db),
    portfolio_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_user),
) -> list[MeetingRecordListResponse]:
    """
    Get meeting records by portfolio ID (permission-filtered)
    """
    meetings = meeting_record.get_multi_with_permissions(
        db, 
        current_user=current_user,
        portfolio_id=portfolio_id, 
        skip=skip, 
        limit=limit
    )

    result = []
    for meeting_rec in meetings:
        meeting_data = MeetingRecordListResponse(**meeting_rec.__dict__)
        meeting_data.has_recording = bool(meeting_rec.recording_file_link)
        meeting_data.has_summary = bool(meeting_rec.summary)
        result.append(meeting_data)

    return result


@router.get("/with-recordings/", response_model=list[MeetingRecordListResponse])
def read_meeting_records_with_recordings(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_user),
) -> list[MeetingRecordListResponse]:
    """
    Get meeting records that have recording files (permission-filtered)
    """
    meetings = meeting_record.get_multi_with_permissions(
        db, 
        current_user=current_user,
        has_recording=True,
        skip=skip, 
        limit=limit
    )

    result = []
    for meeting_rec in meetings:
        meeting_data = MeetingRecordListResponse(**meeting_rec.__dict__)
        meeting_data.has_recording = True  # Always true for this endpoint
        meeting_data.has_summary = bool(meeting_rec.summary)
        result.append(meeting_data)

    return result


@router.get("/with-summaries/", response_model=list[MeetingRecordListResponse])
def read_meeting_records_with_summaries(
    *,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_user),
) -> list[MeetingRecordListResponse]:
    """
    Get meeting records that have summaries (permission-filtered)
    """
    meetings = meeting_record.get_multi_with_permissions(
        db, 
        current_user=current_user,
        has_summary=True,
        skip=skip, 
        limit=limit
    )

    result = []
    for meeting_rec in meetings:
        meeting_data = MeetingRecordListResponse(**meeting_rec.__dict__)
        meeting_data.has_recording = bool(meeting_rec.recording_file_link)
        meeting_data.has_summary = True  # Always true for this endpoint
        result.append(meeting_data)

    return result


@router.get("/search/", response_model=list[MeetingRecordListResponse])
def search_meeting_records(
    *,
    db: Session = Depends(deps.get_db),
    q: str = Query(..., min_length=1, description="Search term"),
    portfolio_id: int | None = Query(None, description="Filter by portfolio ID"),
    current_user: User = Depends(deps.get_current_user),
) -> list[MeetingRecordListResponse]:
    """
    Search meeting records by name, summary, or caption (permission-filtered)
    """
    meetings = meeting_record.search_meeting_records_with_permissions(
        db, 
        search_term=q, 
        current_user=current_user,
        portfolio_id=portfolio_id
    )

    result = []
    for meeting_rec in meetings:
        meeting_data = MeetingRecordListResponse(**meeting_rec.__dict__)
        meeting_data.has_recording = bool(meeting_rec.recording_file_link)
        meeting_data.has_summary = bool(meeting_rec.summary)
        result.append(meeting_data)

    return result
