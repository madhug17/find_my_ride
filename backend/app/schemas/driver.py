from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class DriverRegister(BaseModel):
    name: str
    email: str
    phone: str
    vehicle_type: str
    password: str
    vehicle_number: str

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
    model_config = ConfigDict(from_attributes=True)

class DriverAvailability(BaseModel):
    is_available: bool

class DriverLocation(BaseModel):
    ride_id: int
    latitude: float
    longitude: float