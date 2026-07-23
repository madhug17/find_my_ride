from fastapi import FastAPI,HTTPException
app = FastAPI()
@app.get('/health')
def health():
    return{"fine"}