from pydantic import BaseModel
class RideCreate(BaseModel):
    pickup_loc: str
    drop_loc: str

    pickup_lat: float
    pickup_lng: float

    drop_lat: float
    drop_lng: float
class RideResponse(BaseModel):
    id: int
    pickup_loc: str
    drop_loc: str
    status: str
    class Congig:
        from_attributes: True
class DriverLocationResponse(BaseException):
    driver_id : int
    latitude: float
    longitude: float