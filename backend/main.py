from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, UUID4, Field
from typing import List, Optional, Dict, Any, Callable, TypedDict
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx
from datetime import datetime
from enum import Enum
from fastapi import Request
from collections import defaultdict
import time
from fastapi.responses import JSONResponse
import logging
import traceback

# Type definitions
class SupabaseResponse(TypedDict):
    data: List[Dict[str, Any]]
    error: Optional[Dict[str, Any]]

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
project_ref = os.getenv("SUPABASE_PROJECT_REF")

# Request logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Debug logging for environment variables
logger.info("Environment variables check:")
logger.info(f"SUPABASE_URL: {'Present' if supabase_url else 'Missing'}")
logger.info(f"SUPABASE_ANON_KEY: {'Present' if supabase_anon_key else 'Missing'}")
logger.info(f"SUPABASE_SERVICE_ROLE_KEY: {'Present' if supabase_service_key else 'Missing'}")
logger.info(f"SUPABASE_PROJECT_REF: {'Present' if project_ref else 'Missing'}")

if not all([supabase_url, supabase_anon_key]):
    raise ValueError("Missing required Supabase environment variables")

logger.info(f"Initializing Supabase client for project: {project_ref}")
try:
    supabase = create_client(supabase_url, supabase_anon_key)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Supabase client: {str(e)}")
    raise

try:
    if supabase_service_key:
        logger.info("Initializing Supabase admin client with service role key")
        supabase_admin = create_client(supabase_url, supabase_service_key)
        logger.info("Supabase admin client initialized successfully")
    else:
        logger.warning("No service role key provided - admin operations will not be available")
        supabase_admin = None
except Exception as e:
    logger.error(f"Error initializing Supabase admin client: {str(e)}")
    raise

# Initialize FastAPI app
app = FastAPI(title="MicroLearn API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Security
security = HTTPBearer()

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    id: str
    email: str
    access_token: str
    role: UserRole = UserRole.USER
    metadata: Dict[str, Any] = {}

# Enhanced user dependency with role checking
async def get_current_user(request: Request) -> User:
    """Get the current user from the session"""
    try:
        # Get the authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Extract the token
        token = auth_header.split(" ")[1]
        
        # Get user from Supabase
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Return user with access token
        return User(
            id=response.user.id,
            email=response.user.email,
            access_token=token,
            role=response.user.user_metadata.get("role", UserRole.USER),
            metadata=response.user.user_metadata
        )
    except Exception as e:
        logger.error(f"Error getting current user: {str(e)}")
        raise HTTPException(status_code=401, detail="Not authenticated")

def require_role(required_role: UserRole) -> Callable:
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Operation requires {required_role} role"
            )
        return user
    return role_checker

# Rate limiting
from fastapi import Request
from collections import defaultdict

# Simple in-memory rate limiting
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

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_id = request.client.host if request.client else "unknown"
    
    if rate_limiter.is_rate_limited(client_id):
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again later."}
        )
    
    return await call_next(request)



@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info(
        f"Method: {request.method} Path: {request.url.path} "
        f"Status: {response.status_code} Duration: {duration:.2f}s"
    )
    
    return response

# Pydantic models
class UserInteractionRequest(BaseModel):
    content_id: str
    interaction_type: str  # 'like', 'dislike', 'save', 'view'
    interaction_value: int

class ContentRequest(BaseModel):
    title: str
    summary: str
    content_type: str = "text"
    topic_id: Optional[str] = None
    tags: List[str] = []
    difficulty_level: int = 1
    estimated_read_time: int = 30

class TopicPreferenceUpdate(BaseModel):
    topic_id: UUID4
    points: int = Field(ge=0, le=100)  # Points must be between 0 and 100

class UserTopicPreference(BaseModel):
    topic_id: str
    points: int = 50

    class Config:
        json_schema_extra = {
            "example": {
                "topic_id": "123e4567-e89b-12d3-a456-426614174000",
                "points": 50
            }
        }

