from datetime import date
from typing import List

from pydantic import BaseModel


class ServiceInContract(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ContractCreate(BaseModel):
    start_date: date
    end_date: date | None = None
    is_active: bool = True
    service_ids: List[int]


class ContractResponse(BaseModel):
    id: int
    customer_id: int
    start_date: date
    end_date: date | None
    is_active: bool
    services: List[ServiceInContract]

    model_config = {"from_attributes": True}
