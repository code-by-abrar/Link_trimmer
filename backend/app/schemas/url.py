from pydantic import BaseModel, HttpUrl
from datetime import datetime

from typing import Optional, Dict

class URLBase(BaseModel):
    original_url: str

class URLCreate(URLBase):
    expires_at: Optional[datetime] = None
    max_clicks: Optional[int] = None
    routing_config: Optional[Dict[str, str]] = None

class URLInfo(URLBase):
    short_key: str
    created_at: datetime
    expires_at: Optional[datetime]
    max_clicks: Optional[int]
    clicks_count: int
    routing_config: Optional[Dict[str, str]]

    class Config:
        from_attributes = True
