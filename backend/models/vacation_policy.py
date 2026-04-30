from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VacationPolicy(BaseModel):
    id: str
    name: str = ""                 # ej. "0 - 1 año"
    yearsFrom: int                 # >= yearsFrom
    yearsTo: int                   # < yearsTo (excluyente). Use 999 for "or more"
    days: int
    description: Optional[str] = None
    createdAt: datetime = datetime.now()


class VacationPolicyCreate(BaseModel):
    name: Optional[str] = ""
    yearsFrom: int
    yearsTo: int
    days: int
    description: Optional[str] = None


class VacationPolicyUpdate(BaseModel):
    name: Optional[str] = None
    yearsFrom: Optional[int] = None
    yearsTo: Optional[int] = None
    days: Optional[int] = None
    description: Optional[str] = None


class Holiday(BaseModel):
    id: str
    date: str                      # ISO date YYYY-MM-DD
    name: str
    country: Optional[str] = "ES"
    recurring: bool = False        # si se repite cada año (mismo día/mes)


class HolidayCreate(BaseModel):
    date: str
    name: str
    country: Optional[str] = "ES"
    recurring: bool = False


class HolidayUpdate(BaseModel):
    date: Optional[str] = None
    name: Optional[str] = None
    country: Optional[str] = None
    recurring: Optional[bool] = None


# ---- Suggested Vacation Ranges ----

class SuggestedRange(BaseModel):
    id: str
    name: str
    startDate: str      # YYYY-MM-DD
    endDate: str        # YYYY-MM-DD
    description: Optional[str] = None
    color: Optional[str] = "slate"   # ui hint: slate | emerald | blue | amber | rose | violet
    createdAt: datetime = datetime.now()


class SuggestedRangeCreate(BaseModel):
    name: str
    startDate: str
    endDate: str
    description: Optional[str] = None
    color: Optional[str] = "slate"


class SuggestedRangeUpdate(BaseModel):
    name: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
