from pydantic import BaseModel
from typing import List, Optional

class ContentRequest(BaseModel):
    title: str
    summary: str
    content_type: str = "text"
    topic_id: Optional[str] = None
    tags: List[str] = []
    difficulty_level: int = 1
    estimated_read_time: int = 30
    video_url: Optional[str] = None  # Add video support for reels

class UserInteractionRequest(BaseModel):
    content_id: str
    interaction_type: str  # 'like', 'save', 'view', 'skip', 'partial', 'interested', 'engaged'
    interaction_value: int 