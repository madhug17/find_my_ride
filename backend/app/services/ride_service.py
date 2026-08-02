from sqlalchemy.orm import Session
from app.db.models.ride import Ride
from app.repositories.ride_repository import(create_ride,get_ride_by_id,get_student_rides)
def book_ride(db,current_student,data):
    ride = Ride(
        student_id = current_student.id,
        pickup_loc = data.pickup_loc,
        drop_loc = data.drop_loc,
        pickup_lat=data.pickup_lat,
        pickup_lng=data.pickup_lng,
        drop_lat=data.drop_lat,
        drop_lng=data.drop_lng,
        status = "PENDING"
    )
    return create_ride(db,ride)
def my_rides(db,current_student):
    return get_student_rides(db,current_student.id)