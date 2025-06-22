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
    """Get paginated content with optional topic filtering"""
    try:
        supabase = get_supabase_client()
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