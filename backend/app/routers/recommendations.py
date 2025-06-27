from fastapi import APIRouter, Depends, HTTPException
import logging
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])
logger = logging.getLogger(__name__)

@router.get("")
async def get_recommendations(
    limit: int = 10,
    user: User = Depends(get_current_user)
):
    """Get personalized content recommendations"""
    try:
        supabase = get_supabase_client()
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
            response = supabase.table("contents").select(
                "id, title, summary, content_type, media_url, source_url, created_at"
            ).order("created_at", desc=True).limit(limit).execute()
            logger.info(f"No preferences response: {response.data}")
        else:
            # Get content based on preferences
            preferred_topics = [pref["topic_id"] for pref in prefs_response.data if pref["preference_score"] > 0.3]
            logger.info(f"Preferred topics: {preferred_topics}")

            if preferred_topics:
                # Get content IDs linked to preferred topics via content_topics junction table
                content_topics_response = supabase.table("content_topics").select(
                    "content_id"
                ).in_("topic_id", preferred_topics).execute()
                
                preferred_content_ids = list(set([
                    ct["content_id"] for ct in content_topics_response.data
                ])) if content_topics_response.data else []
                
                if preferred_content_ids:
                    response = supabase.table("contents").select(
                        "id, title, summary, content_type, media_url, source_url, created_at"
                    ).in_("id", preferred_content_ids).order("created_at", desc=True).limit(limit).execute()
                else:
                    # No content found for preferred topics, return general content
                    response = supabase.table("contents").select(
                        "id, title, summary, content_type, media_url, source_url, created_at"
                    ).order("created_at", desc=True).limit(limit).execute()
                logger.info(f"Response: {response.data}")
            else:
                response = supabase.table("contents").select(
                    "id, title, summary, content_type, media_url, source_url, created_at"
                ).order("created_at", desc=True).limit(limit).execute()
        
        return {"data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 