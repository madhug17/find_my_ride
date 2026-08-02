from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_student
from app.db.models.student import Student

from app.schemas.auth import StudentRegister, StudentLogin
from fastapi.security import OAuth2PasswordRequestForm
from app.services.auth_service import register_student, login_student
from app.core.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register",status_code=201)
def register(
    data: StudentRegister,
    db: Session = Depends(get_db),
):
    try:
        student = register_student(db, data)

        return {
            "message": "Student registered successfully",
            "id": student.id,
            "email": student.email,
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    try:
        token = login_student(db, form_data.username,form_data.password)

        return {
            "access_token": token,
            "token_type": "bearer",
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
@router.get('/me')
def get_me(current_student: Student=Depends(get_current_student)):
    return{
        "id": current_student.id,
        "name": current_student.name,
        "email": current_student.email,
        "phone": current_student.phone
    }