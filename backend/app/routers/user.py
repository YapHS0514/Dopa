from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, date, timedelta, timezone
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
    """Get user's streak data based on actual database streak_days field"""
    try:
        supabase = get_supabase_client()
        
        # Get user's profile with streak data
        profile_response = supabase.table("profiles").select(
            "streak_days, last_streak_date"
        ).eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            return {
                "current_streak": 0,
                "best_streak": 0,
                "today_completed": False,
                "last_streak_date": None,
                "can_earn_streak_today": False
            }
        
        current_streak = profile_response.data.get("streak_days", 0)
        last_streak_date = profile_response.data.get("last_streak_date")
        
        # Check if today is completed (using UTC)
        today_utc = datetime.now(timezone.utc).date().isoformat()
        today_completed = last_streak_date == today_utc
        
        # Get daily progress to see if user can earn streak today
        progress_data = await get_daily_progress(user)
        can_earn_streak_today = progress_data["can_earn_streak"] if progress_data else False
        
        # For best streak, we'll use current streak for now (could be enhanced to track historical best)
        best_streak = current_streak
        
        # Check if milestone reached (every 7 days)
        milestone_reached = current_streak > 0 and current_streak % 7 == 0 and today_completed
        
        return {
            "current_streak": current_streak,
            "best_streak": best_streak,
            "today_completed": today_completed,
            "last_streak_date": last_streak_date,
            "can_earn_streak_today": can_earn_streak_today,
            "daily_progress": progress_data,
            "milestone_reached": milestone_reached
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

@router.get("/daily-progress")
async def get_daily_progress(user: User = Depends(get_current_user)):
    """Get user's daily content consumption progress"""
    try:
        supabase = get_supabase_client()
        
        # Get today's date in UTC (to match Supabase timestamp storage)
        today_utc = datetime.now(timezone.utc).date().isoformat()
        logger.info(f"📅 Checking daily progress for user {user.id} on UTC date: {today_utc}")
        
        # Count unique content interactions for today (any type of interaction counts)
        # Use UTC timezone to match how Supabase stores timestamps
        interactions_response = supabase.table("user_interactions").select(
            "content_id, interaction_type, created_at"
        ).eq("user_id", user.id).gte("created_at", f"{today_utc}T00:00:00Z").execute()
        
        logger.info(f"🔍 Found {len(interactions_response.data) if interactions_response.data else 0} total interactions for user {user.id} today")
        if interactions_response.data:
            logger.info(f"📋 Sample interactions: {interactions_response.data[:3]}")
        
        # Count unique content pieces interacted with today
        unique_content_today = len(set([
            interaction["content_id"] for interaction in interactions_response.data
        ])) if interactions_response.data else 0
        
        logger.info(f"📊 Unique content pieces consumed today: {unique_content_today}")
        
        # Check if streak threshold is met (4 unique content pieces)
        streak_threshold_met = unique_content_today >= 4
        
        # Check if user has already been credited for today's streak
        profile_response = supabase.table("profiles").select(
            "streak_days, last_streak_date"
        ).eq("user_id", user.id).single().execute()
        
        last_streak_date = profile_response.data.get("last_streak_date") if profile_response.data else None
        already_credited_today = last_streak_date == today_utc
        
        return {
            "date": today_utc,
            "unique_content_consumed": unique_content_today,
            "threshold_required": 4,
            "threshold_met": streak_threshold_met,
            "already_credited_today": already_credited_today,
            "can_earn_streak": streak_threshold_met and not already_credited_today
        }
        
    except Exception as e:
        logger.error(f"Error fetching daily progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/streak/update")
async def update_daily_streak(user: User = Depends(get_current_user)):
    """Update user's streak when they complete daily content goal"""
    try:
        supabase = get_supabase_client()
        today_utc = datetime.now(timezone.utc).date().isoformat()
        
        # First check if user has met the daily threshold
        progress_data = await get_daily_progress(user)
        
        if not progress_data["can_earn_streak"]:
            if progress_data["already_credited_today"]:
                return {
                    "success": False,
                    "message": "Streak already credited for today",
                    "streak_days": progress_data.get("current_streak", 0)
                }
            else:
                return {
                    "success": False,
                    "message": f"Need to consume {progress_data['threshold_required']} unique content pieces. Current: {progress_data['unique_content_consumed']}",
                    "streak_days": 0
                }
        
        # Get current profile data
        profile_response = supabase.table("profiles").select(
            "streak_days, last_streak_date"
        ).eq("user_id", user.id).single().execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        current_streak = profile_response.data.get("streak_days", 0)
        last_streak_date = profile_response.data.get("last_streak_date")
        
        # Calculate new streak using UTC dates
        yesterday_utc = (datetime.now(timezone.utc).date() - timedelta(days=1)).isoformat()
        
        if last_streak_date == yesterday_utc:
            # Consecutive day - increment streak
            new_streak = current_streak + 1
        elif last_streak_date == today_utc:
            # Already credited today (shouldn't happen due to check above)
            return {
                "success": False,
                "message": "Streak already credited for today",
                "streak_days": current_streak
            }
        else:
            # Streak broken or first day - start new streak
            new_streak = 1
        
        # Update profile with new streak
        update_response = supabase.table("profiles").update({
            "streak_days": new_streak,
            "last_streak_date": today_utc
        }).eq("user_id", user.id).execute()
        
        if not update_response.data:
            raise HTTPException(status_code=500, detail="Failed to update streak")
        
        logger.info(f"Updated streak for user {user.id}: {current_streak} -> {new_streak}")
        
        # Award coins for milestone streaks (every 7 days)
        coins_earned = 0
        if new_streak % 7 == 0:
            coins_earned = 100
            try:
                await add_user_coins(CoinOperationRequest(amount=coins_earned, reason=f"7-day streak milestone (day {new_streak})"), user)
                logger.info(f"Awarded {coins_earned} coins to user {user.id} for {new_streak}-day streak")
            except Exception as coin_error:
                logger.error(f"Failed to award streak coins: {coin_error}")
        
        return {
            "success": True,
            "message": "Streak updated successfully!",
            "streak_days": new_streak,
            "previous_streak": current_streak,
            "coins_earned": coins_earned,
            "milestone_reached": new_streak % 7 == 0
        }
        
    except Exception as e:
        logger.error(f"Error updating daily streak: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 