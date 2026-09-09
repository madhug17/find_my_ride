from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    ride_id: int
    sender_role: str
    sender_name: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class HelpBotQuery(BaseModel):
    question: str
    role: Optional[str] = "student"
