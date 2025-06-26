from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client, get_supabase_admin_client
import logging

router = APIRouter(prefix="/api/saved", tags=["saved"])
logger = logging.getLogger(__name__)

class SaveContentRequest(BaseModel):
    content_id: str

@router.get("")
async def get_saved_content(user: User = Depends(get_current_user)):
    """Get user's saved content"""
    try:
        logger.info(f"Getting saved content for auth user {user.id}")
        supabase = get_supabase_client()
        
        # First, get the saved content records for this user
        saved_response = supabase.table("saved_contents").select("id, content_id, created_at").eq("user_id", user.id).order("created_at", desc=True).execute()
        
        if not saved_response.data:
            return {"data": []}
        
        # Extract content IDs
        content_ids = [item["content_id"] for item in saved_response.data]
        
        # Get the actual content details from contents table
        contents_response = supabase.table("contents").select("""
            id,
            title,
            summary,
            content_type,
            source_url,
            media_url
        """).in_("id", content_ids).execute()
        
        # Create a mapping of content_id to content details
        content_map = {content["id"]: content for content in contents_response.data}
        
        # Combine saved_contents data with actual content details
        result = []
        for saved_item in saved_response.data:
            content_id = saved_item["content_id"]
            if content_id in content_map:
                result.append({
                    "id": saved_item["id"],  # saved_contents.id
                    "created_at": saved_item["created_at"],  # when it was saved
                    "content": content_map[content_id]  # actual content details
                })
        
        return {"data": result}
    except Exception as e:
        logger.error(f"Error getting saved content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def save_content(
    request: SaveContentRequest,
    user: User = Depends(get_current_user)
):
    """Save content for user with max saves limit check"""
    try:
        logger.info(f"Saving content {request.content_id} for auth user {user.id}")
        supabase_admin = get_supabase_admin_client()
        
        # Get the user's max_saves from the profiles table
        profile_response = supabase_admin.table("profiles").select("max_saves").eq("user_id", user.id).execute()
        
        if not profile_response.data:
            logger.warning(f"No profile found for auth user {user.id}")
            raise HTTPException(status_code=404, detail="User profile not found")
        
        max_saves = profile_response.data[0]["max_saves"]
        logger.info(f"Found max_saves {max_saves} for auth user {user.id}")
        
        # Check current number of saved content by this user using auth user ID
        saved_count_response = supabase_admin.table("saved_contents").select("id", count="exact").eq("user_id", user.id).execute()
        current_saved_count = saved_count_response.count or 0
        
        logger.info(f"User has {current_saved_count} saved content, max allowed: {max_saves}")
        
        # Check if user has reached maximum saves limit
        if current_saved_count >= max_saves:
            logger.warning(f"User {user.id} has reached max saves limit ({max_saves})")
            raise HTTPException(
                status_code=400, 
                detail=f"You have reached the maximum number of saves ({max_saves}). Please remove some saved content to save new ones."
            )
        
        # Check if content is already saved using auth user ID
        existing_response = supabase_admin.table("saved_contents").select("id").eq("user_id", user.id).eq("content_id", request.content_id).execute()
        
        if existing_response.data:
            logger.warning(f"Content {request.content_id} already saved by user {user.id}")
            raise HTTPException(status_code=409, detail="Content already saved")
        
        # Save the content using auth user ID
        response = supabase_admin.table("saved_contents").insert({
            "user_id": user.id,
            "content_id": request.content_id
        }).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to save content")
        
        logger.info(f"Successfully saved content {request.content_id} for user {user.id}")
        return {
            "data": response.data[0], 
            "message": "Content saved successfully",
            "saved_count": current_saved_count + 1,
            "max_saves": max_saves
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{saved_content_id}")
async def remove_saved_content(
    saved_content_id: str,
    user: User = Depends(get_current_user)
):
    """Remove saved content"""
    try:
        logger.info(f"Removing saved content {saved_content_id} for auth user {user.id}")
        supabase_admin = get_supabase_admin_client()
        
        # Remove saved content using auth user ID
        response = supabase_admin.table("saved_contents").delete().eq("id", saved_content_id).eq("user_id", user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Saved content not found")
            
        logger.info(f"Successfully removed saved content {saved_content_id} for user {user.id}")
        return {"message": "Content removed from saved"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing saved content: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 