"""
Timezone management utilities for AI Society Dashboard

This module provides timezone conversion and management functions
to handle timezone differences between database (UTC) and application logic.
"""

from datetime import datetime, timezone, date
import pytz
from typing import Optional
from app.core.config import settings


class TimezoneManager:
    """Timezone management utility class"""
    
    @staticmethod
    def get_default_tz() -> pytz.BaseTzInfo:
        """Get project default timezone"""
        return settings.get_default_timezone()
    
    @staticmethod
    def get_utc_tz() -> pytz.BaseTzInfo:
        """Get UTC timezone"""
        return pytz.UTC
    
    @staticmethod
    def now_utc() -> datetime:
        """Get current UTC time"""
        return datetime.now(pytz.UTC)
    
    @staticmethod
    def now_local() -> datetime:
        """Get current local time (project default timezone)"""
        return datetime.now(settings.get_default_timezone())
    
    @staticmethod
    def to_utc(dt: datetime, from_tz: Optional[str] = None) -> datetime:
        """Convert local time to UTC time
        
        Args:
            dt: datetime object to convert
            from_tz: source timezone string, if None uses project default
            
        Returns:
            datetime in UTC timezone
        """
        if dt.tzinfo is None:
            # If no timezone info, assume project default timezone
            source_tz = pytz.timezone(from_tz) if from_tz else settings.get_default_timezone()
            dt = source_tz.localize(dt)
        return dt.astimezone(pytz.UTC)
    
    @staticmethod
    def to_local(dt: datetime, to_tz: Optional[str] = None) -> datetime:
        """Convert UTC time to local time
        
        Args:
            dt: datetime object to convert (assumed UTC if no timezone)
            to_tz: target timezone string, if None uses project default
            
        Returns:
            datetime in target timezone
        """
        if dt.tzinfo is None:
            # If no timezone info, assume UTC
            dt = pytz.UTC.localize(dt)
        
        target_tz = pytz.timezone(to_tz) if to_tz else settings.get_default_timezone()
        return dt.astimezone(target_tz)
    
    @staticmethod
    def get_date_in_timezone(dt: datetime, tz: Optional[str] = None) -> date:
        """Get date in specified timezone
        
        Args:
            dt: datetime object
            tz: timezone string, if None uses project default
            
        Returns:
            date object in target timezone
        """
        target_tz = pytz.timezone(tz) if tz else settings.get_default_timezone()
        if dt.tzinfo is None:
            dt = pytz.UTC.localize(dt)
        local_dt = dt.astimezone(target_tz)
        return local_dt.date()
    
    @staticmethod
    def format_local_time(dt: datetime, fmt: str = '%Y-%m-%d %H:%M:%S %Z', tz: Optional[str] = None) -> str:
        """Format datetime as local time string
        
        Args:
            dt: datetime object to format
            fmt: format string
            tz: target timezone, if None uses project default
            
        Returns:
            formatted time string
        """
        local_dt = TimezoneManager.to_local(dt, tz)
        return local_dt.strftime(fmt)


# Convenience instance
tz = TimezoneManager() 