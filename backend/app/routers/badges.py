from fastapi import APIRouter, Depends
from ..schemas.user import User
from ..dependencies.auth import get_current_user
from ..services.badges import check_and_award_badges

router = APIRouter(prefix="/api/check_badges", tags=["badges"])

@router.post("")
async def check_badges(user: User = Depends(get_current_user)):
    new_badge = check_and_award_badges(user.id)
    return {"new_badge": new_badge} 