from sqlalchemy.orm import Session
from app.db.models.driver import Driver
from app.repositories.driver_repository import (get_driver_by_email,create_driver)
from app.core.security import (hash_password,verify_password,create_access_token)
def register_drive(db: Session,data):
    existing_driver = get_driver_by_email(db,data.email)
    if existing_driver:
        raise Exception("Driver already exists")
    driver = Driver(
        name=data.name,
        email=data.email,
        phone=data.phone,
        vehicle_number=data.vehicle_number,
        vehicle_type=data.vehicle_type,
        password=hash_password(data.password),
    )
    return create_driver(db,driver)
def login_driver(db:Session,email:str,password:str):
    driver = get_driver_by_email(db,email)
    if driver in None:
        raise Exception("Invailed Credentials")
    if not verify_password(password,driver.password):
        raise Exception("Invalid credentials")
    token = create_access_token(
        {'sub':driver.email, "role": "driver"}
    )
    return token