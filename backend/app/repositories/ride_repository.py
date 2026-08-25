from sqlalchemy.orm import Session
from app.db.models.ride import Ride
def create_ride(db: Session,ride: Ride):
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride
def get_student_rides(db:Session,student_id: int):
    return(
        db.query(Ride)
        .filter(Ride.student_id==student_id)
        .all()
    )
def get_ride_by_id(db: Session,ride_id:int):
    return(db.query(Ride).filter(Ride.id==ride_id).first())
def get_student_ride_history(
    db,
    student_id,
    status=None
):
    query = db.query(Ride).filter(
        Ride.student_id == student_id,
        Ride.status.in_(["COMPLETED", "CANCELLED"])
    )

    if status:
        query = query.filter(
            Ride.status == status
        )

    return query.order_by(
        Ride.created_at.desc()
    ).all()


def get_driver_ride_history(
    db,
    driver_id,
    status=None
):
    query = db.query(Ride).filter(
        Ride.driver_id == driver_id,
        Ride.status.in_(["COMPLETED", "CANCELLED"])
    )

    if status:
        query = query.filter(
            Ride.status == status
        )

    return query.order_by(
        Ride.created_at.desc()
    ).all()