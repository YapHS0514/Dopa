from fastapi import APIRouter, Depends, HTTPException
from ..dependencies.auth import get_current_user
from ..services.supabase import get_supabase_client, get_supabase_admin_client
from ..schemas.user import UserCreate, UserProfile, UserResponse, UserSignIn
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserCreate):
    try:
        supabase = get_supabase_client()
        supabase_admin = get_supabase_admin_client()
        
        # Create auth user
        try:
            auth_response = supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password
            })
            
            # Get the user data from the response
            user = auth_response.user
            if not user:
                raise HTTPException(status_code=400, detail="Failed to create user")
                
            logger.info(f"Successfully created auth user: {user.id}")
            
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg:
                raise HTTPException(status_code=429, detail="Too many signup attempts. Please try again later.")
            if "User already registered" in error_msg:
                raise HTTPException(status_code=400, detail="Email already registered")
            logger.error(f"Error in auth user creation: {error_msg}")
            raise HTTPException(status_code=400, detail=str(e))
        
        # Create profile using admin client to bypass RLS
        try:
            profile_data = {
                "user_id": user.id,
                "email": user_data.email,
                "onboarding_completed": False,
                "total_points": 0,
                "streak_days": 0,
                "last_active": "now()"
            }
            
            # Use admin client for profile creation
            profile_response = supabase_admin.table("profiles").insert(profile_data).execute()
            
            if not profile_response.data or len(profile_response.data) == 0:
                # Rollback auth user creation if profile creation fails
                logger.error(f"Failed to create profile for user {user.id}")
                # Use non-async delete_user since it's not an async function
                supabase_admin.auth.admin.delete_user(user.id)
                raise HTTPException(status_code=400, detail="Failed to create user profile")
                
            logger.info(f"Successfully created profile for user: {user.id}")
            
            return {
                "id": user.id,
                "email": user_data.email,
                "profile": profile_response.data[0]
            }
            
        except Exception as e:
            # If profile creation fails, attempt to rollback auth user
            logger.error(f"Error creating profile, attempting to rollback auth user: {str(e)}")
            try:
                # Use non-async delete_user since it's not an async function
                supabase_admin.auth.admin.delete_user(user.id)
            except Exception as rollback_error:
                logger.error(f"Failed to rollback auth user: {str(rollback_error)}")
            raise HTTPException(status_code=400, detail="Failed to create user profile")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in signup: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post("/signin", response_model=UserResponse)
async def signin(user_data: UserSignIn):
    try:
        supabase = get_supabase_client()
        
        try:
            auth_response = supabase.auth.sign_in_with_password({
                "email": user_data.email,
                "password": user_data.password
            })
            
            if not auth_response.user:
                raise HTTPException(status_code=401, detail="Invalid credentials")
                
            logger.info(f"User successfully signed in: {auth_response.user.id}")
            
        except Exception as e:
            error_msg = str(e)
            if "Invalid login credentials" in error_msg:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            if "Email not confirmed" in error_msg:
                raise HTTPException(status_code=401, detail="Please verify your email before signing in. Check your inbox for a verification link.")
            if "429" in error_msg:
                raise HTTPException(status_code=429, detail="Too many signin attempts. Please try again later.")
            logger.error(f"Error in signin: {error_msg}")
            raise HTTPException(status_code=401, detail="Failed to sign in")
            
        # Get user profile, create if doesn't exist
        try:
            # Try to get existing profile
            try:
                profile_response = supabase.table("profiles").select("*").eq("user_id", auth_response.user.id).single().execute()
                if profile_response.data:
                    return {
                        "id": auth_response.user.id,
                        "email": auth_response.user.email,
                        "profile": profile_response.data
                    }
            except Exception as profile_error:
                logger.info(f"Profile not found for user {auth_response.user.id}, creating new profile")
            
            # Profile doesn't exist, create it using admin client
            supabase_admin = get_supabase_admin_client()
            profile_data = {
                "user_id": auth_response.user.id,
                "email": auth_response.user.email,
                "onboarding_completed": False,
                "total_points": 0,
                "streak_days": 0,
                "last_active": "now()"
            }
            
            create_response = supabase_admin.table("profiles").insert(profile_data).execute()
            
            if not create_response.data or len(create_response.data) == 0:
                logger.error(f"Failed to create profile for existing user {auth_response.user.id}")
                raise HTTPException(status_code=400, detail="Failed to create user profile")
            
            logger.info(f"Successfully created profile for existing user: {auth_response.user.id}")
            
            return {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "profile": create_response.data[0]
            }
            
        except HTTPException as he:
            raise he
        except Exception as e:
            logger.error(f"Error handling profile: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to fetch user profile")
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in signin: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/profile", response_model=UserProfile)
async def get_profile(user = Depends(get_current_user)):
    try:
        logger.info(f"Getting profile for user: {user.id}")
        supabase = get_supabase_client()

        # Supabase client is synchronous; remove await
        profile_response = supabase.table("profiles").select("*").eq("user_id", user.id).single().execute()

        if not profile_response.data:
            logger.error(f"Profile not found for user: {user.id}")
            raise HTTPException(status_code=404, detail="Profile not found")

        logger.info(f"Profile found for user: {user.id}")
        return profile_response.data

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error getting profile for user {user.id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/profile/onboarding")
async def complete_onboarding(user = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()

        response = supabase.table("profiles").update({
            "onboarding_completed": True
        }).eq("user_id", user.id).execute()

        if len(response.data) == 0:
            raise HTTPException(status_code=404, detail="Profile not found")

        return {"message": "Onboarding completed successfully"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/signout")
async def signout(user = Depends(get_current_user)):
    try:
        supabase = get_supabase_client()
        
        # Ensure the client is authenticated with the user's token
        supabase.postgrest.auth(user.access_token)
        
        # Sign out from Supabase (non-async)
        supabase.auth.sign_out()
        
        return {"message": "Signed out successfully"}
    except Exception as e:
        logger.error(f"Error in signout: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e)) 