from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str
    sender_role: Optional[str] = "student"
    sender_name: Optional[str] = "Student"

class ChatMessageResponse(BaseModel):
    id: int
    ride_id: int
    sender_role: str
    sender_name: str
    message: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class HelpBotQuery(BaseModel):
    question: str
    role: Optional[str] = "student"

