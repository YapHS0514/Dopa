from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(title="MicroLearn API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not all([supabase_url, supabase_anon_key]):
    raise ValueError("Missing Supabase environment variables")

supabase: Client = create_client(supabase_url, supabase_anon_key)
supabase_admin: Client = create_client(supabase_url, supabase_service_key) if supabase_service_key else None

# Security
security = HTTPBearer()

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
    topic_id: str
    points: int

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify the JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid authentication token")
        return user.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

# Optional dependency to get current user (returns None if not authenticated)
async def optional_get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))):
    if not credentials:
        return None
    try:
        # Verify the JWT token with Supabase
        user = supabase.auth.get_user(credentials.credentials)
        if not user:
            return None
        return user.user
    except Exception as e:
        return None

@app.get("/")
async def root():
    return {"message": "MicroLearn API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Content endpoints
@app.get("/api/contents")
async def get_contents(
    limit: int = 20,
    offset: int = 0,
    topic_id: Optional[str] = None,
    user=Depends(optional_get_current_user)
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
    user=Depends(get_current_user)
):
    """Create new content (admin only)"""
    try:
        response = supabase.table("contents").insert({
            "title": content.title,
            "summary": content.summary,
            "content_type": content.content_type,
            "topic_id": content.topic_id,
            "tags": content.tags,
            "difficulty_level": content.difficulty_level,
            "estimated_read_time": content.estimated_read_time,
            "ai_generated": True
        }).execute()
        
        return {"data": response.data[0], "message": "Content created successfully"}
    except Exception as e:
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
        response = supabase.table("topics").select("*").order("name").execute()
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

@app.post("/api/user/preferences")
async def update_user_preferences(
    preferences: List[TopicPreferenceUpdate],
    user=Depends(get_current_user)
):
    """Update user topic preferences"""
    try:
        for pref in preferences:
            supabase.table("user_topic_preferences").upsert({
                "user_id": user.id,
                "topic_id": pref.topic_id,
                "points": pref.points,
                "preference_score": min(1.0, max(0.0, pref.points / 100.0))
            }).execute()
        
        return {"message": "Preferences updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    user=Depends(optional_get_current_user)
):
    """Get personalized content recommendations"""
    try:
        if not user:
            # No user logged in, return general content
            response = supabase.table("contents").select("""
                *,
                topics (
                    id,
                    name,
                    color,
                    icon
                )
            """).order("created_at", desc=True).limit(limit).execute()
        else:
            # Get user preferences
            prefs_response = supabase.table("user_topic_preferences").select("topic_id, preference_score").eq("user_id", user.id).execute()
            
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
            else:
                # Get content based on preferences
                preferred_topics = [pref["topic_id"] for pref in prefs_response.data if pref["preference_score"] > 0.3]
                
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

if __name__ == "__main__":
    from fastapi import FastAPI
    import uvicorn

    app = FastAPI()

    @app.get("/")
    def read_root():
        return {"Hello": "World"}

    uvicorn.run(app, host="0.0.0.0", port=8000)