from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from uuid import uuid4
from datetime import datetime, date, timedelta

from models.vacation import (
    VacationRequest,
    VacationRequestCreate,
    VacationStatusUpdate,
    VacationBalance,
)
from middlewares.auth import (
    db,
    get_current_active_user,
    require_admin,
    require_manager_or_admin,
)

router = APIRouter(prefix="/api/vacations", tags=["vacations"])


# ---------- Helpers ----------

# Tipos cuyas solicitudes "Aprobado" RESTAN del saldo de vacaciones
COUNTABLE_TYPES = {"Vacaciones", "Asuntos Propios", "Compensatorio"}
DEFAULT_ANNUAL_DAYS = 12


def parse_iso(d: str) -> date:
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=400, detail=f"Fecha inválida: {d}. Usa formato YYYY-MM-DD")


def count_business_days(start: date, end: date) -> int:
    """Cuenta días laborables (lun-vie) entre start y end inclusive."""
    if end < start:
        return 0
    days = 0
    cur = start
    while cur <= end:
        if cur.weekday() < 5:  # 0=Mon ... 4=Fri
            days += 1
        cur += timedelta(days=1)
    return days


def next_business_day(d: date) -> date:
    """Devuelve el siguiente día hábil después de d."""
    cur = d + timedelta(days=1)
    while cur.weekday() >= 5:
        cur += timedelta(days=1)
    return cur


async def enrich_request(req: dict) -> dict:
    """Adjunta info del empleado (nombre/avatar/departamento) si falta."""
    if not req.get("employeeName") or not req.get("employeeAvatar"):
        emp = await db.employees.find_one({"id": req["employeeId"]}, {"_id": 0})
        if emp:
            req["employeeName"] = emp.get("name")
            req["employeeAvatar"] = emp.get("avatar")
            req["employeeDepartment"] = emp.get("department")
    return req


async def get_or_create_balance(employee_id: str, year: int) -> dict:
    bal = await db.vacation_balances.find_one(
        {"employeeId": employee_id, "year": year}, {"_id": 0}
    )
    if bal:
        return bal

    emp = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    new_bal = {
        "employeeId": employee_id,
        "employeeName": emp.get("name") if emp else None,
        "employeeAvatar": emp.get("avatar") if emp else None,
        "employeeDepartment": emp.get("department") if emp else None,
        "year": year,
        "totalDays": DEFAULT_ANNUAL_DAYS,
        "daysUsed": 0,
        "daysPending": 0,
        "daysAvailable": DEFAULT_ANNUAL_DAYS,
    }
    await db.vacation_balances.insert_one(new_bal.copy())
    return new_bal


async def recompute_balance(employee_id: str, year: int) -> dict:
    """Recalcula balance basado en solicitudes existentes."""
    bal = await get_or_create_balance(employee_id, year)

    # Aprobados que restan
    approved = await db.vacation_requests.find({
        "employeeId": employee_id,
        "status": "Aprobado",
        "type": {"$in": list(COUNTABLE_TYPES)},
    }, {"_id": 0}).to_list(1000)

    days_used = 0
    for r in approved:
        try:
            start = parse_iso(r["startDate"])
            if start.year == year:
                days_used += int(r.get("totalDays", 0))
        except Exception:
            pass

    pending = await db.vacation_requests.find({
        "employeeId": employee_id,
        "status": "Pendiente",
        "type": {"$in": list(COUNTABLE_TYPES)},
    }, {"_id": 0}).to_list(1000)

    days_pending = 0
    for r in pending:
        try:
            start = parse_iso(r["startDate"])
            if start.year == year:
                days_pending += int(r.get("totalDays", 0))
        except Exception:
            pass

    total = bal.get("totalDays", DEFAULT_ANNUAL_DAYS)
    available = max(total - days_used, 0)

    await db.vacation_balances.update_one(
        {"employeeId": employee_id, "year": year},
        {"$set": {
            "daysUsed": days_used,
            "daysPending": days_pending,
            "daysAvailable": available,
            "totalDays": total,
        }},
        upsert=True,
    )
    bal.update({
        "daysUsed": days_used,
        "daysPending": days_pending,
        "daysAvailable": available,
    })
    return bal


# ---------- Balance Endpoints ----------

@router.get("/balance/me", response_model=VacationBalance)
async def get_my_balance(
    year: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_active_user),
):
    employee_id = current_user.get("employee_id")
    if not employee_id:
        raise HTTPException(status_code=400, detail="Usuario no vinculado a un empleado")
    y = year or datetime.now().year
    return await recompute_balance(employee_id, y)


@router.get("/balances", response_model=List[VacationBalance])
async def list_balances(
    year: Optional[int] = Query(None),
    current_user: dict = Depends(require_manager_or_admin),
):
    y = year or datetime.now().year
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    out = []
    for emp in employees:
        bal = await recompute_balance(emp["id"], y)
        out.append(bal)
    return out


@router.get("/balance/{employee_id}", response_model=VacationBalance)
async def get_employee_balance(
    employee_id: str,
    year: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_active_user),
):
    # empleados solo pueden ver su propio balance
    if current_user.get("role") not in ["admin", "manager"]:
        if current_user.get("employee_id") != employee_id:
            raise HTTPException(status_code=403, detail="No autorizado")
    y = year or datetime.now().year
    return await recompute_balance(employee_id, y)


# ---------- Requests Endpoints ----------

@router.get("", response_model=List[VacationRequest])
async def list_requests(
    status: Optional[str] = Query(None),
    employee_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user),
):
    """Lista solicitudes. Empleados solo ven las suyas; admin ve todas."""
    query = {}

    role = current_user.get("role")
    if role not in ["admin", "manager"]:
        query["employeeId"] = current_user.get("employee_id")
    elif employee_id and employee_id != "all":
        query["employeeId"] = employee_id

    if status and status != "all":
        query["status"] = status
    if type and type != "all":
        query["type"] = type

    requests = await db.vacation_requests.find(query, {"_id": 0}).sort("createdAt", -1).to_list(1000)

    # enrich + filtro por nombre
    out = []
    for r in requests:
        r = await enrich_request(r)
        if search:
            name = (r.get("employeeName") or "").lower()
            if search.lower() not in name:
                continue
        out.append(r)
    return out


@router.get("/{request_id}", response_model=VacationRequest)
async def get_request(
    request_id: str,
    current_user: dict = Depends(get_current_active_user),
):
    req = await db.vacation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    role = current_user.get("role")
    if role not in ["admin", "manager"] and req["employeeId"] != current_user.get("employee_id"):
        raise HTTPException(status_code=403, detail="No autorizado")
    return await enrich_request(req)


@router.post("", response_model=VacationRequest)
async def create_request(
    data: VacationRequestCreate,
    current_user: dict = Depends(get_current_active_user),
):
    role = current_user.get("role")

    # Determinar empleado
    if role in ["admin", "manager"]:
        employee_id = data.employeeId or current_user.get("employee_id")
        if not employee_id:
            raise HTTPException(status_code=400, detail="employeeId requerido")
    else:
        employee_id = current_user.get("employee_id")
        if not employee_id:
            raise HTTPException(status_code=400, detail="Usuario no vinculado a un empleado")

    # Validar fechas
    start = parse_iso(data.startDate)
    end = parse_iso(data.endDate)
    today = date.today()

    if start < today:
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser en el pasado")
    if end < start:
        raise HTTPException(status_code=400, detail="La fecha de fin debe ser posterior o igual a la de inicio")

    total_days = count_business_days(start, end)
    if total_days <= 0:
        raise HTTPException(status_code=400, detail="El rango debe incluir al menos un día laborable")

    return_date = next_business_day(end)

    # Validar saldo si el tipo cuenta y no es "Justificado"
    if data.type in COUNTABLE_TYPES:
        bal = await recompute_balance(employee_id, start.year)
        # daysAvailable - daysPending para evitar sobrepasar
        effective = bal["daysAvailable"] - bal.get("daysPending", 0)
        if total_days > effective:
            raise HTTPException(
                status_code=400,
                detail=f"Saldo insuficiente. Disponibles: {effective} días, solicitados: {total_days}",
            )

    # Empleado info
    emp = await db.employees.find_one({"id": employee_id}, {"_id": 0})

    new_req = {
        "id": str(uuid4()),
        "employeeId": employee_id,
        "employeeName": emp.get("name") if emp else None,
        "employeeAvatar": emp.get("avatar") if emp else None,
        "employeeDepartment": emp.get("department") if emp else None,
        "type": data.type,
        "startDate": data.startDate,
        "endDate": data.endDate,
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "totalDays": total_days,
        "status": "Pendiente",
        "reason": data.reason or "",
        "adminComment": None,
        "attachmentUrl": data.attachmentUrl,
        "createdAt": datetime.now(),
        "reviewedAt": None,
        "reviewedBy": None,
    }
    await db.vacation_requests.insert_one(new_req.copy())
    await recompute_balance(employee_id, start.year)
    return new_req


@router.patch("/{request_id}/status", response_model=VacationRequest)
async def update_status(
    request_id: str,
    data: VacationStatusUpdate,
    current_user: dict = Depends(require_manager_or_admin),
):
    req = await db.vacation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    update = {
        "status": data.status,
        "adminComment": data.adminComment,
        "reviewedAt": datetime.now(),
        "reviewedBy": current_user.get("name") or current_user.get("email"),
    }
    await db.vacation_requests.update_one({"id": request_id}, {"$set": update})

    # Recompute balance del empleado afectado
    try:
        start = parse_iso(req["startDate"])
        await recompute_balance(req["employeeId"], start.year)
    except Exception:
        pass

    updated = await db.vacation_requests.find_one({"id": request_id}, {"_id": 0})
    return await enrich_request(updated)


@router.delete("/{request_id}")
async def delete_request(
    request_id: str,
    current_user: dict = Depends(get_current_active_user),
):
    req = await db.vacation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    role = current_user.get("role")
    is_owner = req["employeeId"] == current_user.get("employee_id")
    is_admin = role in ["admin", "manager"]

    # Empleado solo puede cancelar SUS pendientes; admin puede borrar cualquiera
    if not is_admin:
        if not is_owner:
            raise HTTPException(status_code=403, detail="No autorizado")
        if req["status"] != "Pendiente":
            raise HTTPException(status_code=400, detail="Solo se pueden cancelar solicitudes pendientes")

    await db.vacation_requests.delete_one({"id": request_id})

    try:
        start = parse_iso(req["startDate"])
        await recompute_balance(req["employeeId"], start.year)
    except Exception:
        pass

    return {"message": "Solicitud eliminada"}


# ---------- Admin: ajustar saldo total ----------

@router.put("/balance/{employee_id}/adjust")
async def adjust_balance(
    employee_id: str,
    payload: dict,
    current_user: dict = Depends(require_manager_or_admin),
):
    """Permite al admin ajustar el total de días de un empleado para un año."""
    year = int(payload.get("year") or datetime.now().year)
    total = int(payload.get("totalDays", DEFAULT_ANNUAL_DAYS))
    await db.vacation_balances.update_one(
        {"employeeId": employee_id, "year": year},
        {"$set": {"totalDays": total}},
        upsert=True,
    )
    return await recompute_balance(employee_id, year)
