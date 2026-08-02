from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_driver
from app.schemas.driver import DriverRegister, DriverLogin
from app.services.driver_service import register_driver, login_driver
from app.db.models.driver import Driver

router = APIRouter(
    prefix="/driver",
    tags=["Driver"]
)


@router.post("/register", status_code=201)
def register(
    data: DriverRegister,
    db: Session = Depends(get_db)
):
    try:
        driver = register_driver(db, data)

        return {
            "message": "Driver registered successfully",
            "id": driver.id,
            "email": driver.email
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(
    data: DriverLogin,
    db: Session = Depends(get_db)
):
    try:
        token = login_driver(
            db,
            data.email,
            data.password
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
def me(
    current_driver: Driver = Depends(get_current_driver)
):
    return {
        "id": current_driver.id,
        "name": current_driver.name,
        "email": current_driver.email,
        "phone": current_driver.phone,
        "vehicle_number": current_driver.vehicle_number,
        "vehicle_type": current_driver.vehicle_type,
        "is_available": current_driver.is_available
    }