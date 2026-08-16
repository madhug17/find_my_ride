from pydantic import BaseModel,EmailStr
class DriverRegister(BaseModel):
    name: str
    email: str
    phone: int
    vehicle_type: str
    password: str
    vehicle_number : int
class DriverLogin(BaseModel):
    email: EmailStr
    password: str
class DriverResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    vehicle_number: str
    vehicle_type: str
    is_available: bool
    class Config:
        from_attributes = True

class DriverAvailability(BaseModel):
    is_available: bool
class DriverLocation(BaseModel):
    latitude: float
    longitude: float