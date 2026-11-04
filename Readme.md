# Find My Ride — Campus Ride Booking & Mobility Platform

A full-stack campus mobility web application that connects university students with verified campus drivers. Students can book individual or shared rides, track active trips, verify boarding through OTP, and communicate with their assigned driver.

The platform is designed to simplify weekend transportation between the university campus and nearby destinations while providing a structured, safer, and more transparent ride-booking experience.

## Project Overview

- **Project:** Find My Ride
- **Category:** Full-Stack Web Application / Campus Mobility
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL
- **Real-Time Communication:** WebSockets
- **Infrastructure:** Docker, Kubernetes (development/deployment work), Render
- **Mapping:** Interactive maps and route visualization
- **Authentication:** JWT-based authentication with role-based access

## Problem Statement

Students living on campus often depend on limited transportation options when travelling outside the university, especially during weekends.

Existing transportation arrangements can create problems such as:

- Difficulty finding available drivers.
- Unclear ride availability and pricing.
- Limited visibility into driver and vehicle details.
- Difficulty coordinating shared rides.
- Lack of centralized trip tracking and communication.

Find My Ride addresses these problems through a centralized campus ride-booking platform.

## Key Features

### 1. Student Portal
- Student registration and authentication.
- Ride booking with pickup and destination selection.
- Car and Auto ride options.
- Individual and shared ride booking.
- Ride history and booking status.
- Profile management.

### 2. Driver Portal
- Separate driver authentication and dashboard.
- Driver availability management.
- View and accept available ride requests.
- Manage active and completed trips.
- Driver profile and vehicle information.

### 3. Ride Assignment & Booking
- Backend-controlled ride acceptance.
- Prevent multiple drivers from accepting the same ride.
- Ride lifecycle management:
  `PENDING → ACCEPTED → STARTED → COMPLETED`
- Booking and seat availability management for shared rides.

### 4. OTP-Based Ride Verification
- OTP-based passenger boarding verification.
- Booking-specific verification.
- Validation and attempt-limit handling.
- Protected verification workflows.

### 5. Live Ride Tracking
- Interactive route visualization.
- Pickup and destination information.
- Real-time ride updates using WebSockets.
- Driver and passenger communication.

### 6. Safety & Driver Verification
- Driver verification workflow.
- Identity and driving-licence review statuses.
- Campus safety information.
- Emergency SOS interface.
- Access-controlled driver and passenger information.

### 7. Platform Commission
- Configurable platform commission model.
- Driver earnings and fee calculations.
- Booking-level financial records.
- Commission calculation designed to use accurate decimal arithmetic.

## System Architecture

```text
                 STUDENT / DRIVER
                        |
                        v
              HTML / CSS / JavaScript
                        |
                        v
                  FastAPI Backend
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
      Authentication  Ride Engine   WebSockets
          |             |             |
          +-------------+-------------+
                        |
                        v
                   PostgreSQL
                        |
                        v
              Persistent Ride Data
```

## Engineering Challenges & Solutions

| Challenge | Engineering approach |
|---|---|
| Concurrent ride acceptance | Atomic database-level assignment and transaction handling |
| Shared ride seat availability | Transaction-safe booking and seat management |
| Unauthorized access | JWT authentication and role-based authorization |
| Passenger boarding verification | Booking-specific OTP validation |
| Real-time ride updates | WebSocket communication |
| Database schema changes | Controlled database migrations |
| Production deployment | Docker-based deployment and environment configuration |


### How performance improvement is calculated

For response-time reduction:

`Reduction (%) = ((Before - After) / Before) × 100`

Example calculation only:

If an API's p95 response time changes from 800 ms to 400 ms:

`((800 - 400) / 800) × 100 = 50% reduction`

This is an illustration, not a measured Find My Ride result.

## Deployment

The application has been deployed using Render:

- **Frontend:** https://find-my-ride-frontend.onrender.com
- **Backend:** https://find-my-ride.onrender.com
- **API Documentation:** https://find-my-ride.onrender.com/docs

## Running Locally

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Find_my_ride
```

### 2. Configure the backend

```bash
cd backend
python -m venv venv
```

Activate the environment and install dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables, including the PostgreSQL database URL and application secret.

### 3. Start the backend

```bash
uvicorn app.main:app --reload
```

### 4. Run the frontend

Serve the frontend directory using a local static web server and configure its API URL to point to the running FastAPI backend.

## Future Improvements

- Automated driver verification integrations.
- Payment gateway and marketplace settlement integration.
- Improved database query optimization.
- Automated performance benchmarking.
- Centralized monitoring and observability.
- Production-grade CI/CD pipeline.
- Improved fault tolerance and scalability.

## Author

**Goundla Madhu Goud**

B.Tech — Artificial Intelligence & Machine Learning  
Woxsen University, Hyderabad

GitHub: https://github.com/madhug17

---

*Find My Ride is an ongoing engineering project focused on backend correctness, secure ride assignment, real-time communication, and reliable campus mobility.*
