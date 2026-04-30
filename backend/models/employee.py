from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Employee(BaseModel):
    id: str
    name: str
    position: str
    department: str
    email: str
    avatar: Optional[str] = None
    hireDate: Optional[str] = None  # ISO date YYYY-MM-DD
    evaluations: dict = {}
    kpis_score: int = 0
    eval_360_score: int = 0
    category: str = "B1"
    created_at: datetime = datetime.now()

class EmployeeCreate(BaseModel):
    name: str
    position: str
    department: str
    email: str
    avatar: Optional[str] = None
    hireDate: Optional[str] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    hireDate: Optional[str] = None
    kpis_score: Optional[int] = None
    eval_360_score: Optional[int] = None
