from sqlalchemy import Integer ,String,Column,DateTime
from sqlalchemy.sql import func
from app.db.base import Base
class Student(Base):
    __tablename__ = "students"
    id = Column(Integer,primary_key=True,index=True)
    name = Column(String(100),nullable=False)
    email = Column(String(100),nullable=False,unique=True)
    phone = Column(Integer(20),nullable=False)
    password = Column(String(10),nullable=False)
    create_at = Column(DateTime(timezone=True),server_default=func.now())
    update_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

