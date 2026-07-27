from sqlalchemy.sql import func
from sqlalchemy import Column,Integer,String,DateTime,Boolean
from app.db.base import Base
class Driver(Base):
    __tablename__="drivers"
    id = Column(Integer,primary_key=True,nullable=False)
    name = Column(String,nullable=False)
    email = Column(String(225),unique=True,nullable=False)
    phone = Column(Integer(11),unique=True,nullable=False)
    password = Column(String(255), nullable=False)
    vehicle_number = Column(String(50))
    is_online = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True),server_default=func.now())
    update_at = Column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now())
