from fastapi import APIRouter,Depends,HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_student,get_db
from app.db.models.student import Student
from app.schemas.ride import RideCreate
from app.services.ride_service import book_ride, my_rides
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
