from sqlalchemy.orm import Session

from app.repositories.auth_repository import (
    create_student,
    get_student_by_email,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

from app.db.models.student import Student


def register_student(db: Session, data):

    existing = get_student_by_email(db, data.email)

    if existing:
        raise Exception("Email already registered")

    student = Student(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.password),
    )

    return create_student(db, student)


def login_student(db: Session, email:str,password:str):

    student = get_student_by_email(
        db,
        email
    )

    if student is None:
        raise Exception("Invalid email or password")

    if not verify_password(
        password,
        student.password
    ):
        raise Exception("Invalid email or password")

    token = create_access_token(
        {
            "sub": student.email,
            "role": "student"
        }
    )

    return token