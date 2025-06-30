from collections import defaultdict
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, rate_limit: int = 100, time_window: int = 60):
        self.rate_limit = rate_limit
        self.time_window = time_window
        self.requests: Dict[str, list] = defaultdict(list)
        self.user_requests: Dict[str, list] = defaultdict(list)
    
    def is_rate_limited(self, client_id: str, user_id: Optional[str] = None) -> bool:
        now = time.time()
        
        # Clean old requests for client
        self.requests[client_id] = [req_time for req_time in self.requests[client_id] 
                                  if now - req_time < self.time_window]
        
        # Check client-based rate limit
        if len(self.requests[client_id]) >= self.rate_limit:
            logger.warning(f"Rate limit exceeded for client {client_id}")
            return True
        
        # If user is authenticated, apply user-specific limits
        if user_id:
            # Clean old requests for user
            self.user_requests[user_id] = [req_time for req_time in self.user_requests[user_id] 
                                         if now - req_time < self.time_window]
            
            # Higher limit for authenticated users
            user_limit = self.rate_limit * 2
            if len(self.user_requests[user_id]) >= user_limit:
                logger.warning(f"User rate limit exceeded for user {user_id}")
                return True
            
            # Add request to user tracking
            self.user_requests[user_id].append(now)
        
        # Add request to client tracking
        self.requests[client_id].append(now)
        return False
    
    def get_remaining_requests(self, client_id: str, user_id: Optional[str] = None) -> int:
        now = time.time()
        
        # Clean old requests
        self.requests[client_id] = [req_time for req_time in self.requests[client_id] 
                                  if now - req_time < self.time_window]
        
        if user_id:
            self.user_requests[user_id] = [req_time for req_time in self.user_requests[user_id] 
                                         if now - req_time < self.time_window]
            user_limit = self.rate_limit * 2
            return max(0, user_limit - len(self.user_requests[user_id]))
        
        return max(0, self.rate_limit - len(self.requests[client_id]))

# Different rate limiters for different endpoints
rate_limiter = RateLimiter(rate_limit=100, time_window=60)  # General API
auth_rate_limiter = RateLimiter(rate_limit=10, time_window=300)  # Auth endpoints (5 min window)
content_rate_limiter = RateLimiter(rate_limit=200, time_window=60)  # Content endpoints

async def rate_limit_middleware(request: Request, call_next):
    client_id = request.client.host if request.client else "unknown"
    
    # Extract user ID from auth header if available
    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # You could decode the JWT here to get user_id
        # For now, we'll use a simple approach
        user_id = request.headers.get("X-User-ID")  # If you add this header
    
    # Choose appropriate rate limiter based on endpoint
    limiter = rate_limiter
    if request.url.path.startswith("/api/auth"):
        limiter = auth_rate_limiter
    elif request.url.path.startswith("/api/contents") or request.url.path.startswith("/api/interactions"):
        limiter = content_rate_limiter
    
    if limiter.is_rate_limited(client_id, user_id):
        remaining = limiter.get_remaining_requests(client_id, user_id)
        return JSONResponse(
            status_code=429,
            content={
                "detail": "Too many requests. Please try again later.",
                "remaining_requests": remaining,
                "reset_time": limiter.time_window
            },
            headers={
                "Retry-After": str(limiter.time_window),
                "X-RateLimit-Remaining": str(remaining),
                "X-RateLimit-Reset": str(int(time.time()) + limiter.time_window)
            }
        )
    
    response = await call_next(request)
    
    # Add rate limit headers to response
    remaining = limiter.get_remaining_requests(client_id, user_id)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Limit"] = str(limiter.rate_limit)
    
    return response