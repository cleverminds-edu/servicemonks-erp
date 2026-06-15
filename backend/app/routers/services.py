from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.service import ServiceContract, ServiceType
from ..models.user import User, UserRole
from ..schemas.service import ContractCreate, ContractResponse, ContractUpdate, ServiceTypeResponse
from ..utils.auth import get_current_user, require_roles

router = APIRouter()


@router.get("/types", response_model=List[ServiceTypeResponse])
def list_service_types(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(ServiceType).filter(ServiceType.is_active == True).order_by(ServiceType.category, ServiceType.name).all()


@router.get("/contracts", response_model=List[ContractResponse])
def list_contracts(
    customer_id: int = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(ServiceContract)
    if customer_id:
        q = q.filter(ServiceContract.customer_id == customer_id)
    return q.order_by(ServiceContract.created_at.desc()).all()


@router.post("/contracts", response_model=ContractResponse)
def create_contract(
    body: ContractCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    contract = ServiceContract(**body.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return db.query(ServiceContract).filter(ServiceContract.id == contract.id).first()


@router.put("/contracts/{contract_id}", response_model=ContractResponse)
def update_contract(
    contract_id: int,
    body: ContractUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    contract = db.query(ServiceContract).filter(ServiceContract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(contract, field, value)
    db.commit()
    db.refresh(contract)
    return contract
