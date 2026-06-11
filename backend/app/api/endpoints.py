from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
# pyrefly: ignore [missing-import]
import validators  

from app.db.session import get_db
from app.db.redis import redis_client
from app.models.url import URL
from app.schemas.url import URLCreate, URLInfo
from datetime import datetime
from app.utils.id_gen import generate_distributed_key
from app.core.worker import log_click_to_db, create_url_in_db

router = APIRouter()

CACHE_TTL = 86400  # 24 hours in seconds

from app.utils.security import is_suspicious_url

from app.db.session import SessionLocal

@router.post("/shorten", response_model=URLInfo)
def shorten_url(url_in: URLCreate, db: Session = Depends(get_db)):
    print(f"!!! RECEIVED SHORTEN REQUEST FOR URL: {url_in.original_url} !!!", flush=True)
    if not validators.url(url_in.original_url):
        print(f"!!! ERROR: Invalid URL provided: {url_in.original_url} !!!", flush=True)
        raise HTTPException(status_code=400, detail="Invalid URL provided")

    # Basic Malicious URL Scan (Heuristics)
    if is_suspicious_url(url_in.original_url):
        print(f"!!! SECURITY ALERT: Suspicious URL blocked: {url_in.original_url} !!!", flush=True)
        raise HTTPException(status_code=400, detail="URL flagged as suspicious or malicious.")

    # Check if URL already exists in DB
    existing_url = db.query(URL).filter(URL.original_url == url_in.original_url).first()
    if existing_url:
        print(f"!!! INFO: URL already exists in DB with key: {existing_url.short_key} !!!", flush=True)
        return existing_url

    # Distributed ID Generation using Snowflake + Base62
    short_key = generate_distributed_key()
    print(f"!!! GENERATED SHORT KEY: {short_key} !!!", flush=True)

    # Synchronous save to DB (Fixed for when Celery/Redis is down)
    try:
        db_url = URL(
            original_url=url_in.original_url,
            short_key=short_key,
            expires_at=url_in.expires_at,
            max_clicks=url_in.max_clicks,
            routing_config=url_in.routing_config
        )
        db.add(db_url)
        db.commit()
        db.refresh(db_url)
        print(f"!!! SUCCESS: Saved URL to DB synchronously. Key: {short_key} !!!", flush=True)
    except Exception as e:
        print(f"!!! DB Save Error: {e} !!!", flush=True)
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to save URL to database.")

    # Try to warm cache but don't fail if Redis is down
    try:
        redis_client.setex(f"url:{short_key}", CACHE_TTL, url_in.original_url)
    except:
        pass

    return db_url

@router.get("/urls", response_model=List[URLInfo])
def list_urls(db: Session = Depends(get_db)):
    return db.query(URL).all()
