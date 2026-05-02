from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: Literal["admin", "manager", "empleado"] = "empleado"
    department: Optional[str] = None
    position: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "1",
                "email": "admin@empresa.com",
                "name": "Admin Usuario",
                "role": "admin",
                "department": "Administración",
                "position": "Administrador",
                "is_active": True
            }
        }

class User(UserBase):
    id: str
    employee_id: Optional[str] = None
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
