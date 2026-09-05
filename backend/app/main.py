from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.ride import router as ride_router
from app.api.v1.driver import router as driver_router

from app.db.database import Base, engine
import app.db.base

from app.db.models.student import Student
from app.db.models.driver import Driver
from app.db.models.rating import Rating

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Find My Ride",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:30000",
        "http://127.0.0.1:30000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ride_router)
app.include_router(driver_router)


@app.get("/health")
def health():
    return {"status": "Ready for a Ride"}


@app.get("/")
def root():
    return {"message": "Find My Ride Backend Running"}