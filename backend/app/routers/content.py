from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from ..schemas.content import ContentRequest
from ..schemas.user import User, UserRole
from ..dependencies.auth import get_current_user, require_role
from ..services.supabase import get_supabase_client, get_supabase_admin_client
import logging

router = APIRouter(prefix="/api/contents", tags=["contents"])
logger = logging.getLogger(__name__)

@router.get("")
async def get_contents(
    limit: int = 20,
    offset: int = 0,
    topic_id: Optional[str] = None,
    user: User = Depends(get_current_user)
):
    """Get personalized content based on user's topic preferences"""
    try:
        logger.info(f"Fetching personalized content for auth user {user.id}")
        supabase = get_supabase_client()
        
        # First, get the user's profile ID from the profiles table
        logger.info("Getting user's profile ID from profiles table")

        # Step 1: Get user's preferred topics (points > 50) using profile ID
        logger.info("Step 1: Getting user's preferred topics with points > 50")
        prefs_response = supabase.table("user_topic_preferences").select(
            "topic_id, points"
        ).eq("user_id", user.id).gte("points", 50).execute()
        
        logger.info(f"User preferences response: {prefs_response.data}")
        
        preferred_topic_ids = [pref["topic_id"] for pref in prefs_response.data] if prefs_response.data else []
        logger.info(f"Preferred topic IDs: {preferred_topic_ids}")
        
        if not preferred_topic_ids:
            # If user has no preferences with >50 points, return general content
            logger.info("No preferred topics found, returning general content")
            response = supabase.table("contents").select(
                "id, title, summary, content_type, media_url, source_url, created_at"
            ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        else:
            # Step 2: Get content IDs linked to preferred topics via content_topics
            logger.info("Step 2: Getting content IDs for preferred topics")
            content_topics_response = supabase.table("content_topics").select(
                "content_id"
            ).in_("topic_id", preferred_topic_ids).execute()
            
            logger.info(f"Content-topics response: {content_topics_response.data}")
            
            preferred_content_ids = list(set([
                ct["content_id"] for ct in content_topics_response.data
            ])) if content_topics_response.data else []
            
            logger.info(f"Preferred content IDs: {preferred_content_ids}")
            
            if not preferred_content_ids:
                # If no content found for preferred topics, return general content
                logger.info("No content found for preferred topics, returning general content")
                response = supabase.table("contents").select(
                    "id, title, summary, content_type, media_url, source_url, created_at"
                ).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
            else:
                # Step 3: Get the actual content records for preferred content IDs
                logger.info("Step 3: Getting content records for preferred content IDs")
                response = supabase.table("contents").select(
                    "id, title, summary, content_type, media_url, source_url, created_at"
                ).in_("id", preferred_content_ids).order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        logger.info(f"Final content response: {response.data}")
        
        # Transform the data to match the expected frontend format
        transformed_data = []
        for content in response.data:
            media_url = content.get("media_url", "")
            
            # Determine if this is video content based on media_url file extension
            is_video = media_url and any(media_url.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.webm', '.m4v'])
            
            transformed_content = {
                "id": content["id"],
                "hook": content["title"],  # title -> hook
                "summary": content["summary"],  # summary -> fullContent for swiping
                "fullContent": content["summary"],  # Using summary as the swipeable content
                "image": "" if is_video else media_url,  # Use media_url as image only for non-video content
                "topic": "general",  # We could enhance this by joining with topics
                "source": "Database",  # Could be enhanced with actual source name
                "sourceUrl": content.get("source_url", ""),
                "readTime": 2,  # Could be calculated or stored
                "video_url": media_url if is_video else "",  # Use media_url as video_url for video content
                "tags": [],  # TODO: Add tags support when available in database
                "contentType": "reel" if is_video else "text"  # Determine content type
            }
            transformed_data.append(transformed_content)
        
        return {
            "data": transformed_data,
            "count": len(transformed_data),
            "offset": offset,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Error fetching personalized content: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
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
        supabase_admin = get_supabase_admin_client()
        response = supabase_admin.table("contents").insert({
            "title": content.title,
            "summary": content.summary,
            "content_type": content.content_type,
            "topic_id": content.topic_id,
            "tags": content.tags,
            "difficulty_level": content.difficulty_level,
            "estimated_read_time": content.estimated_read_time,
            # TODO: Add video_url support after database migration
            # "video_url": content.video_url,
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