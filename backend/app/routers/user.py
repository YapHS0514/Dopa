from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
import logging
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client

router = APIRouter(prefix="/api/user", tags=["user"])
logger = logging.getLogger(__name__)

class CoinOperationRequest(BaseModel):
    amount: int
    reason: str

class UpdateUsernameRequest(BaseModel):
    username: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    streak_days: int = 0
    total_coins: int = 0
    onboarding_completed: bool = False

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(user: User = Depends(get_current_user)):
    """Get comprehensive user profile information"""
    try:
        logger.info(f"Getting comprehensive profile for user: {user.id}")
        supabase = get_supabase_client()

        # Get user's profile from database
        profile_response = supabase.table("profiles").select(
            "user_id, email, full_name, avatar_url, streak_days, total_coins, onboarding_completed"
        ).eq("user_id", user.id).single().execute()

        if not profile_response.data:
            logger.error(f"Profile not found for user: {user.id}")
            raise HTTPException(status_code=404, detail="Profile not found")

        profile_data = profile_response.data
        logger.info(f"Profile found for user: {user.id}")
        
        return UserProfileResponse(
            id=user.id,
            email=profile_data.get("email", ""),
            full_name=profile_data.get("full_name"),
            avatar_url=profile_data.get("avatar_url"),
            streak_days=profile_data.get("streak_days", 0),
            total_coins=profile_data.get("total_coins", 0),
            onboarding_completed=profile_data.get("onboarding_completed", False)
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting comprehensive profile for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/streak")
async def get_user_streak(user: User = Depends(get_current_user)):
    """Get user's streak data based on daily content views"""
    try:
        supabase = get_supabase_client()
        
        # Get all view interactions for the user
        interactions_response = supabase.table("user_interactions").select(
            "id, user_id, content_id, interaction_type, created_at"
        ).eq("user_id", user.id).eq("interaction_type", "view").order("created_at", desc=False).execute()
        
        if not interactions_response.data:
            return {
                "active_days": 0,
                "streak_days": [],
                "current_streak": 0,
                "best_streak": 0,
                "streak_revival_count": 0,
                "today_completed": False,
                "reward_earned": False
            }
        
        # Group interactions by date and count views per day
        daily_views: Dict[str, int] = {}
        for interaction in interactions_response.data:
            # Parse the timestamp and get date
            timestamp = datetime.fromisoformat(interaction["created_at"].replace('Z', '+00:00'))
            date_str = timestamp.date().isoformat()
            
            daily_views[date_str] = daily_views.get(date_str, 0) + 1
        
        # Find streak-eligible days (≥ 5 views)
        streak_days = [date_str for date_str, views in daily_views.items() if views >= 5]
        streak_days.sort()
        
        # Calculate current streak (consecutive days ending today or yesterday)
        current_streak = 0
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        if streak_days:
            # Check if today is completed
            today_str = today.isoformat()
            yesterday_str = yesterday.isoformat()
            today_completed = today_str in streak_days
            
            # Calculate current streak
            check_date = today if today_completed else yesterday
            current_streak = 0
            
            while check_date.isoformat() in streak_days:
                current_streak += 1
                check_date -= timedelta(days=1)
        else:
            today_completed = False
        
        # Calculate best streak (longest consecutive sequence)
        best_streak = 0
        if streak_days:
            current_sequence = 1
            max_sequence = 1
            
            for i in range(1, len(streak_days)):
                prev_date = datetime.fromisoformat(streak_days[i-1]).date()
                curr_date = datetime.fromisoformat(streak_days[i]).date()
                
                if (curr_date - prev_date).days == 1:
                    current_sequence += 1
                    max_sequence = max(max_sequence, current_sequence)
                else:
                    current_sequence = 1
            
            best_streak = max_sequence
        
        # Calculate streak revival count (placeholder - would need streak break tracking)
        streak_revival_count = 0  # TODO: Implement streak break tracking
        
        # Check if reward is earned (every 7 days)
        reward_earned = current_streak > 0 and current_streak % 7 == 0 and today_completed
        
        # TODO: Add coin credit logic when reward_earned is true
        # TODO: Add caching for performance optimization
        
        return {
            "active_days": len(streak_days),
            "streak_days": streak_days,
            "current_streak": current_streak,
            "best_streak": best_streak,
            "streak_revival_count": streak_revival_count,
            "today_completed": today_completed,
            "reward_earned": reward_earned
        }
        
    except Exception as e:
        logger.error(f"Error fetching user streak: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coins")
async def get_user_coins(user: User = Depends(get_current_user)):
    """Get user's current coin balance"""
    try:
        supabase = get_supabase_client()
        
        # Get user's coin balance from profile
        profile_response = supabase.table("profiles").select("total_coins").eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "coins": profile_response.data["total_coins"]
        }
        
    except Exception as e:
        logger.error(f"Error fetching user coins: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/coins/add")
async def add_user_coins(request: CoinOperationRequest, user: User = Depends(get_current_user)):
    """Add coins to user's balance (for rewards, etc.)"""
    try:
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        supabase = get_supabase_client()
        
        # Get current coin balance
        profile_response = supabase.table("profiles").select("total_coins").eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        current_coins = profile_response.data["total_coins"]
        new_balance = current_coins + request.amount
        
        # Update coin balance
        update_response = supabase.table("profiles").update({
            "total_coins": new_balance
        }).eq("user_id", user.id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update coin balance")
        
        logger.info(f"Added {request.amount} coins to user {user.id} for reason: {request.reason}. New balance: {new_balance}")
        
        return {
            "coins": new_balance,
            "added": request.amount,
            "reason": request.reason
        }
        
    except Exception as e:
        logger.error(f"Error adding user coins: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/coins/spend")
async def spend_user_coins(request: CoinOperationRequest, user: User = Depends(get_current_user)):
    """Spend coins from user's balance (for marketplace purchases, etc.)"""
    try:
        if request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        supabase = get_supabase_client()
        
        # Get current coin balance
        profile_response = supabase.table("profiles").select("total_coins").eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        current_coins = profile_response.data["total_coins"]
        
        if current_coins < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient coins")
        
        new_balance = current_coins - request.amount
        
        # Update coin balance
        update_response = supabase.table("profiles").update({
            "total_coins": new_balance
        }).eq("user_id", user.id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update coin balance")
        
        logger.info(f"Spent {request.amount} coins for user {user.id} for reason: {request.reason}. New balance: {new_balance}")
        
        return {
            "coins": new_balance,
            "spent": request.amount,
            "reason": request.reason
        }
        
    except Exception as e:
        logger.error(f"Error spending user coins: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile/avatar")
async def update_user_avatar(request: dict, user: User = Depends(get_current_user)):
    """Update user's avatar URL"""
    try:
        avatar_url = request.get("avatar_url")
        if not avatar_url:
            raise HTTPException(status_code=400, detail="Avatar URL is required")
        
        supabase = get_supabase_client()
        
        # Update avatar URL in profile
        update_response = supabase.table("profiles").update({
            "avatar_url": avatar_url
        }).eq("user_id", user.id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update avatar")
        
        logger.info(f"Updated avatar for user {user.id}")
        
        return {
            "message": "Avatar updated successfully",
            "avatar_url": avatar_url
        }
        
    except Exception as e:
        logger.error(f"Error updating user avatar: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile/username")
async def update_username(request: UpdateUsernameRequest, user: User = Depends(get_current_user)):
    """Update user's username (full_name)"""
    try:
        username = request.username.strip()
        
        # Validate username
        if not username:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        
        if len(username) < 2:
            raise HTTPException(status_code=400, detail="Username must be at least 2 characters long")
        
        if len(username) > 50:
            raise HTTPException(status_code=400, detail="Username must be less than 50 characters")
        
        supabase = get_supabase_client()
        
        # Update username in profile
        try:
            update_response = supabase.table("profiles").update({
                "full_name": username
            }).eq("user_id", user.id).execute()
            
            if not update_response.data:
                raise HTTPException(status_code=500, detail="Failed to update username")
            
            logger.info(f"Updated username for user {user.id} to: {username}")
            
            return {
                "message": "Username updated successfully",
                "username": username
            }
            
        except Exception as db_error:
            error_str = str(db_error).lower()
            
            # Check for unique constraint violation
            if "unique" in error_str or "duplicate" in error_str or "already exists" in error_str:
                logger.warning(f"Username '{username}' already taken for user {user.id}")
                raise HTTPException(
                    status_code=409, 
                    detail="This username is already taken. Please choose a different one."
                )
            
            # Re-raise other database errors
            logger.error(f"Database error updating username for user {user.id}: {str(db_error)}")
            raise HTTPException(status_code=500, detail="Failed to update username")
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error updating username for user {user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 