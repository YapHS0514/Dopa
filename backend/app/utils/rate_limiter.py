from collections import defaultdict
import time
from typing import Dict
from fastapi import Request
from fastapi.responses import JSONResponse

class RateLimiter:
    def __init__(self, rate_limit: int = 100, time_window: int = 60):
        self.rate_limit = rate_limit
        self.time_window = time_window
        self.requests: Dict[str, list] = defaultdict(list)
    
    def is_rate_limited(self, client_id: str) -> bool:
        now = time.time()
        # Remove old requests
        self.requests[client_id] = [req_time for req_time in self.requests[client_id] 
                                  if now - req_time < self.time_window]
        
        # Check if rate limit is exceeded
        if len(self.requests[client_id]) >= self.rate_limit:
            return True
        
        # Add new request
        self.requests[client_id].append(now)
        return False

rate_limiter = RateLimiter(rate_limit=100, time_window=60)

async def rate_limit_middleware(request: Request, call_next):
    client_id = request.client.host if request.client else "unknown"
    
    if rate_limiter.is_rate_limited(client_id):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    
    return await call_next(request) 