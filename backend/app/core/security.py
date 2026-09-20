import bcrypt
from datetime import datetime, timezone, timedelta
from jose import jwt
from app.core.config import settings

def _truncate_password(password: str) -> bytes:
    if not password:
        return b""
    # bcrypt max length is 72 bytes
    return str(password).encode("utf-8")[:72]

def hash_password(password: str) -> str:
    pwd_bytes = _truncate_password(password)
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    pwd_bytes = _truncate_password(plain_password)
    try:
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False
def create_access_token(data:dict):
    payload=data.copy()
    expire=datetime.utcnow()+timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp":expire})
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


