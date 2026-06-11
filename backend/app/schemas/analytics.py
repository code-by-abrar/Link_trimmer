from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class ClickEvent(BaseModel):
    event_time: datetime
    country_code: str
    referrer: str
    utm_source: Optional[str]
    utm_medium: Optional[str]
    utm_campaign: Optional[str]
    is_bot: bool

class AnalyticsSummary(BaseModel):
    total_clicks: int
    unique_clicks: int
    top_countries: Dict[str, int]
    top_sources: Dict[str, int]
    top_referrers: Dict[str, int]

class TimeSeriesPoint(BaseModel):
    time: datetime
    clicks: int

class AnalyticsReport(BaseModel):
    short_key: str
    summary: AnalyticsSummary
    time_series: List[TimeSeriesPoint]
