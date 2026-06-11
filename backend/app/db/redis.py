import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Create a Redis client
# decode_responses=True ensures we get strings instead of bytes
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_redis():
    return redis_client
