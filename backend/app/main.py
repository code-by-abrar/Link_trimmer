from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List
import logging

from app.api.endpoints import router
from app.api.analytics import router as analytics_router
from app.db.session import engine, Base, SessionLocal
from app.models.url import URL
from app.core.worker import log_click_to_db, log_analytics_to_tsdb
from app.db.redis import redis_client

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

from app.core.rate_limit import rate_limit_middleware

app = FastAPI(title="URL Shortener API")
logger.info("API Started Successfully")

# Add Rate Limiting Middleware
@app.middleware("http")
async def add_rate_limit(request: Request, call_next):
    return await rate_limit_middleware(request, call_next)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1/analytics", tags=["analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the URL Shortener API"}

@app.get("/debug/ping")
def debug_ping():
    print("!!! DEBUG PING HIT !!!", flush=True)
    return {"status": "success", "message": "pong"}

import geoip2.database  # type: ignore
import os

from typing import List, Optional

# ... (rest of imports)

# Path to the MaxMind GeoLite2 Country database
GEOIP_DB_PATH = os.path.join("app", "utils", "GeoLite2-Country.mmdb")

def get_country_from_ip(ip_address: str) -> Optional[str]:
    if not os.path.exists(GEOIP_DB_PATH):
        print(f"!!! GeoIP DB not found at {GEOIP_DB_PATH} !!!", flush=True)
        return None
    
    try:
        with geoip2.database.Reader(GEOIP_DB_PATH) as reader:
            response = reader.country(ip_address)
            return str(response.country.iso_code)
    except Exception as e:
        print(f"!!! GeoIP Error for IP {ip_address}: {e} !!!", flush=True)
        return None

from app.utils.security import is_bot

@app.get("/debug/celery-test")
async def test_celery():
    print("!!! DEBUG: ATTEMPTING TO TRIGGER TEST TASK !!!", flush=True)
    try:
        from app.core.worker import celery_app
        broker_url = celery_app.conf.broker_url
        print(f"!!! DEBUG: Celery thinks broker is: {broker_url} !!!", flush=True)
        
        result = log_click_to_db.delay("debug_test_key")
        print(f"!!! DEBUG: Task dispatched! Task ID: {result.id} !!!", flush=True)
        return {
            "status": "task_sent", 
            "task_id": result.id,
            "broker_used": broker_url
        }
    except Exception as e:
        print(f"!!! DEBUG: DISPATCH ERROR: {e} !!!", flush=True)
        return {"status": "error", "message": str(e)}

@app.get("/{short_key}")
async def redirect_to_url(short_key: str, request: Request):
    from datetime import datetime
    print(f"!!! REDIRECT REQUEST: {short_key} !!!", flush=True)

    # 0. Detect Real IP (Handle Proxy/Docker)
    client_host = request.client.host if request.client else "127.0.0.1"
    client_ip = request.headers.get("X-Forwarded-For", client_host)
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
    
    # FOR TESTING: If on localhost, allow simulating an IP via query param
    # e.g., ?sim_ip=1.1.1.1 (Australia)
    sim_ip = request.query_params.get("sim_ip")
    if sim_ip:
        client_ip = sim_ip
        print(f"!!! SIMULATING IP: {client_ip} !!!", flush=True)

    # 1. Geo & Bot Detection
    country_code = get_country_from_ip(client_ip)
    bot_detected = is_bot(request)
    
    db = SessionLocal()
    try:
        db_url = db.query(URL).filter(URL.short_key == short_key).first()
        if not db_url:
            raise HTTPException(status_code=404, detail="URL not found")
        
        # 2. Expiration Checks
        if db_url.expires_at and datetime.utcnow() > db_url.expires_at:
            raise HTTPException(status_code=410, detail="This link has expired.")

        click_key = f"clicks:{short_key}"
        try:
            current_clicks_raw = redis_client.get(click_key)
            current_clicks: int = 0
            if current_clicks_raw is None:
                current_clicks = int(db_url.clicks_count)
                redis_client.set(click_key, current_clicks)
            else:
                current_clicks = int(current_clicks_raw)

            if db_url.max_clicks and current_clicks >= db_url.max_clicks:
                raise HTTPException(status_code=410, detail="This link has reached its click limit.")
            
            redis_client.incr(click_key)
        except Exception as e:
            if isinstance(e, HTTPException): raise
            print(f"!!! Redis Counter Error: {e} !!!", flush=True)

        # 3. Geo-targeting Logic
        target_url = str(db_url.original_url)
        if db_url.routing_config and country_code:
            routing = db_url.routing_config
            if isinstance(routing, dict) and country_code in routing:
                target_url = str(routing[country_code])
                print(f"!!! GEO-ROUTING MATCHED [{country_code}]: {target_url} !!!", flush=True)

        # 4. Analytics Logging (Async)
        analytics_data = {
            "event_time": datetime.utcnow().isoformat(), # Convert to string for JSON serialization
            "short_key": short_key,
            "original_url": str(db_url.original_url),
            "country_code": country_code or "Unknown",
            "referrer": request.headers.get("Referer", "Direct"),
            "ua": request.headers.get("User-Agent", ""),
            "utm_source": request.query_params.get("utm_source", ""),
            "utm_medium": request.query_params.get("utm_medium", ""),
            "utm_campaign": request.query_params.get("utm_campaign", ""),
            "ip": client_ip,
            "is_bot": 1 if bot_detected else 0
        }
        log_analytics_to_tsdb.delay(analytics_data)
        log_click_to_db.delay(short_key)

        return RedirectResponse(url=target_url)
    finally:
        db.close()
