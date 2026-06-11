from sqlalchemy import Column, Integer, String, DateTime, JSON
from datetime import datetime
from app.db.session import Base

class URL(Base):
    __tablename__ = "urls"

    id = Column(Integer, primary_key=True, index=True)
    original_url = Column(String, index=True)
    short_key = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    max_clicks = Column(Integer, nullable=True)
    clicks_count = Column(Integer, default=0)
    routing_config = Column(JSON, nullable=True) # e.g., {"PK": "url1", "US": "url2"}
