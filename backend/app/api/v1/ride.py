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