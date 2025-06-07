"""
配置管理器

负责读取和管理环境变量配置
"""

import os
from pathlib import Path
from typing import Optional


class Config:
    """配置管理类"""
    
    def __init__(self) -> None:
        """初始化配置，加载.env文件"""
        self._load_env_file()
    
    def _load_env_file(self) -> None:
        """加载.env文件"""
        env_path = Path(__file__).parent.parent / ".env"
        
        if env_path.exists():
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        os.environ[key.strip()] = value.strip()
    
    @property
    def discord_token(self) -> str:
        """Discord Bot Token"""
        token = os.getenv("DISCORD_TOKEN")
        if not token:
            raise ValueError("DISCORD_TOKEN not found in environment variables")
        return token
    
    @property
    def api_base_url(self) -> str:
        """后端API基础URL"""
        return os.getenv("API_BASE_URL", "http://localhost:8000")
    
    @property
    def api_username(self) -> str:
        """后端API用户名"""
        username = os.getenv("API_USERNAME")
        if not username:
            raise ValueError("API_USERNAME not found in environment variables")
        return username
    
    @property
    def api_password(self) -> str:
        """后端API密码"""
        password = os.getenv("API_PASSWORD")
        if not password:
            raise ValueError("API_PASSWORD not found in environment variables")
        return password
    
    @property
    def recording_save_path(self) -> Path:
        """录音文件保存路径"""
        path_str = os.getenv("RECORDING_SAVE_PATH", "./recordings/")
        path = Path(path_str)
        
        # 确保目录存在
        path.mkdir(parents=True, exist_ok=True)
        
        return path


# 全局配置实例
config = Config() 