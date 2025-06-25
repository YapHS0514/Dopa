from pydantic import BaseModel, UUID4, Field
from typing import Optional, List

class Topic(BaseModel):
    id: str
    name: str
    color: Optional[str] = None
    icon: Optional[str] = None

class UserTopicPreference(BaseModel):
    topic_id: str
    points: int = 50

    class Config:
        json_schema_extra = {
            "example": {
                "topic_id": "123e4567-e89b-12d3-a456-426614174000",
                "points": 50
            }
        }

class TopicPreferenceUpdate(BaseModel):
    topic_id: UUID4
    points: int = Field(ge=0, le=100)  # Points must be between 0 and 100 