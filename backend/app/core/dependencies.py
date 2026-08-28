from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import SessionLocal
from app.db.models.student import Student
from app.db.models.driver import Driver

oauth2_student = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_driver = OAuth2PasswordBearer(tokenUrl="/driver/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_student(
    token: str = Depends(oauth2_student), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role != "student":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    student = db.query(Student).filter(Student.email == email).first()
    if student is None:
        raise credentials_exception
    return student

def get_current_driver(
    token: str = Depends(oauth2_driver), db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        email = payload.get("sub")
        role = payload.get("role")
        if email is None or role != "driver":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    driver = db.query(Driver).filter(Driver.email == email).first()
    if driver is None:
        raise credentials_exception
    return driver
