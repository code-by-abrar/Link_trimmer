from fastapi import Request, HTTPException
from app.db.redis import redis_client
import time

# Rate limit configuration: 20 requests per minute per IP
RATE_LIMIT = 20
WINDOW_SIZE = 60 # seconds

async def rate_limit_middleware(request: Request, call_next):
    # Skip rate limiting for root or docs if needed
    if request.url.path in ["/", "/docs", "/redoc", "/openapi.json"]:
        return await call_next(request)

    client_host = request.client.host if request.client else "127.0.0.1"
    client_ip = client_host
    # In production, use X-Forwarded-For if behind a proxy
    # client_ip = request.headers.get("X-Forwarded-For", client_host)

    key = f"rate_limit:{client_ip}"

    try:
        # Simple Fixed Window Rate Limiting using Redis
        current_requests = redis_client.get(key)
        
        if current_requests and int(current_requests) >= RATE_LIMIT:
            print(f"!!! RATE LIMIT EXCEEDED for IP: {client_ip} !!!", flush=True)
            raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")

        # Increment and set expiry if it's a new key
        pipe = redis_client.pipeline()
        pipe.incr(key)
        if not current_requests:
            pipe.expire(key, WINDOW_SIZE)
        pipe.execute()

    except HTTPException:
        raise
    except Exception as e:
        print(f"!!! Redis Rate Limit Error: {e} !!!", flush=True)
        # Fail open: if Redis is down, allow the request but log it
    
    response = await call_next(request)
    return response
