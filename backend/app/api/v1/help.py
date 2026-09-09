from fastapi import APIRouter
from app.schemas.chat import HelpBotQuery

router = APIRouter(
    prefix="/help",
    tags=["Help"]
)

@router.post("/chat")
def help_bot_query(data: HelpBotQuery):
    q = (data.question or "").strip().lower()
    role = (data.role or "student").lower()

    if not q:
        return {
            "answer": "Hello! I am your Find My Ride Campus Support Assistant. How can I help you today?"
        }

    if "book" in q or "request" in q:
        answer = "To book a campus ride, enter your Pickup and Drop locations on the Student Dashboard (or click pins directly on the map), review the estimated fare, and click 'Request Campus Ride'."
    elif "accept" in q or "driver" in q and "get" in q:
        answer = "As a driver, toggle your status switch to 'Online'. Available ride requests nearby will appear automatically. Click 'Accept Ride Request' to start navigation."
    elif "fare" in q or "price" in q or "cost" in q or "rate" in q:
        answer = "Campus ride fares start with a base fare of ₹30 plus ₹15 per kilometer based on the direct route distance."
    elif "cancel" in q:
        answer = "Students can cancel pending ride requests anytime using the 'Cancel Ride' button on the Active Ride card."
    elif "chat" in q or "message" in q or "talk" in q:
        answer = "Once a ride is accepted, an in-app Live Chat box opens inside the Active Ride card so you can text your driver or passenger directly in real-time."
    elif "gps" in q or "location" in q or "map" in q:
        answer = "Our interactive maps use real HTML5 browser GPS coordinates. Click 'Use My Current GPS' to auto-center the map at your exact physical location."
    elif "emergency" in q or "contact" in q or "admin" in q or "support" in q:
        answer = "For urgent campus security or trip emergencies, call Campus Dispatch directly at +91 9876543210 or contact admin@woxsen.edu.in."
    else:
        if role == "driver":
            answer = f"Thanks for asking. As a driver, make sure your online toggle is ON and your GPS location is updated to receive ride requests. You can also chat directly with your assigned passenger during active trips."
        else:
            answer = f"Thanks for asking. Find My Ride allows you to request campus rides, track driver live position, chat with your driver in real-time, and view trip history."

    return {
        "question": data.question,
        "answer": answer
    }
