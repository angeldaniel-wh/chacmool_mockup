from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import uuid4
from datetime import datetime, date

from models.vacation_policy import (
    VacationPolicy,
    VacationPolicyCreate,
    VacationPolicyUpdate,
    Holiday,
    HolidayCreate,
    HolidayUpdate,
)
from middlewares.auth import (
    db,
    get_current_active_user,
    require_manager_or_admin,
)

router = APIRouter(prefix="/api/vacation-policies", tags=["vacation-policies"])
holidays_router = APIRouter(prefix="/api/vacation-holidays", tags=["vacation-holidays"])


# ---------------- Policies ----------------

@router.get("", response_model=List[VacationPolicy])
async def list_policies(current_user: dict = Depends(get_current_active_user)):
    items = await db.vacation_policies.find({}, {"_id": 0}).sort("yearsFrom", 1).to_list(200)
    return items


@router.post("", response_model=VacationPolicy)
async def create_policy(
    data: VacationPolicyCreate,
    current_user: dict = Depends(require_manager_or_admin),
):
    if data.yearsTo <= data.yearsFrom:
        raise HTTPException(status_code=400, detail="yearsTo debe ser mayor que yearsFrom")
    if data.days <= 0:
        raise HTTPException(status_code=400, detail="days debe ser mayor que 0")
    item = {
        "id": str(uuid4()),
        "name": data.name or f"{data.yearsFrom} - {data.yearsTo} años",
        "yearsFrom": data.yearsFrom,
        "yearsTo": data.yearsTo,
        "days": data.days,
        "description": data.description,
        "createdAt": datetime.now(),
    }
    await db.vacation_policies.insert_one(item.copy())
    return item


@router.put("/{policy_id}", response_model=VacationPolicy)
async def update_policy(
    policy_id: str,
    data: VacationPolicyUpdate,
    current_user: dict = Depends(require_manager_or_admin),
):
    existing = await db.vacation_policies.find_one({"id": policy_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    update = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if "yearsFrom" in update or "yearsTo" in update:
        yf = update.get("yearsFrom", existing["yearsFrom"])
        yt = update.get("yearsTo", existing["yearsTo"])
        if yt <= yf:
            raise HTTPException(status_code=400, detail="yearsTo debe ser mayor que yearsFrom")
    if update:
        await db.vacation_policies.update_one({"id": policy_id}, {"$set": update})
    updated = await db.vacation_policies.find_one({"id": policy_id}, {"_id": 0})
    return updated


@router.delete("/{policy_id}")
async def delete_policy(
    policy_id: str,
    current_user: dict = Depends(require_manager_or_admin),
):
    res = await db.vacation_policies.delete_one({"id": policy_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Política no encontrada")
    return {"message": "Política eliminada"}


# ---------------- Holidays ----------------

@holidays_router.get("", response_model=List[Holiday])
async def list_holidays(current_user: dict = Depends(get_current_active_user)):
    items = await db.vacation_holidays.find({}, {"_id": 0}).sort("date", 1).to_list(500)
    return items


@holidays_router.post("", response_model=Holiday)
async def create_holiday(
    data: HolidayCreate,
    current_user: dict = Depends(require_manager_or_admin),
):
    item = {
        "id": str(uuid4()),
        "date": data.date,
        "name": data.name,
        "country": data.country or "ES",
        "recurring": data.recurring,
    }
    await db.vacation_holidays.insert_one(item.copy())
    return item


@holidays_router.put("/{holiday_id}", response_model=Holiday)
async def update_holiday(
    holiday_id: str,
    data: HolidayUpdate,
    current_user: dict = Depends(require_manager_or_admin),
):
    existing = await db.vacation_holidays.find_one({"id": holiday_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Festivo no encontrado")
    update = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    if update:
        await db.vacation_holidays.update_one({"id": holiday_id}, {"$set": update})
    return await db.vacation_holidays.find_one({"id": holiday_id}, {"_id": 0})


@holidays_router.delete("/{holiday_id}")
async def delete_holiday(
    holiday_id: str,
    current_user: dict = Depends(require_manager_or_admin),
):
    res = await db.vacation_holidays.delete_one({"id": holiday_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Festivo no encontrado")
    return {"message": "Festivo eliminado"}
