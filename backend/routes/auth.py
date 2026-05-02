from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4

from models.user import UserCreate, User, Token
from utils.auth import verify_password, get_password_hash, create_access_token
from middlewares.auth import db, get_current_active_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Login de usuario"""
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    
    user_data = {
        "id": user["id"],
        "employee_id": user.get("employee_id"),
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "department": user.get("department"),
        "position": user.get("position"),
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at", datetime.now())
    }
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/register", response_model=User)
async def register(user_data: UserCreate):
    """Registrar nuevo usuario (solo admin puede crear usuarios)"""
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = {
        "id": str(uuid4()),
        "email": user_data.email,
        "name": user_data.name,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_data.role,
        "department": user_data.department,
        "position": user_data.position,
        "is_active": user_data.is_active,
        "created_at": datetime.now()
    }
    
    await db.users.insert_one(new_user)
    
    return {
        "id": new_user["id"],
        "email": new_user["email"],
        "name": new_user["name"],
        "role": new_user["role"],
        "department": new_user["department"],
        "position": new_user["position"],
        "is_active": new_user["is_active"],
        "created_at": new_user["created_at"]
    }

@router.get("/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_active_user)):
    """Obtener usuario actual"""
    return {
        "id": current_user["id"],
        "employee_id": current_user.get("employee_id"),
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "department": current_user.get("department"),
        "position": current_user.get("position"),
        "is_active": current_user.get("is_active", True),
        "created_at": current_user.get("created_at", datetime.now())
    }

@router.post("/logout")
async def logout():
    """Logout (client-side debe eliminar el token)"""
    return {"message": "Successfully logged out"}
