from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from typing import List, Dict, Any
import logging
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client

router = APIRouter(prefix="/api/user", tags=["user"])
logger = logging.getLogger(__name__)

class CoinOperationRequest(BaseModel):
    amount: int
    reason: str

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
        profile_response = supabase.table("profiles").select("coins").eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "coins": profile_response.data["coins"]
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
        profile_response = supabase.table("profiles").select("coins").eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        current_coins = profile_response.data["coins"]
        new_balance = current_coins + request.amount
        
        # Update coin balance
        update_response = supabase.table("profiles").update({
            "coins": new_balance
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
        profile_response = supabase.table("profiles").select("coins").eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        current_coins = profile_response.data["coins"]
        
        if current_coins < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient coins")
        
        new_balance = current_coins - request.amount
        
        # Update coin balance
        update_response = supabase.table("profiles").update({
            "coins": new_balance
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