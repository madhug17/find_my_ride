from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_driver
from app.schemas.driver import (
    DriverRegister,
    DriverAvailability,
    DriverLocation,
)
from app.services.driver_service import register_driver, login_driver
from app.db.models.driver import Driver
from app.db.models.ride import Ride
from app.websocket.connection_manager import manager
from app.db.models.rating import Rating


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


@router.get("/rides/available")
def get_available_rides(
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    rides = (
        db.query(Ride)
        .filter(
            Ride.status == "PENDING",
            Ride.driver_id.is_(None)
        )
        .all()
    )

    return rides


@router.put("/rides/{ride_id}/accept")
async def accept_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    active_ride = db.query(Ride).filter(
        Ride.driver_id == current_driver.id,
        Ride.status.in_(["ACCEPTED", "STARTED"])
    ).first()

    if active_ride:
        raise HTTPException(
            status_code=400,
            detail="You already have an active ride"
        )
    if not current_driver.is_available:
        raise HTTPException(
            status_code=400,
            detail="Driver is currently unavailable"
        )
    updated_rows = (
        db.query(Ride)
        .filter(
            Ride.id == ride_id,
            Ride.status == "PENDING",
            Ride.driver_id.is_(None)
        )
        .update(
            {
                Ride.driver_id: current_driver.id,
                Ride.status: "ACCEPTED"
            },
            synchronize_session=False
        )
    )

    if updated_rows == 0:
        db.rollback()

        ride = db.query(Ride).filter(
            Ride.id == ride_id
        ).first()

        if ride is None:
            raise HTTPException(
                status_code=404,
                detail="Ride not found"
            )
        raise HTTPException(
            status_code=409,
            detail="Ride is no longer available"
        )
        
    current_driver.is_available = False
    db.commit()
    db.refresh(current_driver)
    
    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()
    db.refresh(ride)

    await manager.send_status(
        ride_id=ride.id,
        status=ride.status
    )
    
    return {
        "message": "Ride accepted successfully",
        "ride_id": ride.id,
        "driver_id": current_driver.id,
        "status": ride.status
    }


@router.put("/rides/{ride_id}/start")
async def start_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    ride = (
        db.query(Ride)
        .filter(Ride.id == ride_id)
        .first()
    )

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )

    if ride.driver_id != current_driver.id:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this ride"
        )

    if ride.status != "ACCEPTED":
        raise HTTPException(
            status_code=400,
            detail="Only an ACCEPTED ride can be started"
        )

    ride.status = "STARTED"

    db.commit()
    db.refresh(ride)

    await manager.send_status(
        ride_id=ride.id,
        status=ride.status
    )

    return {
        "message": "Ride started successfully",
        "ride_id": ride.id,
        "driver_id": current_driver.id,
        "status": ride.status
    }


@router.put("/rides/{ride_id}/complete")
async def complete_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    ride = (
        db.query(Ride)
        .filter(Ride.id == ride_id)
        .first()
    )

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )

    if ride.driver_id != current_driver.id:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this ride"
        )

    if ride.status != "STARTED":
        raise HTTPException(
            status_code=400,
            detail="Only a STARTED ride can be completed"
        )

    ride.status = "COMPLETED"
    
    current_driver.is_available = True

    db.commit()
    db.refresh(ride)
    await manager.send_status(
        ride_id=ride.id,
        status=ride.status
    )

    return {
        "message": "Ride completed successfully",
        "ride_id": ride.id,
        "driver_id": current_driver.id,
        "status": ride.status,
        "driver_available": current_driver.is_available
    }


@router.put("/availability")
def update_availability(
    data: DriverAvailability,
    db: Session = Depends(get_db),
    current_driver: Driver = Depends(get_current_driver)
):
    if not data.is_available:
        active_ride = (
            db.query(Ride)
            .filter(
                Ride.driver_id == current_driver.id,
                Ride.status.in_(["ACCEPTED", "STARTED"])
            )
            .first()
        )

        if active_ride:
            raise HTTPException(
                status_code=400,
                detail="Cannot become unavailable while handling an active ride"
            )

    current_driver.is_available = data.is_available

    db.commit()
    db.refresh(current_driver)

    return {
        "message": "Driver availability updated successfully",
        "is_available": current_driver.is_available
    }


@router.put("/location")
async def update_driver_location(
    data: DriverLocation,
    current_driver: Driver = Depends(get_current_driver),
    db: Session = Depends(get_db)
):
    ride = (
        db.query(Ride)
        .filter(Ride.id == data.ride_id)
        .first()
    )

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )

    if ride.driver_id != current_driver.id:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this ride"
        )

    if ride.status not in ["ACCEPTED", "STARTED"]:
        raise HTTPException(
            status_code=400,
            detail="Location cannot be updated for this ride"
        )

    current_driver.latitude = data.latitude
    current_driver.longitude = data.longitude

    db.commit()
    db.refresh(current_driver)

    await manager.send_location(
        ride_id=data.ride_id,
        latitude=data.latitude,
        longitude=data.longitude
    )
    return {
        "message": "Location updated successfully",
        "ride_id": data.ride_id,
        "latitude": data.latitude,
        "longitude": data.longitude
    }
from app.utils.distance import calculate_distance
from app.db.models.ride import Ride

@router.get("/rides/nearby")
def get_nearby_distance(
    radius_km:float=5.0,
    db:Session = Depends(get_db),
    current_driver:Driver = Depends(get_current_driver)
):
    if current_driver.latitude is None or current_driver.longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Driver location is not available"
        )
    rides = db.query(Ride).filter(
        Ride.status == "PENDING",Ride.driver_id.is_(None)
    ).all()
    nearby_rides = []
    for ride in rides:
        distance = calculate_distance(
            current_driver.latitude,
            current_driver.longitude,
            ride.pickup_lat,
            ride.pickup_lng
        )
        if distance <= radius_km:
            nearby_rides.append({
                "ride_id": ride.id,
                "pickup_loc": ride.pickup_loc,
                "drop_loc": ride.drop_loc,
                "pickup_lat": ride.pickup_lat,
                "pickup_lng": ride.pickup_lng,
                "drop_lat": ride.drop_lat,
                "drop_lng": ride.drop_lng,
                "distance_km": round(distance, 2),
                "status": ride.status
            })
            nearby_rides.sort(key=lambda ride: ride["distance_km"])
            return {
                "radius_km": radius_km,
                "total_nearby_rides": len(nearby_rides),
                "rides": nearby_rides
            }