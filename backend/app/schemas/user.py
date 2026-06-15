from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from ..models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.TECHNICIAN


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    monthly_salary: Optional[int] = None


class UserResponse(BaseModel):
    id: int
    employee_id: Optional[str] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    monthly_salary: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
