from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.customer import Customer
from ..models.contract import ServiceContract
from ..models.service import ServiceType
from ..models.user import User, UserRole
from ..schemas.contract import ContractCreate, ContractResponse
from ..utils.auth import get_current_user, require_roles

router = APIRouter()


@router.get("/customers/{customer_id}/contract", response_model=ContractResponse)
def get_contract(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Get service contract for a customer"""
    contract = db.query(ServiceContract).filter(ServiceContract.customer_id == customer_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


@router.post("/customers/{customer_id}/contract", response_model=ContractResponse)
def create_or_update_contract(
    customer_id: int,
    body: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Create or update service contract for a customer"""
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Check if contract already exists
    contract = db.query(ServiceContract).filter(ServiceContract.customer_id == customer_id).first()

    if not contract:
        contract = ServiceContract(
            customer_id=customer_id,
            start_date=body.start_date,
            end_date=body.end_date,
            is_active=body.is_active,
        )
        db.add(contract)
    else:
        contract.start_date = body.start_date
        contract.end_date = body.end_date
        contract.is_active = body.is_active

    # Update services
    contract.services.clear()
    if body.service_ids:
        services = db.query(ServiceType).filter(ServiceType.id.in_(body.service_ids)).all()
        contract.services.extend(services)

    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/customers/{customer_id}/contract")
def delete_contract(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    """Delete service contract"""
    contract = db.query(ServiceContract).filter(ServiceContract.customer_id == customer_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    db.delete(contract)
    db.commit()
    return {"detail": "Contract deleted"}
