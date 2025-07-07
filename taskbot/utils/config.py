"""
Configuration Manager

Responsible for reading and managing environment variable configurations
"""

import os
from pathlib import Path


class Config:
    """Configuration management class"""
    
    def __init__(self) -> None:
        """Initialize configuration, load .env file"""
        self._load_env_file()
    
    def _load_env_file(self) -> None:
        """Load .env file"""
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
        """Backend API base URL"""
        return os.getenv("API_BASE_URL", "http://localhost:8000")
    
    @property
    def frontend_base_url(self) -> str:
        """Frontend base URL"""
        return os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    
    @property
    def api_username(self) -> str:
        """Backend API username"""
        username = os.getenv("API_USERNAME")
        if not username:
            raise ValueError("API_USERNAME not found in environment variables")
        return username
    
    @property
    def api_password(self) -> str:
        """Backend API password"""
        password = os.getenv("API_PASSWORD")
        if not password:
            raise ValueError("API_PASSWORD not found in environment variables")
        return password
    
    @property
    def recording_save_path(self) -> Path:
        """Recording file save path"""
        path_str = os.getenv("RECORDING_SAVE_PATH", "./recordings/")
        path = Path(path_str)
        
        # Ensure directory exists
        path.mkdir(parents=True, exist_ok=True)
        
        return path
    
    @property
    def openai_api_key(self) -> str:
        """OpenAI API key for speech-to-text and summarization"""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        return api_key
    
    @property
    def gemini_api_key(self) -> str:
        """Google Gemini API key for task generation"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        return api_key


# Global configuration instance
config = Config() 