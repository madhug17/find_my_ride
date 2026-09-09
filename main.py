import os
import sys
import uvicorn

# Ensure the backend directory is in the Python search path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    os.chdir(backend_dir)
    print("=" * 60)
    print("Starting Find My Ride Backend Server on http://localhost:8000")
    print("=" * 60)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
