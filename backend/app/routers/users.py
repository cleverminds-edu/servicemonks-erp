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
    # Auto-generate Employee ID (next SMXXX number)
    last_user = db.query(User).filter(User.employee_id.like('SM%')).order_by(User.id.desc()).first()
    next_num = 1
    if last_user:
        try:
            current_num = int(last_user.employee_id[2:])
            next_num = current_num + 1
        except ValueError:
            next_num = 1
    employee_id = f"SM{next_num:03d}"

    # Use phone as default password
    password = body.phone or "Password@123"

    user = User(
        employee_id=employee_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(password),
        role=body.role,
        is_active=True,
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
