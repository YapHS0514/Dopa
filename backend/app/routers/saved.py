from fastapi import APIRouter, Depends, HTTPException
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client

router = APIRouter(prefix="/api/saved", tags=["saved"])

@router.get("")
async def get_saved_content(user: User = Depends(get_current_user)):
    """Get user's saved content"""
    try:
        supabase = get_supabase_client()
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

@router.post("")
async def save_content(
    content_id: str,
    user: User = Depends(get_current_user)
):
    """Save content for user"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("saved_contents").insert({
            "user_id": user.id,
            "content_id": content_id
        }).execute()
        
        return {"data": response.data[0], "message": "Content saved successfully"}
    except Exception as e:
        if "duplicate key" in str(e).lower():
            raise HTTPException(status_code=409, detail="Content already saved")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{saved_content_id}")
async def remove_saved_content(
    saved_content_id: str,
    user: User = Depends(get_current_user)
):
    """Remove saved content"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("saved_contents").delete().eq("id", saved_content_id).eq("user_id", user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Saved content not found")
            
        return {"message": "Content removed from saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 