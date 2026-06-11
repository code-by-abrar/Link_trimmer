import re
from fastapi import Request

# Known bot User-Agent patterns
BOT_PATTERNS = [
    r"googlebot", r"bingbot", r"yandexbot", r"ahrefsbot", r"baiduspider",
    r"python-requests", r"scrapy", r"curl", r"wget", r"postman"
]

def is_bot(request: Request) -> bool:
    user_agent = request.headers.get("User-Agent", "").lower()
    if not user_agent:
        return True # Many simple bots don't send User-Agent
    
    for pattern in BOT_PATTERNS:
        if re.search(pattern, user_agent):
            return True
    return False

def is_suspicious_url(url: str) -> bool:
    """
    Basic heuristic check for malicious patterns without external APIs.
    """
    # 1. Check if URL contains IP address instead of domain
    ip_pattern = r"(\d{1,3}\.){3}\d{1,3}"
    if re.search(ip_pattern, url):
        return True
    
    # 2. Check for suspicious keywords in the URL
    suspicious_keywords = ["login", "verify", "banking", "secure", "update-password", "account-fixed"]
    url_lower = url.lower()
    for kw in suspicious_keywords:
        if kw in url_lower:
            # Note: This is a loose check, might need more refined logic
            # to avoid blocking legitimate URLs like 'secure-banking.com'
            pass 

    # 3. Check for excessive subdomains (common in phishing)
    if url.count('.') > 4:
        return True

    return False
