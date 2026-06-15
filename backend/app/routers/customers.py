from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.customer import Customer
from ..models.user import User, UserRole
from ..schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from ..utils.auth import get_current_user, require_roles

router = APIRouter()


@router.get("/", response_model=List[CustomerResponse])
def list_customers(
    search: Optional[str] = None,
    sector: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Customer).filter(Customer.is_active == True)
    if search:
        q = q.filter(Customer.name.ilike(f"%{search}%"))
    if sector:
        q = q.filter(Customer.sector == sector)
    return q.order_by(Customer.name).all()


@router.post("/", response_model=CustomerResponse)
def create_customer(
    body: CustomerCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    customer = Customer(**body.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    body: CustomerUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer
