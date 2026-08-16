from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_driver
from app.schemas.driver import DriverRegister,DriverLogin,DriverAvailability,DriverLocation
from app.services.driver_service import register_driver, login_driver
from app.db.models.driver import Driver
from app.db.models.ride import Ride



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
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.post("/login")
def login(
    data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        token = login_driver(
            db,
            data.username,
            data.password
        )

        return {
            "access_token": token,
            "token_type": "bearer"
        }

    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=str(e)
        )


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
        "is_available": current_driver.is_available,
        "latitude": current_driver.latitude,
        "longitude": current_driver.longitude
    }
@router.get('/rides')
def get_available_rides(
    db:Session=Depends(get_db),
    current_driver: Driver=Depends(get_current_driver)
):
    rides = (
        db.query(Ride).filter(Ride.status=="PENDING").filter(Ride.driver_id.is_(None)).all()
    )
    return rides


@router.put("/rides/{ride_id}/accept")
def accept_ride(
    ride_id:int,
    db:Session=Depends(get_db),
    current_driver:Driver=Depends(get_current_driver)
):
    ride = db.query(Ride).filter(Ride.id==ride_id).first()
    if ride is None:
        raise HTTPException(status_code=404,detail="Ride not found")
    if ride.status!="PENDING":
        raise HTTPException(status_code=400,detail='Ride is no longer available')
    if ride.driver_id is not None:
        raise HTTPException(
            status_code=400,detail="Ride already accepted by another driver"
        )
    ride.driver_id = current_driver.id
    ride.status = "ACCEPTED"
    db.commit()
    db.refresh(ride)
    return{
        "message": "Ride accepted successfully",
        "ride_id": ride.id,
        "driver_id": current_driver.id,
        "status": ride.status
    }

@router.put("/rides/{ride_id}/complete")
def complete_ride(
    ride_id:int,
    db:Session=Depends(get_db),
    current_driver:Driver=Depends(get_current_driver)
):
    ride=db.query(Ride).filter(Ride.id==ride_id).first()
    if ride is None:
        raise HTTPException(status_code=404,detail="Ride not found")
    if ride.driver_id != current_driver.id:
        raise HTTPException(status_code=403,detail="You are not assigned to this ride")
    if ride.status!= "ACCEPTED":
        raise HTTPException(status_code=400,detail="Ride cannot be completed")
    ride.status = "COMPLETED"
    db.commit()
    db.refresh(ride)
    return {
        "message": "Ride completed successfully",
        "ride_id": ride.id,
        "status": ride.status
    }

@router.put('availability')
def update_availability(
    data: DriverAvailability,
    db: Session = Depends(get_db),
    current_driver: Driver=Depends(get_current_driver)
):
    current_driver.is_available=data.is_available
    db.commit()
    db.refresh(current_driver)
    return{
        "message": "Driver availability updated successfully",
        "is_available": current_driver.is_available
    }

@router.put('/location')
def update_location(
    data:DriverLocation,
    db:Session = Depends(get_db),
    current_driver :Driver=Depends(get_current_driver)
):
    current_driver.longitude = data.longitude
    current_driver.latitude =data.latitude
    db.commit()
    db.refresh(current_driver)
    return{
        "message": "Driver location updated successfully",
        "latitude": current_driver.latitude,
        "longitude": current_driver.longitude
    }