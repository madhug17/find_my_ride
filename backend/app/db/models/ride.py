from sqlalchemy import Column,String,DateTime,ForeignKey,Float,Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
class Ride(Base):
    __tablename__ = "rides"
    id = Column(Integer,primary_key=True,index=True,nullable=False)
    student_id = Column(
        Integer,ForeignKey("students.id"),
        nullable=False
    )
    driver_id = Column(Integer,ForeignKey('drivers.id'),nullable=True)
    pickup_loc = Column(String(225),nullable=False)
    drop_loc = Column(String(225),nullable=False)
    pickup_lat = Column(Float,nullable=False)
    pickup_lng = Column(Float,nullable=False)
    drop_lat = Column(Float,nullable=False)
    drop_lng = Column(Float,nullable=False)
    status = Column(
        String(50),default="PENDING"
    )
    created_at = Column(DateTime(timezone=True),server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
    student = relationship("Student")
    driver = relationship("Driver")
