from sqlalchemy.orm import DeclarativeBase
class Data(DeclarativeBase):
    pass
from app.db.models.student import Student
from app.db.models.driver import Driver