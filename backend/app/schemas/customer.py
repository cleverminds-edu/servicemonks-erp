from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from ..models.customer import CustomerSector


class CustomerCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    address: str
    city: Optional[str] = None
    pincode: Optional[str] = None
    sector: CustomerSector
    notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    sector: Optional[CustomerSector] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    contact_person: Optional[str] = None
    phone: str
    email: Optional[str] = None
    address: str
    city: Optional[str] = None
    pincode: Optional[str] = None
    sector: CustomerSector
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
