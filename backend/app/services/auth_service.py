from sqlalchemy.orm import Session

from app.db.models.student import Student
from app.repositories.auth_repository import (
    create_student,
    get_student_by_email,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)


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


def login_student(db: Session, data):
    student = get_student_by_email(db, data.email)

    if student is None:
        raise Exception("Invalid email or password")

    if not verify_password(data.password, student.password):
        raise Exception("Invalid email or password")

    token = create_access_token(
        {"sub": student.email}
    )

    return token