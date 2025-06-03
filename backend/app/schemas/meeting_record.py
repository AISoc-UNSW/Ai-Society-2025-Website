from pydantic import BaseModel
from datetime import date
from typing import Optional


# Shared properties
class MeetingRecordBase(BaseModel):
    meeting_date: date
    meeting_name: str
    recording_file_link: Optional[str] = None
    auto_caption: Optional[str] = None
    summary: Optional[str] = None
    portfolio_id: int


# Used when creating a meeting record
class MeetingRecordCreateRequestBody(MeetingRecordBase):
    meeting_date: date
    meeting_name: str
    portfolio_id: int


# Used when updating a meeting record
class MeetingRecordUpdate(BaseModel):
    meeting_date: Optional[date] = None
    meeting_name: Optional[str] = None
    recording_file_link: Optional[str] = None
    auto_caption: Optional[str] = None
    summary: Optional[str] = None
    portfolio_id: Optional[int] = None


# Used for API responses
class MeetingRecordResponse(MeetingRecordBase):
    meeting_id: int
    
    class Config:
        from_attributes = True


# Used for listing meeting records (minimal info)
class MeetingRecordListResponse(BaseModel):
    meeting_id: int
    meeting_date: date
    meeting_name: str
    portfolio_id: int
    has_recording: bool = False  # Computed field
    has_summary: bool = False    # Computed field
    
    class Config:
        from_attributes = True


# Used for meeting record detail with related tasks
class MeetingRecordDetailResponse(MeetingRecordResponse):
    # Include related tasks if needed (imported from task schemas)
    related_tasks_count: Optional[int] = None
    
    class Config:
        from_attributes = True 