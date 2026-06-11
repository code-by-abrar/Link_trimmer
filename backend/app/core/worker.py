from celery import Celery  # type: ignore
import os
import clickhouse_connect  # type: ignore
from app.db.session import SessionLocal
from app.models.url import URL
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "pyamqp://guest:guest@localhost:5672//")
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "localhost")
CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", "8123"))
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "")

celery_app = Celery(
    "worker",
    broker=RABBITMQ_URL,
    backend="rpc://",
    include=["app.core.worker"]
)

# Initialize ClickHouse Client
def get_clickhouse_client():
    try:
        return clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            username=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD
        )
    except Exception as e:
        print(f"!!! CLICKHOUSE CONNECTION ERROR: {e} !!!", flush=True)
        return None

@celery_app.task(name="app.core.worker.log_analytics_to_tsdb")
def log_analytics_to_tsdb(data: dict):
    from datetime import datetime
    client = get_clickhouse_client()
    if not client:
        return

    try:
        # Convert string back to datetime object for ClickHouse
        if isinstance(data.get('event_time'), str):
            data['event_time'] = datetime.fromisoformat(data['event_time'])

        # Ensure table exists (In production, do this in a migration/setup script)
        client.command("""
            CREATE TABLE IF NOT EXISTS clicks (
                event_time DateTime64(3, 'UTC'),
                short_key String,
                original_url String,
                country_code LowCardinality(String),
                referrer String,
                ua String,
                utm_source String,
                utm_medium String,
                utm_campaign String,
                ip String,
                is_bot UInt8
            ) ENGINE = MergeTree()
            ORDER BY (short_key, event_time)
        """)
        
        # Prepare data for insertion (ClickHouse expects a list of tuples/lists)
        # The order must match the table schema if column_names is not used, 
        # but here we use column_names for safety.
        columns = [
            'event_time', 'short_key', 'original_url', 'country_code', 
            'referrer', 'ua', 'utm_source', 'utm_medium', 'utm_campaign', 
            'ip', 'is_bot'
        ]
        
        row = [data.get(col) for col in columns]
        client.insert('clicks', [row], column_names=columns)
        print(f"!!! ANALYTICS LOGGED: {data['short_key']} !!!", flush=True)
    except Exception as e:
        print(f"!!! CLICKHOUSE INSERT ERROR: {e} !!!", flush=True)

@celery_app.task(name="app.core.worker.log_click_to_db")
def log_click_to_db(short_key: str):
    print(f"!!! CELERY RECEIVED TASK: log_click_to_db for {short_key} !!!", flush=True)
    db = SessionLocal()
    try:
        db_url = db.query(URL).filter(URL.short_key == short_key).first()
        if db_url:
            db_url.clicks_count += 1  # type: ignore
            db.commit()
    finally:
        db.close()

from typing import Optional

@celery_app.task(name="app.core.worker.create_url_in_db")
def create_url_in_db(original_url: str, short_key: str, expires_at: Optional[str] = None, max_clicks: Optional[int] = None, routing_config: Optional[dict] = None):
    from datetime import datetime
    print(f"!!! CELERY WORKER: Starting save task for URL: {original_url} (Key: {short_key}) !!!", flush=True)
    db = SessionLocal()
    try:
        # Convert string back to datetime if it exists
        expiry_dt = None
        if expires_at:
            expiry_dt = datetime.fromisoformat(expires_at)

        # Prevent duplicate keys
        existing_url = db.query(URL).filter(URL.short_key == short_key).first()
        if not existing_url:
            db_url = URL(
                original_url=original_url,
                short_key=short_key,
                expires_at=expiry_dt,
                max_clicks=max_clicks,
                routing_config=routing_config
            )
            db.add(db_url)
            db.commit()
            print(f"!!! CELERY WORKER: Successfully saved URL to DB. Key: {short_key} !!!", flush=True)
        else:
            print(f"!!! CELERY WORKER: URL key {short_key} already exists in DB !!!", flush=True)
    except Exception as e:
        print(f"!!! CELERY WORKER ERROR: {e} !!!", flush=True)
        db.rollback()
    finally:
        db.close()
