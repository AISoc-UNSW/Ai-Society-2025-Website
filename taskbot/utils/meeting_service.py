"""
Meeting Record Service

Responsible for handling meeting record related API calls
"""

import logging
from datetime import date

from .api_client import APIClient
from .auth_manager import AuthManager
from .config import config

logger = logging.getLogger(__name__)


class MeetingService:
    """Meeting record service"""
    
    def __init__(self) -> None:
        """Initialize meeting record service"""
        self.auth_manager = AuthManager(config.api_base_url)
        self._authenticated = False
    
    async def ensure_authenticated(self) -> bool:
        """Ensure authenticated"""
        if not self._authenticated:
            success = await self.auth_manager.login(
                config.api_username, 
                config.api_password
            )
            if success:
                self._authenticated = True
                logger.info("Successfully authenticated with backend API")
            else:
                logger.error("Failed to authenticate with backend API")
            return success
        return True
    
    async def create_meeting_record(
        self,
        meeting_name: str,
        portfolio_id: int,
        recording_file_path: str,
        meeting_date: date | None = None
    ) -> dict | None:
        """
        Create meeting record
        
        Args:
            meeting_name: Meeting name
            portfolio_id: Portfolio ID
            recording_file_path: Local path of recording file
            meeting_date: Meeting date, defaults to today
            
        Returns:
            Returns meeting record data if successful, None if failed
        """
        if not await self.ensure_authenticated():
            logger.error("Cannot create meeting record: authentication failed")
            return None
        
        try:
            # Prepare meeting record data
            if meeting_date is None:
                meeting_date = date.today()
            
            meeting_data = {
                "meeting_date": meeting_date.isoformat(),
                "meeting_name": meeting_name,
                "recording_file_link": recording_file_path,
                "auto_caption": None,  # Leave empty for subsequent AI processing
                "summary": None,       # Leave empty for subsequent AI processing
                "portfolio_id": portfolio_id
            }
            
            # Send create request
            async with APIClient(config.api_base_url) as client:
                # Set authentication headers
                client.set_auth_headers(self.auth_manager.auth_headers)
                
                # Create meeting record
                response = await client.post(
                    "/api/v1/meeting-records/",
                    json=meeting_data
                )
                
                logger.info(f"Successfully created meeting record: {response.get('meeting_id')}")
                return response
                
        except Exception as e:
            logger.error(f"Failed to create meeting record: {e}")
            return None
    
    def get_recording_file_path(self, meeting_name: str, portfolio_id: int) -> str:
        """
        Generate recording file save path
        
        Args:
            meeting_name: Meeting name
            portfolio_id: Portfolio ID
            
        Returns:
            Complete path of the recording file
        """
        # Generate safe filename
        safe_meeting_name = "".join(c for c in meeting_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_meeting_name = safe_meeting_name.replace(' ', '_')
        
        # Generate filename: meeting_{name}_{portfolio_id}_{date}.wav
        today = date.today().strftime("%Y%m%d")
        filename = f"meeting_{safe_meeting_name}_{portfolio_id}_{today}.wav"
        
        # Complete path
        file_path = config.recording_save_path / filename
        
        return str(file_path.absolute()) 