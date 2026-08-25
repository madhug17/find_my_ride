from sqlalchemy import Column,Integer,String,ForeignKey,DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Rating(Base):
    __tablename__ = "ratings"
    id = Column(
        Integer,primary_key=True,
        index=True
    )
    ride_id = Column(
        Integer,
        ForeignKey("rides.id"),
        nullable=False
    )
    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )
    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )
    rating= Column(
        Integer,
        nullable=False
    )
    comment = Column(
        String(500),
        nullable=True
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )