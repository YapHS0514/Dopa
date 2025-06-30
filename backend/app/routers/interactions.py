from fastapi import APIRouter, Depends, HTTPException
from ..schemas.content import UserInteractionRequest
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client

router = APIRouter(prefix="/api/interactions", tags=["interactions"])

@router.post("")
async def record_interaction(
    interaction: UserInteractionRequest,
    user: User = Depends(get_current_user)
):
    """Record user interaction with content"""
    try:
        supabase = get_supabase_client()
        
        # Check if this exact interaction already exists (to prevent duplicates)
        existing_response = supabase.table("user_interactions").select("id").eq(
            "user_id", user.id
        ).eq(
            "content_id", interaction.content_id
        ).eq(
            "interaction_type", interaction.interaction_type
        ).execute()
        
        # Handle different interaction types with appropriate duplicate prevention
        if interaction.interaction_type in ["view", "skip", "partial", "interested", "engaged"]:
            # For engagement interactions, allow multiple records but limit to prevent spam
            if existing_response.data and len(existing_response.data) >= 3:
                return {"message": f"{interaction.interaction_type.title()} interaction already recorded (limit reached)", "duplicate": True}
        else:
            # For other interactions (like, save, etc.), prevent exact duplicates
            if existing_response.data:
                return {"message": "Interaction already recorded", "duplicate": True}
        
        response = supabase.table("user_interactions").insert({
            "user_id": user.id,
            "content_id": interaction.content_id,
            "interaction_type": interaction.interaction_type,
            "interaction_value": interaction.interaction_value
        }).execute()
        
        return {"data": response.data[0], "message": "Interaction recorded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_user_stats(user: User = Depends(get_current_user)):
    """Get user interaction statistics"""
    try:
        supabase = get_supabase_client()
        # Get user interactions
        interactions_response = supabase.table("user_interactions").select("interaction_type").eq("user_id", user.id).execute()
        
        interactions = interactions_response.data
        stats = {
            "total_interactions": len(interactions),
            "likes_count": len([i for i in interactions if i["interaction_type"] == "like"]),
            "saves_count": len([i for i in interactions if i["interaction_type"] == "save"]),
            "views_count": len([i for i in interactions if i["interaction_type"] == "view"]),
            "skip_count": len([i for i in interactions if i["interaction_type"] == "skip"]),
            "partial_count": len([i for i in interactions if i["interaction_type"] == "partial"]),
            "interested_count": len([i for i in interactions if i["interaction_type"] == "interested"]),
            "engaged_count": len([i for i in interactions if i["interaction_type"] == "engaged"])
        }
        
        return {"data": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 