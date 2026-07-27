from datetime import datetime,timedelta,timezone
from sqlalchemy.orm import Session
from app.db.models.student import Student
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")#adding salt with help of this bcrypt
def hash_password(password:str):
    return pwd_context.hash(password)
def verify_password(plain_password:str,hashed_password:str):
    return pwd_context.verify(plain_password,hashed_password) # checking passwords or verifing 
def create_access_token(date:dict):
    payload=date.copy()
    expire=datetime.utcnow()+timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({'exp':expire})
    return jwt.encode(
        payload,settings.SCRETE_KEY,algorithm=settings.ALGORITHM
    )

# Student information rah babu
def get_student_by_email(db: Session,email:str):
    return db.query(Student).filter(Student.email==email).first()
def create_student(db: Session,student: Student):
    db.add(student)
    db.commit()
    db.refresh(student)
    return student