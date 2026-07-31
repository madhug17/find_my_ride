from sqlalchemy.orm import Session
from app.db.models.student import Student
def get_student_by_email(db: Session,email:str):
    return db.query(Student).filter(Student.email==email).first()
def create_student(db:Session,student:Student):
    db.add(student)
    db.commit()
    db.refresh(student)
    return student