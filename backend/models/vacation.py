from pydantic import BaseModel, Field, validator
from typing import Optional, Literal, List
from datetime import datetime, date


VacationType = Literal["Vacaciones", "Enfermedad", "Asuntos Propios", "Compensatorio"]
VacationStatus = Literal["Pendiente", "Aprobado", "Rechazado", "Justificado"]


class VacationRequest(BaseModel):
    id: str
    employeeId: str
    employeeName: Optional[str] = None
    employeeAvatar: Optional[str] = None
    employeeDepartment: Optional[str] = None
    type: VacationType
    startDate: str  # ISO date YYYY-MM-DD
    endDate: str    # ISO date YYYY-MM-DD
    returnDate: str  # ISO date YYYY-MM-DD
    totalDays: int
    selectedDays: Optional[List[str]] = None  # lista explícita de días ISO seleccionados
    countWeekends: Optional[bool] = False
    status: VacationStatus = "Pendiente"
    reason: str = ""
    adminComment: Optional[str] = None
    attachmentUrl: Optional[str] = None
    createdAt: datetime
    reviewedAt: Optional[datetime] = None
    reviewedBy: Optional[str] = None


class VacationRequestCreate(BaseModel):
    employeeId: Optional[str] = None  # admin puede especificar; si es empleado se ignora
    type: VacationType
    startDate: str
    endDate: str
    selectedDays: Optional[List[str]] = None
    countWeekends: Optional[bool] = False
    reason: str = ""
    attachmentUrl: Optional[str] = None


class VacationStatusUpdate(BaseModel):
    status: VacationStatus
    adminComment: Optional[str] = None


class VacationRequestUpdate(BaseModel):
    """Update completo (admin) - permite editar fechas, días, estado y comentario."""
    type: Optional[VacationType] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    selectedDays: Optional[List[str]] = None
    countWeekends: Optional[bool] = None
    status: Optional[VacationStatus] = None
    adminComment: Optional[str] = None
    reason: Optional[str] = None


class VacationBalance(BaseModel):
    employeeId: str
    employeeName: Optional[str] = None
    employeeAvatar: Optional[str] = None
    employeeDepartment: Optional[str] = None
    year: int
    totalDays: int = 12        # Días disponibles al año
    daysUsed: int = 0          # Días formalmente consumidos (Aprobado de tipo que resta)
    daysPending: int = 0       # Días en solicitudes pendientes
    daysAvailable: int = 12    # totalDays - daysUsed
    seniorityYears: Optional[float] = 0
    hireDate: Optional[str] = None
