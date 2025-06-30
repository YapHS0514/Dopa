from pydantic import BaseModel, EmailStr
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(BaseModel):
    id: str
    email: str
    access_token: str
    role: UserRole = UserRole.USER
    metadata: Dict[str, Any] = {}

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    total_points: int = 0
    streak_days: int = 0
    total_coins: int = 0  # Changed from coins to total_coins for consistency
    last_active: datetime
    onboarding_completed: bool = False
    created_at: datetime
    updated_at: datetime

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    profile: UserProfile 