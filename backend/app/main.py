from fastapi import FastAPI
from app.api.v1.auth import router as auth_router
from app.db.base import Base
from app.db.database import engine
from app.db.models.student import Student
from app.db.models.driver import Driver
from app.api.v1.ride import router as ride_router
Base.metadata.create_all(bind=engine)

app=FastAPI(
    title="Find My Ride",
    version='1.0.0'
)
app.include_router(auth_router)
@app.get('/health')
def health():
    return {'status':'Ready for a Ride'}
app.include_router(ride_router)
@app.get('/')
def root():
    return{"message": "Find My Ride Backend Running "}