@app.get("/")
async def root():
    return {"message": "MicroLearn API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "Backend is accessible"}

@app.get("/ping")
async def ping():
    """Test endpoint to verify backend is accessible"""
    logger.info("Ping endpoint hit!")
    return {"message": "pong"}

# Content endpoints
@app.get("/api/contents")
async def get_contents(
    limit: int = 20,
    offset: int = 0,
    topic_id: Optional[str] = None,
    user=Depends(get_current_user)
):
    """Get paginated content with optional topic filtering"""
    try:
        query = supabase.table("contents").select("""
            *,
            topics (
                id,
                name,
                color,
                icon
            )
        """)
        
        if topic_id:
            query = query.eq("topic_id", topic_id)
            
        response = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return {
            "data": response.data,
            "count": len(response.data),
            "offset": offset,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/contents")
async def create_content(
    content: ContentRequest,
    user: User = Depends(require_role(UserRole.ADMIN))
):
    """Create new content (admin only)"""
    try:
        # Validate content data
        if not content.title or not content.summary:
            raise HTTPException(status_code=400, detail="Title and summary are required")
        
        if content.difficulty_level not in range(1, 6):
            raise HTTPException(status_code=400, detail="Difficulty level must be between 1 and 5")
        
        # Create content using admin client to bypass RLS
        response = supabase_admin.table("contents").insert({
            "title": content.title,
            "summary": content.summary,
            "content_type": content.content_type,
            "topic_id": content.topic_id,
            "tags": content.tags,
            "difficulty_level": content.difficulty_level,
            "estimated_read_time": content.estimated_read_time,
            "ai_generated": True,
            "created_by": user.id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create content")
        
        return {
            "data": response.data[0],
            "message": "Content created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# User interaction endpoints
@app.post("/api/interactions")
async def record_interaction(
    interaction: UserInteractionRequest,
    user=Depends(get_current_user)
):
    """Record user interaction with content"""
    try:
        response = supabase.table("user_interactions").insert({
            "user_id": user.id,
            "content_id": interaction.content_id,
            "interaction_type": interaction.interaction_type,
            "interaction_value": interaction.interaction_value
        }).execute()
        
        return {"data": response.data[0], "message": "Interaction recorded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/interactions/stats")
async def get_user_stats(user=Depends(get_current_user)):
    """Get user interaction statistics"""
    try:
        # Get user interactions
        interactions_response = supabase.table("user_interactions").select("interaction_type").eq("user_id", user.id).execute()
        
        interactions = interactions_response.data
        stats = {
            "total_interactions": len(interactions),
            "likes_count": len([i for i in interactions if i["interaction_type"] == "like"]),
            "saves_count": len([i for i in interactions if i["interaction_type"] == "save"]),
            "views_count": len([i for i in interactions if i["interaction_type"] == "view"])
        }
        
        return {"data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Topic endpoints
@app.get("/api/topics")
async def get_topics():
    """Get all available topics"""
    try:
        logger.info("Attempting to fetch topics from Supabase...")
        
        # First check if we can access the table
        count_response = supabase.table("topics").select("id").execute()
        logger.info(f"Topics count response: {count_response}")
        
        # Get all topics
        response = supabase.table("topics").select("*").execute()
        logger.info(f"Raw Supabase response: {response}")
        
        if not response.data:
            logger.warning("No topics found in database")
            return []
            
        logger.info(f"Response data: {response.data}")
        return response.data
        
    except Exception as e:
        logger.error(f"Error fetching topics: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch topics: {str(e)}"
        )

@app.get("/api/user/preferences")
async def get_user_preferences(user=Depends(get_current_user)):
    """Get user topic preferences"""
    try:
        response = supabase.table("user_topic_preferences").select("""
            *,
            topics (
                id,
                name,
                color,
                icon
            )
        """).eq("user_id", user.id).order("points", desc=True).execute()
        
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_supabase_client_for_user(access_token: str) -> Client:
    return create_client(supabase_url, access_token)

@app.post("/api/user/preferences")
async def update_user_preferences(
    preferences: List[UserTopicPreference],
    user: User = Depends(get_current_user)
):
    """Update user's topic preferences"""
    try:
        logger.info(f"Received preferences update request for user {user.id}")
        logger.info(f"Received preferences: {preferences}")

        if not supabase_admin:
            raise HTTPException(
                status_code=500,
                detail="Service role key not configured"
            )

        # Delete existing preferences using admin client
        delete_response = supabase_admin.table("user_topic_preferences").delete().eq("user_id", user.id).execute()
        logger.info(f"Deleted existing preferences: {delete_response}")

        # Insert new preferences using admin client
        for pref in preferences:
            logger.info(f"Processing preference: {pref}")
            try:
                response = supabase_admin.table("user_topic_preferences").insert({
                    "user_id": user.id,
                    "topic_id": pref.topic_id,
                    "points": pref.points
                }).execute()
                logger.info(f"Insert response for topic {pref.topic_id}: {response}")
            except Exception as e:
                logger.error(f"Error updating preference for topic {pref.topic_id}: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Error updating preference: {str(e)}"
                )

        onboarding_response = supabase_admin.table("profiles").update({
            "onboarding_completed": True
        }).eq("user_id", user.id).execute()
        logger.info(f"Onboarding response: {onboarding_response}")

        return {"message": "Preferences updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_user_preferences: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update preferences: {str(e)}"
        )

# Saved content endpoints
@app.get("/api/saved")
async def get_saved_content(user=Depends(get_current_user)):
    """Get user's saved content"""
    try:
        response = supabase.table("saved_contents").select("""
            id,
            created_at,
            contents (
                id,
                title,
                summary,
                content_type,
                tags,
                difficulty_level,
                estimated_read_time,
                topics (
                    id,
                    name,
                    color,
                    icon
                )
            )
        """).eq("user_id", user.id).order("created_at", desc=True).execute()
        
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/saved")
async def save_content(
    content_id: str,
    user=Depends(get_current_user)
):
    """Save content for user"""
    try:
        response = supabase.table("saved_contents").insert({
            "user_id": user.id,
            "content_id": content_id
        }).execute()
        
        return {"data": response.data[0], "message": "Content saved successfully"}
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(status_code=409, detail="Content already saved")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/saved/{saved_content_id}")
async def remove_saved_content(
    saved_content_id: str,
    user=Depends(get_current_user)
):
    """Remove saved content"""
    try:
        response = supabase.table("saved_contents").delete().eq("id", saved_content_id).eq("user_id", user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Saved content not found")
            
        return {"message": "Content removed from saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Recommendation endpoint
@app.get("/api/recommendations")
async def get_recommendations(
    limit: int = 10,
    user=Depends(get_current_user)
):
    """Get personalized content recommendations"""
    try:
        # Get user preferences
        # Ensure your supabase client is authenticated with the user's access token
        supabase.postgrest.auth(user.access_token)  # ✅ Best for request-scoped auth

        # Now the RLS context will be active
        prefs_response = supabase.table("user_topic_preferences")\
            .select("topic_id, preference_score")\
            .eq("user_id", user.id)\
            .execute()
        logger.info(f"User ID: {user.id}, type: {type(user.id)}")
        logger.info(f"Prefs_response: {prefs_response}")

        if not prefs_response.data:
            # No preferences yet, return general content
            response = supabase.table("contents").select("""
                *,
                topics (
                    id,
                    name,
                    color,
                    icon
                )
            """).order("created_at", desc=True).limit(limit).execute()
            logger.info(f"No Pref_response der Response: {response.data}")
        else:
            # Get content based on preferences
            preferred_topics = [pref["topic_id"] for pref in prefs_response.data if pref["preference_score"] > 0.3]
            logger.info(f"Preferred topics: {preferred_topics}")

            if preferred_topics:
                response = supabase.table("contents").select("""
                    *,
                    topics (
                        id,
                        name,
                        color,
                        icon
                    )
                """).in_("topic_id", preferred_topics).order("created_at", desc=True).limit(limit).execute()
                logger.info(f"Response: {response.data}")
            else:
                response = supabase.table("contents").select("""
                    *,
                    topics (
                        id,
                        name,
                        color,
                        icon
                    )
                """).order("created_at", desc=True).limit(limit).execute()
        
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/user/onboarding-complete")
async def complete_onboarding(user: User = Depends(get_current_user)):
    """Mark user's onboarding as complete"""
    try:
        logger.info(f"Marking onboarding complete for user {user.id}")
        
        if not supabase_admin:
            raise HTTPException(
                status_code=500,
                detail="Service role key not configured"
            )

        # Update the user's profile to mark onboarding as complete
        response = supabase_admin.table("profiles").update({
            "onboarding_completed": True
        }).eq("user_id", user.id).execute()
        
        logger.info(f"Onboarding complete response: {response}")
        
        # Check if there was an error in the response
        if hasattr(response, 'error') and response.error:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to update onboarding status: {response.error}"
            )

        # Verify the update was successful
        if not response.data:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )

        return {"message": "Onboarding completed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing onboarding: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete onboarding: {str(e)}"
        )

if __name__ == "__main__":
    from fastapi import FastAPI
    import uvicorn

    app = FastAPI()

    @app.get("/")
    def read_root():
        return {"Hello": "World"}

    uvicorn.run(app, host="0.0.0.0", port=8000)