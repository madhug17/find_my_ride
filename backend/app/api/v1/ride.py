from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_student,get_db
from app.db.models.student import Student
from app.schemas.ride import RideCreate
from app.services.ride_service import book_ride, my_rides
from app.db.models.ride import Ride
from app.db.models.student import Student
from fastapi import WebSocket,WebSocketDisconnect
from app.websocket.connection_manager import manager
from app.db.models.driver import Driver
from app.schemas.rating import RatingCreate
from app.db.models.rating import Rating
router = APIRouter(
    prefix='/ride',
    tags=['RIde']
)

@router.post('/book')
def create_new_ride(
    data: RideCreate,
    db: Session = Depends(get_db),
    current_student: Student= Depends(get_current_student)
):
    try:
        ride=book_ride(
            db=db,
            current_student=current_student,
            data=data
        )
        return{
            "message": "Ride booked successfully",
            "ride_id": ride.id,
            "status": ride.status,
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,detail=str(e)
        )
@router.get('/my-rices')
def get_my_rides(
    db: Session = Depends(get_db),
    current_student : Student = Depends(get_current_student),
):
    try:
        rides = my_rides(db,current_student)
        return rides
    except Exception as e:
        raise HTTPException(
            status_code=400,detail=str(e)
        )

@router.get("/{ride_id}/driver-location")
def get_driver_location(
    ride_id:int,
    db:Session =Depends(get_db),
    current_student: Student=Depends(get_current_student)

):
    ride = db.query(Ride).filter(Ride.id==ride_id,Ride.student_id==current_student.id).first()
    if ride is None:
        raise HTTPException(status_code=404,detail="Ride not found")
    if ride.driver_id is None:
        raise HTTPException(
            status_code=400,detail="No driver has jaccepted this ride"
        )
    driver = ride.driver
    if driver is None:
        raise HTTPException(status_code=404,detail="Driver not found")
    if driver.latitude is None or driver.longitude is None:
        raise HTTPException(
            status_code=400,detail="Driver location is not available"
        )
    return{
        "driver_id": driver.id,
        "latitude": driver.latitude,
        "longitude": driver.longitude
    }

@router.websocket("/ws/{ride_id}")
async def ride_location_websocket(
    websocket:WebSocket,
    ride_id:int
):
    await manager.connect(
        ride_id,websocket
    )
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(
            ride_id,
            websocket
        )

@router.get("/{ride_id}/status")
def get_ride_status(
    ride_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    ride = db.query(Ride).filter(
        Ride.id == ride_id
    ).first()

    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )
    if ride.student_id != current_student.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to view this ride"
        )

    response = {
        "ride_id": ride.id,
        "status": ride.status,
        "pickup_loc": ride.pickup_loc,
        "drop_loc": ride.drop_loc,
    }

    if ride.driver_id is not None:
        driver = db.query(Driver).filter(
            Driver.id == ride.driver_id
        ).first()

        response["driver"] = {
            "id": driver.id,
            "name": driver.name,
            "phone": driver.phone,
            "vehicle_number": driver.vehicle_number,
            "vehicle_type": driver.vehicle_type
        }

    return response

@router.get('/history')
def ride_history(
    db:Session=Depends(get_db),
    current_student:Student=Depends(get_current_student)
):
    rides = db.query(Ride).filter(Ride.student_id==current_student.id).order_by(Ride.created_at.desc()).all()
    return rides

@router.put("/{ride_id}/cancel")
def cancel_ride(
    ride_id:int,
    db:Session=Depends(get_db),
    current_student:Student=Depends(get_current_student)

):
    ride = db.query(Ride).filter(Ride.id==ride_id).first()
    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )
    if ride.student_id!=current_student.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to cancel this ride"
        )
    if ride.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Only a PENDING ride can be cancelled"
        )
    ride.status="CANCELLED"
    db.commit()
    db.refresh(ride)
    return {
        "message": "Ride cancelled successfully",
        "ride_id": ride.id,
        "status": ride.status
    }

@router.post("/{ride_id}/rate")
def rate_driver(
    ride_id: int,
    data: RatingCreate,
    db:Session=Depends(get_db),
    current_student:Student = Depends(get_current_student)
):
    ride=db.query(Ride).filter(
        Ride.id == ride_id
    ).first()
    if ride is None:
        raise HTTPException(
            status_code=404,
            detail="Ride not Found"
        )
    if ride.student_id!= current_student.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to rate this ride"
        )
    if ride.status != "COMPLETED":
        raise HTTPException(
            status_code=400,
            detail="Only a COMPLETED ride can be rated"
        )
    if ride.driver_id is None:
        raise HTTPException(
            status_code=400,
            detail="No driver assigned to this ride"
        )
    existing_rating = db.query(Rating).filter(
        Rating.ride_id == ride.id,
        Rating.student_id == current_student.id
    ).first()
    if existing_rating:
        raise HTTPException(
            status_code=400,
            detail="You have already rated this ride"
        )
    new_rating  = Rating(
        ride_id = ride.id,
        student_id = current_student.id,
        driver_id = ride.driver_id,
        rating = data.rating,
        comment = data.comment
    )
    db.add(new_rating)
    db.commit()
    db.refresh(new_rating)
    return {
        "message": "Driver rated successfully",
        "rating_id": new_rating.id,
        "ride_id": ride.id,
        "driver_id": ride.driver_id,
        "rating": new_rating.rating,
        "comment": new_rating.comment
    }

@router.get("/current")
def get_current_ride(
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    ride = db.query(Ride).filter(
        Ride.student_id == current_student.id,
        Ride.status.in_(["PENDING", "ACCEPTED", "STARTED"])
    ).order_by(
        Ride.created_at.desc()
    ).first()

    if ride is None:
        return {
            "message": "No active ride",
            "ride": None
        }

    response = {
        "id": ride.id,
        "pickup_loc": ride.pickup_loc,
        "drop_loc": ride.drop_loc,
        "pickup_lat": ride.pickup_lat,
        "pickup_lng": ride.pickup_lng,
        "drop_lat": ride.drop_lat,
        "drop_lng": ride.drop_lng,
        "status": ride.status
    }

    if ride.driver_id is not None:
        driver = db.query(Driver).filter(
            Driver.id == ride.driver_id
        ).first()

        if driver is not None:
            response["driver"] = {
                "id": driver.id,
                "name": driver.name,
                "phone": driver.phone,
                "vehicle_number": driver.vehicle_number,
                "vehicle_type": driver.vehicle_type
            }

    return {
        "message": "Active ride found",
        "ride": response
    }
