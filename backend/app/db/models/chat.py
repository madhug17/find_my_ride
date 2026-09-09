from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from app.db.database import Base

class RideChatMessage(Base):
    __tablename__ = "ride_chat_messages"

    id = Column(Integer, primary_key=True, index=True, nullable=False)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False)
    sender_role = Column(String(50), nullable=False) # 'student' or 'driver'
    sender_name = Column(String(100), nullable=False)
    message = Column(String(1000), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
