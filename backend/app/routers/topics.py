from fastapi import APIRouter, Depends, HTTPException
from typing import List
import logging
import traceback
from ..schemas.user import User
from ..schemas.topics import UserTopicPreference, Topic
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client, get_supabase_admin_client

router = APIRouter(tags=["topics"])
logger = logging.getLogger(__name__)

@router.get("/api/topics")
async def get_topics(user: User = Depends(get_current_user)):
    """Get all available topics"""
    try:
        logger.info("Attempting to fetch topics from Supabase...")
        supabase = get_supabase_client()
        
        # Ensure your supabase client is authenticated with the user's access token
        supabase.postgrest.auth(user.access_token)  # ✅ Best for request-scoped auth
        
        # First check if we can access the table
        count_response = supabase.table("topics").select("id").execute()
        logger.info(f"Topics count response: {count_response}")
        
        # Get all topics
        response = supabase.table("topics").select("*").execute()
        logger.info(f"Raw Supabase response: {response}")
        
        if not response.data:
            logger.warning("No topics found in database")
            return {"data": []}
            
        logger.info(f"Response data: {response.data}")
        return {"data": response.data}
        
    except Exception as e:
        logger.error(f"Error fetching topics: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch topics: {str(e)}"
        )

@router.get("/api/user/preferences")
async def get_user_preferences(user: User = Depends(get_current_user)):
    """Get user topic preferences"""
    try:
        logger.info(f"Getting preferences for auth user {user.id}")
        supabase = get_supabase_client()
                
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
        logger.error(f"Error getting user preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/user/preferences")
async def update_user_preferences(
    preferences: List[UserTopicPreference],
    user: User = Depends(get_current_user)
):
    """Update user's topic preferences"""
    try:
        logger.info(f"Received preferences update request for auth user {user.id}")
        logger.info(f"Received preferences: {preferences}")

        supabase_admin = get_supabase_admin_client()

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

@router.post("/api/user/onboarding-complete")
async def complete_onboarding(user: User = Depends(get_current_user)):
    """Mark user's onboarding as complete"""
    try:
        logger.info(f"Marking onboarding complete for user {user.id}")
        
        supabase_admin = get_supabase_admin_client()

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