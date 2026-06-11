from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.analytics import AnalyticsReport, AnalyticsSummary, TimeSeriesPoint
from app.core.worker import get_clickhouse_client
import datetime

router = APIRouter()

@router.get("/{short_key}", response_model=AnalyticsReport)
def get_url_analytics(short_key: str):
    client = get_clickhouse_client()
    if not client:
        raise HTTPException(status_code=503, detail="Analytics service unavailable")

    try:
        # 1. Basic Summary Metrics
        summary_query = """
            SELECT 
                count() as total_clicks,
                uniq(ip) as unique_clicks
            FROM clicks
            WHERE short_key = {key:String} AND is_bot = 0
        """
        summary_res = client.query(summary_query, parameters={'key': short_key})
        if not summary_res.result_rows:
             raise HTTPException(status_code=404, detail="No analytics found for this key")
        
        total_clicks, unique_clicks = summary_res.result_rows[0]

        # 2. Top Countries
        countries_query = """
            SELECT country_code, count() as count
            FROM clicks
            WHERE short_key = {key:String} AND is_bot = 0
            GROUP BY country_code
            ORDER BY count DESC
            LIMIT 10
        """
        countries_res = client.query(countries_query, parameters={'key': short_key})
        top_countries = {row[0]: row[1] for row in countries_res.result_rows}

        # 3. Top UTM Sources
        sources_query = """
            SELECT utm_source, count() as count
            FROM clicks
            WHERE short_key = {key:String} AND is_bot = 0 AND utm_source != ''
            GROUP BY utm_source
            ORDER BY count DESC
            LIMIT 10
        """
        sources_res = client.query(sources_query, parameters={'key': short_key})
        top_sources = {row[0]: row[1] for row in sources_res.result_rows}

        # 4. Top Referrers
        referrers_query = """
            SELECT referrer, count() as count
            FROM clicks
            WHERE short_key = {key:String} AND is_bot = 0
            GROUP BY referrer
            ORDER BY count DESC
            LIMIT 10
        """
        referrers_res = client.query(referrers_query, parameters={'key': short_key})
        top_referrers = {row[0]: row[1] for row in referrers_res.result_rows}

        # 5. Time Series (Last 24 Hours, hourly)
        ts_query = """
            SELECT 
                toStartOfHour(event_time) as hour,
                count() as count
            FROM clicks
            WHERE short_key = {key:String} AND is_bot = 0
                AND event_time > now() - INTERVAL 24 HOUR
            GROUP BY hour
            ORDER BY hour ASC
        """
        ts_res = client.query(ts_query, parameters={'key': short_key})
        time_series = [TimeSeriesPoint(time=row[0], clicks=row[1]) for row in ts_res.result_rows]

        return AnalyticsReport(
            short_key=short_key,
            summary=AnalyticsSummary(
                total_clicks=total_clicks,
                unique_clicks=unique_clicks,
                top_countries=top_countries,
                top_sources=top_sources,
                top_referrers=top_referrers
            ),
            time_series=time_series
        )

    except Exception as e:
        print(f"!!! ANALYTICS QUERY ERROR: {e} !!!", flush=True)
        raise HTTPException(status_code=500, detail=str(e))
