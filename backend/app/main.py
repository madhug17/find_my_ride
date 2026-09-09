import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.auth import router as auth_router
from app.api.v1.ride import router as ride_router
from app.api.v1.driver import router as driver_router
from app.api.v1.help import router as help_router

from app.db.database import Base, engine
import app.db.base

from app.db.models.student import Student
from app.db.models.driver import Driver
from app.db.models.rating import Rating
from app.db.models.chat import RideChatMessage

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Find My Ride",
    version="1.0.0"
)

# Enable CORS for all origins (file://, localhost, live-server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(ride_router)
app.include_router(driver_router)
app.include_router(help_router)


@app.get("/health")
def health():
    return {"status": "Ready for a Ride"}


# Serve Frontend static files directly from root URL
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend"))
if not os.path.exists(frontend_dir):
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))

if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)