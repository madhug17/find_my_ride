# Find My Ride 🚕🎓

Find My Ride is a campus ride-sharing and booking web application built with FastAPI and vanilla JavaScript.

## How to Run

### 1. Start the Server
From the project root directory, run:
```bash
python main.py
```
This starts the backend FastAPI server on `http://localhost:8000` and automatically serves the frontend interface.

### 2. Access the Application in Your Browser
Open your browser and navigate to:
- **Main Home Page**: [http://localhost:8000/](http://localhost:8000/)
- **Student Registration**: [http://localhost:8000/register.html](http://localhost:8000/register.html)
- **Student Login**: [http://localhost:8000/login.html](http://localhost:8000/login.html)
- **Driver Login**: [http://localhost:8000/driver-login.html](http://localhost:8000/driver-login.html)

> ⚠️ **Important**: Do not open the `.html` files directly in your browser using `file://` scheme (e.g. double-clicking `register.html`), as modern browsers restrict cross-origin requests and storage access on local file origins. Always serve the app via `http://localhost:8000`.
