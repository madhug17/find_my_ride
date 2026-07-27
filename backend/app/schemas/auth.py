from pydantic import BaseModel,EmailStr
class StudentRegister(BaseModel):
    name: str
    email:str
    phone: int
    password: str
class StudentLogin(BaseModel):
    email:EmailStr
    password:str
class Token(BaseModel):
    access_token: str
    token_type: str