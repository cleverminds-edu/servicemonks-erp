from datetime import date, datetime, time
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from ..models.job import ConveyanceStatus, JobStatus
from .customer import CustomerResponse
from .service import ServiceTypeResponse
from .user import UserResponse


class JobCreate(BaseModel):
    contract_id: Optional[int] = None
    customer_id: int
    service_type_id: int
    assigned_to: Optional[int] = None
    scheduled_date: date
    scheduled_time: Optional[time] = None
    notes: Optional[str] = Field(None, max_length=1000)

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.strip()) == 0:
            return None
        return v


class JobUpdate(BaseModel):
    assigned_to: Optional[int] = None
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    status: Optional[JobStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)


class JobResponse(BaseModel):
    id: int
    customer_id: int
    service_type_id: int
    assigned_to: Optional[int] = None
    scheduled_date: date
    scheduled_time: Optional[time] = None
    status: JobStatus
    notes: Optional[str] = None
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    technician: Optional[UserResponse] = None
    service_type: Optional[ServiceTypeResponse] = None

    model_config = {"from_attributes": True}


class JobExecutionSubmit(BaseModel):
    checkin_lat: Optional[float] = None
    checkin_lng: Optional[float] = None
    checkout_lat: Optional[float] = None
    checkout_lng: Optional[float] = None
    products_used: Optional[str] = Field(None, max_length=500)
    remarks: Optional[str] = Field(None, max_length=2000)
    signature_data: str = Field(..., max_length=500000, description="Base64-encoded signature image (~375KB max)")

    @field_validator("signature_data")
    @classmethod
    def validate_signature(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("Signature cannot be empty")
        if not v.startswith("data:image/png;base64,"):
            raise ValueError("Invalid signature format - must be PNG base64 encoded")
        # Rough check: base64 is ~4/3 size of binary
        estimated_size_kb = len(v) * 3 / 4 / 1024
        if estimated_size_kb > 375:
            raise ValueError(f"Signature too large ({estimated_size_kb:.1f}KB) - max 375KB")
        return v


class LocationUpdate(BaseModel):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    job_id: Optional[int] = None


class ConveyanceClaimCreate(BaseModel):
    job_id: int
    date: date
    distance_km: float
    rate_per_km: float = 5.0
    notes: Optional[str] = None


class ConveyanceResponse(BaseModel):
    id: int
    technician_id: int
    job_id: int
    date: date
    distance_km: float
    rate_per_km: float
    amount: float
    notes: Optional[str] = None
    status: ConveyanceStatus
    submitted_at: datetime
    technician: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
