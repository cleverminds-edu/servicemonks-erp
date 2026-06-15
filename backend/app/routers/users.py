from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.user import UserCreate, UserResponse, UserUpdate
from ..utils.auth import get_current_user, hash_password, require_roles

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def list_users(
    role: str = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.name).all()


@router.post("/", response_model=UserResponse)
def create_user(
    body: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    if db.query(User).filter(User.employee_id == body.employee_id.upper()).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    user = User(
        employee_id=body.employee_id.upper(),
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    body: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
