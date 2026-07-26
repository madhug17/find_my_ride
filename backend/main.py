from fastapi import FastAPI
app =FastAPI(
    title="Find My Ride API",
    version="1.0.0"
)
@app.get('/')
def root():
    return{
        "message": "|Welcome to Find My Ride API|"
    }
@app.get('/health')
def health():
    return{
        "status": "Healthy"
    }