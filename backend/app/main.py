from fastapi import FastAPI
app=FastAPI(
    title="Find My Ride",
    version='1.0.0'
)
@app.get('/')
def health():
    return {'status':'Ready for a Ride'}