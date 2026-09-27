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
from app.schemas.chat import ChatMessageCreate
router = APIRouter(
    prefix='/rides',
    tags=['Ride']
)

@router.post('/',status_code=201)
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
@router.get('/my-rides')
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
):
    ride = db.query(Ride).filter(Ride.id==ride_id).first()
    if ride is None:
        raise HTTPException(status_code=404,detail="Ride not found")
    if ride.driver_id is None:
        raise HTTPException(
            status_code=400,detail="No driver has accepted this ride"
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

@router.get('/search')
def search_ride(
    status: str=None,
    pickup:str=None,
    db:Session=Depends(get_db),
    current_student:Student=Depends(get_current_student)
):
    query = db.query(Ride).filter(
        Ride.student_id==current_student.id
    )
    if status:
        query = query.filter(
            Ride.status == status.upper()
        )
    if pickup:
        query = query.filter(
            Ride.pickup_loc.ilike(f"%{pickup}%")
        )
    rides = query.order_by(
        Ride.created_at.desc()
    ).all()
    return{
        "total_rides": len(rides),
        "rides": [
            {
                "ride_id": ride.id,
                "pickup_loc": ride.pickup_loc,
                "drop_loc": ride.drop_loc,
                "status": ride.status,
                "created_at": ride.created_at
            }
            for ride in rides
        ]
    }


@router.websocket("/ws/{ride_id}")
async def ride_location_websocket(
    websocket: WebSocket,
    ride_id: int
):
    await manager.connect(ride_id, websocket)
    try:
        while True:
            data_str = await websocket.receive_text()
            try:
                import json
                payload = json.loads(data_str)
                if payload.get("type") == "chat_message":
                    await manager.broadcast(ride_id, {
                        "type": "chat_message",
                        "ride_id": ride_id,
                        "sender_role": payload.get("sender_role", "user"),
                        "sender_name": payload.get("sender_name", "User"),
                        "message": payload.get("message", ""),
                        "timestamp": payload.get("timestamp", "")
                    })
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(ride_id, websocket)

@router.get("/{ride_id}/messages")
def get_ride_messages(
    ride_id: int,
    db: Session = Depends(get_db)
):
    from app.db.models.chat import RideChatMessage
    messages = db.query(RideChatMessage).filter(
        RideChatMessage.ride_id == ride_id
    ).order_by(RideChatMessage.created_at.asc()).all()

    return [
        {
            "id": msg.id,
            "ride_id": msg.ride_id,
            "sender_role": msg.sender_role,
            "sender_name": msg.sender_name,
            "message": msg.message,
            "created_at": msg.created_at.isoformat() if msg.created_at else ""
        }
        for msg in messages
    ]

@router.post("/{ride_id}/messages")
async def post_ride_message(
    ride_id: int,
    data: ChatMessageCreate,
    db: Session = Depends(get_db)
):
    from app.db.models.chat import RideChatMessage
    from app.db.models.ride import Ride

    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    sender_role = getattr(data, "sender_role", "user")
    sender_name = getattr(data, "sender_name", "User")

    chat_msg = RideChatMessage(
        ride_id=ride_id,
        sender_role=sender_role,
        sender_name=sender_name,
        message=data.message
    )
    db.add(chat_msg)
    db.commit()
    db.refresh(chat_msg)

    timestamp_str = chat_msg.created_at.strftime("%I:%M %p") if chat_msg.created_at else ""

    # Broadcast via WebSocket
    await manager.broadcast(ride_id, {
        "type": "chat_message",
        "ride_id": ride_id,
        "sender_role": sender_role,
        "sender_name": sender_name,
        "message": data.message,
        "timestamp": timestamp_str
    })

    return {
        "id": chat_msg.id,
        "ride_id": ride_id,
        "sender_role": sender_role,
        "sender_name": sender_name,
        "message": data.message,
        "created_at": timestamp_str
    }

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


@router.put("/{ride_id}/cancel")
async def cancel_ride(
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

    await manager.send_status(
        ride_id=ride.id,
        status=ride.status
    )
    
    await manager.send_notification(
            ride_id=ride.id,
            title="Ride Cancelled",
            message="Your ride has been cancelled"
    )

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

    # If no active ride, check if there was a recent OTP verification cancellation
    if ride is None:
        from datetime import datetime, timezone, timedelta
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
        recent_failed = db.query(Ride).filter(
            Ride.student_id == current_student.id,
            Ride.status == "CANCELLED",
            Ride.otp_attempts > 0,
            Ride.updated_at >= cutoff
        ).order_by(Ride.updated_at.desc()).first()

        if recent_failed is not None:
            driver_info = None
            if recent_failed.driver_id:
                driver_obj = db.query(Driver).filter(Driver.id == recent_failed.driver_id).first()
                if driver_obj:
                    driver_info = {
                        "id": driver_obj.id,
                        "name": driver_obj.name,
                        "phone": driver_obj.phone,
                        "vehicle_number": driver_obj.vehicle_number,
                        "vehicle_type": driver_obj.vehicle_type
                    }
            return {
                "message": "Ride cancelled due to OTP error",
                "ride": {
                    "id": recent_failed.id,
                    "pickup_loc": recent_failed.pickup_loc,
                    "drop_loc": recent_failed.drop_loc,
                    "pickup_lat": recent_failed.pickup_lat,
                    "pickup_lng": recent_failed.pickup_lng,
                    "drop_lat": recent_failed.drop_lat,
                    "drop_lng": recent_failed.drop_lng,
                    "status": "CANCELLED",
                    "otp": recent_failed.otp,
                    "otp_attempts": recent_failed.otp_attempts,
                    "otp_failed": True,
                    "driver": driver_info
                }
            }

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
        "status": ride.status,
        "otp": ride.otp if ride.status in ["ACCEPTED", "STARTED"] else None,
        "otp_attempts": ride.otp_attempts or 0
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


@router.post("/{ride_id}/regenerate-otp")
async def regenerate_ride_otp(
    ride_id: int,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    ride = db.query(Ride).filter(
        Ride.id == ride_id,
        Ride.student_id == current_student.id
    ).first()

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if ride.status not in ["ACCEPTED", "CANCELLED"]:
        raise HTTPException(
            status_code=400,
            detail="OTP can only be regenerated for active or verification-failed rides"
        )

    import random
    new_otp = f"{random.randint(1000, 9999)}"
    ride.otp = new_otp
    ride.otp_attempts = 0

    # If the ride was cancelled due to OTP error, reactivate with driver if available
    if ride.status == "CANCELLED" and ride.driver_id:
        driver = db.query(Driver).filter(Driver.id == ride.driver_id).first()
        if driver:
            other_active = db.query(Ride).filter(
                Ride.driver_id == driver.id,
                Ride.id != ride.id,
                Ride.status.in_(["ACCEPTED", "STARTED"])
            ).first()
            if not other_active:
                ride.status = "ACCEPTED"
                driver.is_available = False
                db.add(driver)

    db.commit()
    db.refresh(ride)

    await manager.send_notification(
        ride_id=ride.id,
        title="New OTP Generated",
        message="Student generated a new OTP. Please verify to start trip."
    )
    await manager.send_status(
        ride_id=ride.id,
        status=ride.status
    )

    return {
        "message": "OTP regenerated successfully",
        "ride_id": ride.id,
        "otp": new_otp,
        "status": ride.status
    }
from typing import Optional
from app.repositories.ride_repository import (
    get_student_ride_history
)

@router.get("/history")
def ride_history(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_student: Student = Depends(get_current_student)
):
    if status and status not in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be COMPLETED or CANCELLED"
        )

    rides = get_student_ride_history(
        db=db,
        student_id=current_student.id,
        status=status
    )

    return {
        "total_rides": len(rides),
        "rides": [
            {
                "ride_id": ride.id,
                "pickup_loc": ride.pickup_loc,
                "drop_loc": ride.drop_loc,
                "status": ride.status,
                "created_at": ride.created_at
            }
            for ride in rides
        ]
    }

