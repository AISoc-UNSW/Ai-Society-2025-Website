"""
会议记录服务

负责处理会议记录相关的API调用
"""

import logging
from datetime import date
from typing import Optional
from pathlib import Path

from .api_client import APIClient
from .auth_manager import AuthManager
from .config import config

logger = logging.getLogger(__name__)


class MeetingService:
    """会议记录服务"""
    
    def __init__(self) -> None:
        """初始化会议记录服务"""
        self.auth_manager = AuthManager(config.api_base_url)
        self._authenticated = False
    
    async def ensure_authenticated(self) -> bool:
        """确保已认证"""
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
        meeting_date: Optional[date] = None
    ) -> Optional[dict]:
        """
        创建会议记录
        
        Args:
            meeting_name: 会议名称
            portfolio_id: 项目组合ID
            recording_file_path: 录音文件本地路径
            meeting_date: 会议日期，默认为今天
            
        Returns:
            创建成功返回会议记录数据，失败返回None
        """
        if not await self.ensure_authenticated():
            logger.error("Cannot create meeting record: authentication failed")
            return None
        
        try:
            # 准备会议记录数据
            if meeting_date is None:
                meeting_date = date.today()
            
            meeting_data = {
                "meeting_date": meeting_date.isoformat(),
                "meeting_name": meeting_name,
                "recording_file_link": recording_file_path,
                "auto_caption": None,  # 留空等待后续AI处理
                "summary": None,       # 留空等待后续AI处理
                "portfolio_id": portfolio_id
            }
            
            # 发送创建请求
            async with APIClient(config.api_base_url) as client:
                # 设置认证头
                client.set_auth_headers(self.auth_manager.auth_headers)
                
                # 创建会议记录
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
        生成录音文件保存路径
        
        Args:
            meeting_name: 会议名称
            portfolio_id: 项目组合ID
            
        Returns:
            录音文件的完整路径
        """
        # 生成安全的文件名
        safe_meeting_name = "".join(c for c in meeting_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_meeting_name = safe_meeting_name.replace(' ', '_')
        
        # 生成文件名：meeting_{name}_{portfolio_id}_{date}.wav
        today = date.today().strftime("%Y%m%d")
        filename = f"meeting_{safe_meeting_name}_{portfolio_id}_{today}.wav"
        
        # 完整路径
        file_path = config.recording_save_path / filename
        
        return str(file_path.absolute()) 