import calendar
from datetime import date, datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import extract
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.attendance import Attendance, AttendanceStatus, Holiday
from ..models.user import User, UserRole
from ..utils.auth import get_current_user, require_roles

router = APIRouter()

MANAGEMENT_ROLES = (UserRole.ADMIN, UserRole.MANAGER)
ATTENDANCE_ROLES = (UserRole.TECHNICIAN, UserRole.SUPPORT_STAFF)


# ── Schemas ───────────────────────────────────────────────────────────────────

class AttendanceIn(BaseModel):
    user_id: Optional[int] = None
    date: date
    status: AttendanceStatus
    notes: Optional[str] = None


class AttendanceLocationIn(BaseModel):
    latitude: float
    longitude: float


class AttendanceOut(BaseModel):
    id: int
    user_id: int
    date: date
    status: AttendanceStatus
    marked_by: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None
    user_employee_id: Optional[str] = None

    model_config = {"from_attributes": True}


class HolidayIn(BaseModel):
    date: date
    name: str


class HolidayOut(BaseModel):
    id: int
    date: date
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SalaryIn(BaseModel):
    monthly_salary: int


# ── Helpers ───────────────────────────────────────────────────────────────────

def _effective_working_days(year: int, month: int, holiday_dates: set) -> int:
    """Mon–Sat minus declared holidays."""
    total = 0
    for d in range(1, calendar.monthrange(year, month)[1] + 1):
        dt = date(year, month, d)
        if dt.weekday() < 6 and dt not in holiday_dates:  # 0–5 = Mon–Sat
            total += 1
    return total


# ── Attendance ────────────────────────────────────────────────────────────────

@router.post("/attendance", response_model=AttendanceOut)
def mark_attendance(
    body: AttendanceIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    target_id = body.user_id or current_user.id
    target = db.query(User).filter(User.id == target_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role == UserRole.TECHNICIAN:
        if target_id != current_user.id:
            raise HTTPException(status_code=403, detail="Technicians can only mark their own attendance")

    elif current_user.role == UserRole.MANAGER:
        if target.role not in ATTENDANCE_ROLES:
            raise HTTPException(status_code=400, detail="Attendance not required for this role")

    existing = db.query(Attendance).filter(
        Attendance.user_id == target_id,
        Attendance.date == body.date,
    ).first()

    if existing:
        existing.status = body.status
        existing.notes = body.notes
        existing.marked_by = current_user.id
        db.commit()
        db.refresh(existing)
        record = existing
    else:
        record = Attendance(
            user_id=target_id,
            date=body.date,
            status=body.status,
            notes=body.notes,
            marked_by=current_user.id,
        )
        db.add(record)
        db.commit()
        db.refresh(record)

    out = AttendanceOut.model_validate(record)
    out.user_name = target.name
    out.user_employee_id = target.employee_id
    return out


@router.get("/attendance", response_model=List[AttendanceOut])
def list_attendance(
    user_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    q = db.query(Attendance)

    if current_user.role == UserRole.TECHNICIAN:
        q = q.filter(Attendance.user_id == current_user.id)
    elif user_id:
        q = q.filter(Attendance.user_id == user_id)

    if month:
        q = q.filter(extract("month", Attendance.date) == month)
    if year:
        q = q.filter(extract("year", Attendance.date) == year)
    else:
        q = q.filter(extract("year", Attendance.date) == today.year)

    records = q.order_by(Attendance.date.desc()).all()
    result = []
    for r in records:
        out = AttendanceOut.model_validate(r)
        if r.user:
            out.user_name = r.user.name
            out.user_employee_id = r.user.employee_id
        result.append(out)
    return result


@router.get("/attendance/today")
def today_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today,
    ).first()
    return {"status": record.status if record else None, "date": str(today)}


@router.post("/attendance/location")
def update_attendance_location(
    body: AttendanceLocationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No attendance record for today")

    record.latitude = body.latitude
    record.longitude = body.longitude
    db.commit()
    return {"detail": "Location updated"}


# ── Holidays ──────────────────────────────────────────────────────────────────

@router.get("/holidays", response_model=List[HolidayOut])
def list_holidays(
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Holiday)
    if year:
        q = q.filter(extract("year", Holiday.date) == year)
    if month:
        q = q.filter(extract("month", Holiday.date) == month)
    return q.order_by(Holiday.date).all()


@router.post("/holidays", response_model=HolidayOut)
def create_holiday(
    body: HolidayIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    if db.query(Holiday).filter(Holiday.date == body.date).first():
        raise HTTPException(status_code=400, detail="Holiday already declared for this date")
    h = Holiday(date=body.date, name=body.name, created_by=current_user.id)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.delete("/holidays/{holiday_id}")
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    h = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(h)
    db.commit()
    return {"detail": "deleted"}


# ── Payroll ───────────────────────────────────────────────────────────────────

@router.get("/payroll")
def get_payroll(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    holidays = db.query(Holiday).filter(
        extract("month", Holiday.date) == month,
        extract("year", Holiday.date) == year,
    ).all()
    holiday_dates = {h.date for h in holidays}
    effective_days = _effective_working_days(year, month, holiday_dates)

    staff = db.query(User).filter(
        User.role.in_(ATTENDANCE_ROLES),
        User.is_active == True,
    ).all()

    result = []
    for user in staff:
        records = db.query(Attendance).filter(
            Attendance.user_id == user.id,
            extract("month", Attendance.date) == month,
            extract("year", Attendance.date) == year,
        ).all()

        present = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        leave   = sum(1 for r in records if r.status == AttendanceStatus.LEAVE)
        absent  = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        salary  = user.monthly_salary or 0
        payable = round((present / effective_days) * salary, 2) if effective_days > 0 else 0

        result.append({
            "user_id": user.id,
            "employee_id": user.employee_id,
            "name": user.name,
            "role": user.role,
            "monthly_salary": salary,
            "effective_days": effective_days,
            "holiday_count": len(holiday_dates),
            "present_days": present,
            "leave_days": leave,
            "absent_days": absent,
            "payable_amount": payable,
        })

    return {"effective_days": effective_days, "holidays": [{"date": str(h.date), "name": h.name} for h in holidays], "staff": result}


@router.put("/payroll/{user_id}/salary")
def update_salary(
    user_id: int,
    body: SalaryIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.monthly_salary = body.monthly_salary
    db.commit()
    return {"user_id": user_id, "monthly_salary": body.monthly_salary}
