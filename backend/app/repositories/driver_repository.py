from sqlalchemy.orm import Session
from app.db.models.driver import Driver
def get_driver_by_email(db: Session, email:str):
    return db.query(Driver).filter(Driver.email==email).first()
def create_driver(db: Session,driver: Driver):
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver