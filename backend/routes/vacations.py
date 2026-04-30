from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from uuid import uuid4
from datetime import datetime, date, timedelta

from models.vacation import (
    VacationRequest,
    VacationRequestCreate,
    VacationStatusUpdate,
    VacationRequestUpdate,
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


async def get_holiday_set(year: int) -> set:
    """Devuelve un set de fechas (date) que son festivos para el año dado."""
    items = await db.vacation_holidays.find({}, {"_id": 0}).to_list(1000)
    out = set()
    for h in items:
        try:
            d = parse_iso(h["date"])
        except Exception:
            continue
        if h.get("recurring"):
            try:
                out.add(date(year, d.month, d.day))
            except ValueError:
                pass
        else:
            if d.year == year:
                out.add(d)
    return out


def count_business_days(start: date, end: date, holidays: set = None) -> int:
    """Cuenta días laborables (lun-vie) entre start y end inclusive, excluyendo festivos."""
    if end < start:
        return 0
    holidays = holidays or set()
    days = 0
    cur = start
    while cur <= end:
        if cur.weekday() < 5 and cur not in holidays:
            days += 1
        cur += timedelta(days=1)
    return days


def next_business_day(d: date, holidays: set = None) -> date:
    """Devuelve el siguiente día hábil después de d (saltando finde y festivos)."""
    holidays = holidays or set()
    cur = d + timedelta(days=1)
    while cur.weekday() >= 5 or cur in holidays:
        cur += timedelta(days=1)
    return cur


async def compute_seniority_years(employee_id: str) -> float:
    """Antigüedad del empleado en años (decimal)."""
    emp = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not emp or not emp.get("hireDate"):
        return 0.0
    try:
        hire = parse_iso(emp["hireDate"])
    except Exception:
        return 0.0
    today = date.today()
    diff_days = (today - hire).days
    if diff_days < 0:
        return 0.0
    return round(diff_days / 365.25, 2)


async def days_from_policy(seniority_years: float) -> int:
    """Devuelve los días que corresponden según la política para esa antigüedad."""
    policies = await db.vacation_policies.find({}, {"_id": 0}).sort("yearsFrom", 1).to_list(200)
    for p in policies:
        if p["yearsFrom"] <= seniority_years < p["yearsTo"]:
            return p["days"]
    # fallback al rango más alto si excede
    if policies:
        highest = max(policies, key=lambda x: x["yearsFrom"])
        if seniority_years >= highest["yearsFrom"]:
            return highest["days"]
    return DEFAULT_ANNUAL_DAYS


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
    seniority = await compute_seniority_years(employee_id)
    auto_days = await days_from_policy(seniority)
    new_bal = {
        "employeeId": employee_id,
        "employeeName": emp.get("name") if emp else None,
        "employeeAvatar": emp.get("avatar") if emp else None,
        "employeeDepartment": emp.get("department") if emp else None,
        "year": year,
        "totalDays": auto_days,
        "daysUsed": 0,
        "daysPending": 0,
        "daysAvailable": auto_days,
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

    # Enrich with seniority + hireDate
    emp = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    seniority = await compute_seniority_years(employee_id)
    bal["seniorityYears"] = seniority
    bal["hireDate"] = emp.get("hireDate") if emp else None
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

    today = date.today()
    count_weekends = bool(data.countWeekends)

    # Obtener festivos del año relevante
    target_year = parse_iso(data.startDate or data.selectedDays[0]).year if (data.startDate or data.selectedDays) else today.year
    holidays_set = await get_holiday_set(target_year)

    # Si vienen selectedDays, derivar startDate/endDate/totalDays de la lista
    if data.selectedDays and len(data.selectedDays) > 0:
        try:
            parsed = sorted({parse_iso(d) for d in data.selectedDays})
        except HTTPException:
            raise
        if not parsed:
            raise HTTPException(status_code=400, detail="selectedDays inválidos")
        if parsed[0] < today:
            raise HTTPException(status_code=400, detail="Hay días seleccionados en el pasado")
        # añadir festivos de los años involucrados
        for y in {d.year for d in parsed}:
            holidays_set |= await get_holiday_set(y)
        if count_weekends:
            total_days = len(parsed)
        else:
            total_days = sum(1 for d in parsed if d.weekday() < 5 and d not in holidays_set)
            if total_days <= 0:
                raise HTTPException(status_code=400, detail="Selecciona al menos un día laborable")
        start = parsed[0]
        end = parsed[-1]
        selected_days_iso = [d.strftime("%Y-%m-%d") for d in parsed]
    else:
        # Validar fechas tradicionales
        start = parse_iso(data.startDate)
        end = parse_iso(data.endDate)
        if start < today:
            raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser en el pasado")
        if end < start:
            raise HTTPException(status_code=400, detail="La fecha de fin debe ser posterior o igual a la de inicio")
        total_days = count_business_days(start, end, holidays_set)
        if count_weekends:
            total_days = (end - start).days + 1
        if total_days <= 0:
            raise HTTPException(status_code=400, detail="El rango debe incluir al menos un día laborable")
        selected_days_iso = None

    return_date = next_business_day(end, holidays_set)

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
        "startDate": start.strftime("%Y-%m-%d"),
        "endDate": end.strftime("%Y-%m-%d"),
        "returnDate": return_date.strftime("%Y-%m-%d"),
        "totalDays": total_days,
        "selectedDays": selected_days_iso,
        "countWeekends": count_weekends,
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


@router.patch("/{request_id}", response_model=VacationRequest)
async def update_request(
    request_id: str,
    data: VacationRequestUpdate,
    current_user: dict = Depends(require_manager_or_admin),
):
    """Actualiza una solicitud completa (admin): puede modificar fechas, días seleccionados,
    estado, comentario y motivo. Recalcula balance del empleado."""
    req = await db.vacation_requests.find_one({"id": request_id}, {"_id": 0})
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    update = {}
    today = date.today()

    new_type = data.type or req["type"]
    count_weekends = data.countWeekends if data.countWeekends is not None else bool(req.get("countWeekends"))
    update["countWeekends"] = count_weekends

    # Si vienen días/fechas, recalcular
    has_dates_change = (
        data.selectedDays is not None or data.startDate is not None or data.endDate is not None
    )
    if has_dates_change:
        # festivos
        if data.selectedDays is not None and len(data.selectedDays) > 0:
            parsed = sorted({parse_iso(d) for d in data.selectedDays})
            if not parsed:
                raise HTTPException(status_code=400, detail="selectedDays inválidos")
            holidays_set = set()
            for y in {d.year for d in parsed}:
                holidays_set |= await get_holiday_set(y)
            if count_weekends:
                total_days = len(parsed)
            else:
                total_days = sum(1 for d in parsed if d.weekday() < 5 and d not in holidays_set)
                if total_days <= 0:
                    raise HTTPException(status_code=400, detail="Selecciona al menos un día laborable")
            start = parsed[0]
            end = parsed[-1]
            update["selectedDays"] = [d.strftime("%Y-%m-%d") for d in parsed]
        else:
            start_iso = data.startDate or req["startDate"]
            end_iso = data.endDate or req["endDate"]
            start = parse_iso(start_iso)
            end = parse_iso(end_iso)
            if end < start:
                raise HTTPException(status_code=400, detail="endDate debe ser >= startDate")
            holidays_set = await get_holiday_set(start.year)
            if start.year != end.year:
                holidays_set |= await get_holiday_set(end.year)
            total_days = count_business_days(start, end, holidays_set)
            if count_weekends:
                total_days = (end - start).days + 1
            update["selectedDays"] = None

        update["startDate"] = start.strftime("%Y-%m-%d")
        update["endDate"] = end.strftime("%Y-%m-%d")
        update["totalDays"] = total_days
        update["returnDate"] = next_business_day(end, holidays_set).strftime("%Y-%m-%d")

    if data.type is not None:
        update["type"] = data.type
    if data.reason is not None:
        update["reason"] = data.reason
    if data.adminComment is not None:
        update["adminComment"] = data.adminComment
    if data.status is not None:
        update["status"] = data.status
        update["reviewedAt"] = datetime.now()
        update["reviewedBy"] = current_user.get("name") or current_user.get("email")

    if not update:
        raise HTTPException(status_code=400, detail="Sin cambios")

    await db.vacation_requests.update_one({"id": request_id}, {"$set": update})

    # Recompute balance del año afectado
    try:
        s = parse_iso(update.get("startDate", req["startDate"]))
        await recompute_balance(req["employeeId"], s.year)
    except Exception:
        pass

    updated = await db.vacation_requests.find_one({"id": request_id}, {"_id": 0})
    return await enrich_request(updated)


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
