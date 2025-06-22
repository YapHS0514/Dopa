from fastapi import HTTPException, Request
from typing import Callable
from ..schemas.user import User, UserRole
from ..services.supabase import get_supabase_client

async def get_current_user(request: Request) -> User:
    """Get the current user from the session"""
    try:
        # Get the authorization header
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Extract the token
        token = auth_header.split(" ")[1]
        
        # Get user from Supabase
        supabase = get_supabase_client()
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Not authenticated")

        # Return user with access token
        return User(
            id=response.user.id,
            email=response.user.email,
            access_token=token,
            role=response.user.user_metadata.get("role", UserRole.USER),
            metadata=response.user.user_metadata
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Not authenticated")

def require_role(required_role: UserRole) -> Callable:
    async def role_checker(user: User = get_current_user) -> User:
        if user.role != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Operation requires {required_role} role"
            )
        return user
    return role_checker 