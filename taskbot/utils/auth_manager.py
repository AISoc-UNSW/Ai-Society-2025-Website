"""
认证token管理器

负责管理与后端API的认证token，包括获取、存储、刷新和验证
"""

import asyncio
from typing import Optional
from datetime import datetime, timedelta
import logging

from .api_client import APIClient

logger = logging.getLogger(__name__)


class AuthManager:
    """认证管理器"""
    
    def __init__(self, base_url: str) -> None:
        """
        初始化认证管理器
        
        Args:
            base_url: 后端API的基础URL
        """
        self.base_url = base_url
        self._token: Optional[str] = None
        self._token_type: str = "Bearer"
        self._expires_at: Optional[datetime] = None
        
    @property
    def is_authenticated(self) -> bool:
        """检查是否已认证且token未过期"""
        if not self._token:
            return False
        
        if self._expires_at and datetime.now() >= self._expires_at:
            return False
            
        return True
    
    @property
    def auth_headers(self) -> dict[str, str]:
        """获取认证请求头"""
        if not self.is_authenticated:
            raise RuntimeError("Not authenticated. Please login first.")
        
        return {
            "Authorization": f"{self._token_type} {self._token}"
        }
    
    async def login(self, username: str, password: str) -> bool:
        """
        使用用户名密码登录获取token
        
        Args:
            username: 用户名（邮箱）
            password: 密码
            
        Returns:
            登录是否成功
        """
        try:
            async with APIClient(self.base_url) as client:
                # 准备登录数据
                login_data = {
                    "username": username,
                    "password": password,
                    "grant_type": "password"
                }
                
                # 发送登录请求
                response = await client.post(
                    "/api/v1/login/access-token",
                    data=login_data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                # 保存token信息
                self._token = response["access_token"]
                self._token_type = response.get("token_type", "Bearer")
                
                # 设置过期时间（假设token有效期为1小时）
                self._expires_at = datetime.now() + timedelta(hours=1)
                
                logger.info("Successfully authenticated")
                return True
                
        except Exception as e:
            logger.error(f"Login failed: {e}")
            self._clear_auth()
            return False
    
    def logout(self) -> None:
        """登出，清除认证信息"""
        self._clear_auth()
        logger.info("Logged out")
    
    def _clear_auth(self) -> None:
        """清除认证信息"""
        self._token = None
        self._token_type = "Bearer"
        self._expires_at = None 