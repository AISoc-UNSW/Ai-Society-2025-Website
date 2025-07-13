from pydantic import BaseModel
from datetime import date


# Shared properties
class MeetingRecordBase(BaseModel):
    meeting_date: date
    meeting_name: str
    recording_file_link: str | None = None
    auto_caption: str | None = None
    summary: str | None = None
    portfolio_id: int
    user_can_see: bool = True


# Used when creating a meeting record
class MeetingRecordCreateRequestBody(MeetingRecordBase):
    meeting_date: date
    meeting_name: str
    portfolio_id: int
    user_can_see: bool = True


# Used when updating a meeting record
class MeetingRecordUpdate(BaseModel):
    meeting_date: date | None = None
    meeting_name: str | None = None
    recording_file_link: str | None = None
    auto_caption: str | None = None
    summary: str | None = None
    portfolio_id: int | None = None
    user_can_see: bool | None = None


# Used for API responses
class MeetingRecordResponse(MeetingRecordBase):
    meeting_id: int
    portfolio_name: str | None = None
    
    class Config:
        from_attributes = True


# Used for listing meeting records (minimal info)
class MeetingRecordListResponse(BaseModel):
    meeting_id: int
    meeting_date: date
    meeting_name: str
    portfolio_id: int
    user_can_see: bool
    has_recording: bool = False  # Computed field
    has_summary: bool = False    # Computed field
    summary: str | None = None   # Added summary field
    portfolio_name: str | None = None  # Added portfolio_name field
    
    class Config:
        from_attributes = True


# Used for meeting record detail with related tasks
class MeetingRecordDetailResponse(MeetingRecordResponse):
    # Include related tasks if needed (imported from task schemas)
    related_tasks_count: int | None = None
    
    class Config:
        from_attributes = True 