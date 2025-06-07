"""
Backend API Communication Client

Provides basic HTTP communication functionality with FastAPI backend service
"""

import aiohttp
from typing import Any


class APIClient:
    """Backend API communication client"""
    
    def __init__(self, base_url: str) -> None:
        """
        Initialize API client
        
        Args:
            base_url: Base URL of the backend API
        """
        self.base_url = base_url.rstrip('/')
        self.session: aiohttp.ClientSession | None = None
    
    async def __aenter__(self) -> 'APIClient':
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> dict[str, Any]:
        """
        Base method for sending HTTP requests
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            **kwargs: Other request parameters
            
        Returns:
            JSON data from response
        """
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}{endpoint}"
        
        async with self.session.request(method, url, **kwargs) as response:
            response.raise_for_status()
            return await response.json()
    
    def set_auth_headers(self, headers: dict[str, str]) -> None:
        """
        Set authentication headers
        
        Args:
            headers: Authentication headers
        """
        if self.session:
            self.session.headers.update(headers)
    
    async def get(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """GET request"""
        return await self._request("GET", endpoint, **kwargs)
    
    async def post(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """POST request"""
        return await self._request("POST", endpoint, **kwargs)
    
    async def put(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """PUT request"""
        return await self._request("PUT", endpoint, **kwargs)
    
    async def delete(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """DELETE request"""
        return await self._request("DELETE", endpoint, **kwargs) 