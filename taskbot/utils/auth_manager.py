"""
Authentication Token Manager

Responsible for managing authentication tokens with backend API, including acquisition, storage, refresh and validation
"""

import asyncio
from typing import Optional
from datetime import datetime, timedelta
import logging

from .api_client import APIClient

logger = logging.getLogger(__name__)


class AuthManager:
    """Authentication manager"""
    
    def __init__(self, base_url: str) -> None:
        """
        Initialize authentication manager
        
        Args:
            base_url: Base URL of the backend API
        """
        self.base_url = base_url
        self._token: Optional[str] = None
        self._token_type: str = "Bearer"
        self._expires_at: Optional[datetime] = None
        
    @property
    def is_authenticated(self) -> bool:
        """Check if authenticated and token is not expired"""
        if not self._token:
            return False
        
        if self._expires_at and datetime.now() >= self._expires_at:
            return False
            
        return True
    
    @property
    def auth_headers(self) -> dict[str, str]:
        """Get authentication headers"""
        if not self.is_authenticated:
            raise RuntimeError("Not authenticated. Please login first.")
        
        return {
            "Authorization": f"{self._token_type} {self._token}"
        }
    
    async def login(self, username: str, password: str) -> bool:
        """
        Login with username and password to get token
        
        Args:
            username: Username (email)
            password: Password
            
        Returns:
            Whether login was successful
        """
        try:
            async with APIClient(self.base_url) as client:
                # Prepare login data
                login_data = {
                    "username": username,
                    "password": password,
                    "grant_type": "password"
                }
                
                # Send login request
                response = await client.post(
                    "/api/v1/login/access-token",
                    data=login_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                # Save token information
                self._token = response["access_token"]
                self._token_type = response.get("token_type", "Bearer")
                
                # Set expiration time (assume token is valid for 1 hour)
                self._expires_at = datetime.now() + timedelta(hours=1)
                
                logger.info("Successfully authenticated")
                return True
                
        except Exception as e:
            logger.error(f"Login failed: {e}")
            self._clear_auth()
            return False
    
    def logout(self) -> None:
        """Logout and clear authentication information"""
        self._clear_auth()
        logger.info("Logged out")
    
    def _clear_auth(self) -> None:
        """Clear authentication information"""
        self._token = None
        self._token_type = "Bearer"
        self._expires_at = None 