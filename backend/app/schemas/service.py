from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from ..models.service import ServiceFrequency


class ServiceTypeResponse(BaseModel):
    id: int
    name: str
    category: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class ContractCreate(BaseModel):
    customer_id: int
    service_type_id: int
    frequency: ServiceFrequency
    start_date: date
    end_date: Optional[date] = None
    contract_value: Optional[int] = None
    notes: Optional[str] = None


class ContractUpdate(BaseModel):
    frequency: Optional[ServiceFrequency] = None
    end_date: Optional[date] = None
    contract_value: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ContractResponse(BaseModel):
    id: int
    customer_id: int
    service_type_id: int
    frequency: ServiceFrequency
    start_date: date
    end_date: Optional[date] = None
    contract_value: Optional[int] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    service_type: ServiceTypeResponse

    model_config = {"from_attributes": True}
