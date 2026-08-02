from fastapi import Depends,HTTPException,status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt,JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import SessionLocal
from app.db.models.student import Student
oauth2_auth = OAuth2PasswordBearer(tokenUrl="/auth/login")
def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:
        db.close()
def get_current_student(token:str = Depends(oauth2_auth),db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email = payload.get('sub')
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    student=db.query(Student).filter(Student.email == email).first()
    if student is None:
        raise credentials_exception
    return student
