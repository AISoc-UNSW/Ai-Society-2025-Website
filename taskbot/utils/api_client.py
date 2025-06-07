"""
后端API通信客户端

提供与FastAPI后端服务的基础HTTP通信功能
"""

import aiohttp
from typing import Any


class APIClient:
    """后端API通信客户端"""
    
    def __init__(self, base_url: str) -> None:
        """
        初始化API客户端
        
        Args:
            base_url: 后端API的基础URL
        """
        self.base_url = base_url.rstrip('/')
        self.session: aiohttp.ClientSession | None = None
    
    async def __aenter__(self) -> 'APIClient':
        """异步上下文管理器入口"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """异步上下文管理器出口"""
        if self.session:
            await self.session.close()
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> dict[str, Any]:
        """
        发送HTTP请求的基础方法
        
        Args:
            method: HTTP方法
            endpoint: API端点
            **kwargs: 其他请求参数
            
        Returns:
            响应的JSON数据
        """
        if not self.session:
            raise RuntimeError("APIClient must be used as async context manager")
        
        url = f"{self.base_url}{endpoint}"
        
        async with self.session.request(method, url, **kwargs) as response:
            response.raise_for_status()
            return await response.json()
    
    def set_auth_headers(self, headers: dict[str, str]) -> None:
        """
        设置认证请求头
        
        Args:
            headers: 认证请求头
        """
        if self.session:
            self.session.headers.update(headers)
    
    async def get(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """GET请求"""
        return await self._request("GET", endpoint, **kwargs)
    
    async def post(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """POST请求"""
        return await self._request("POST", endpoint, **kwargs)
    
    async def put(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """PUT请求"""
        return await self._request("PUT", endpoint, **kwargs)
    
    async def delete(self, endpoint: str, **kwargs) -> dict[str, Any]:
        """DELETE请求"""
        return await self._request("DELETE", endpoint, **kwargs) 