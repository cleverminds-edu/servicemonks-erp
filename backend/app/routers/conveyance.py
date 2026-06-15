from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models.job import ConveyanceClaim, ConveyanceStatus
from ..models.user import User, UserRole
from ..schemas.job import ConveyanceClaimCreate, ConveyanceResponse
from ..utils.auth import get_current_user, require_roles

router = APIRouter()


@router.get("/", response_model=List[ConveyanceResponse])
def list_claims(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ConveyanceClaim).options(joinedload(ConveyanceClaim.technician))
    if current_user.role == UserRole.TECHNICIAN:
        q = q.filter(ConveyanceClaim.technician_id == current_user.id)
    if status:
        q = q.filter(ConveyanceClaim.status == status)
    return q.order_by(ConveyanceClaim.submitted_at.desc()).all()


@router.post("/", response_model=ConveyanceResponse)
def submit_claim(
    body: ConveyanceClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(ConveyanceClaim).filter(
        ConveyanceClaim.technician_id == current_user.id,
        ConveyanceClaim.job_id == body.job_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Claim already submitted for this job")

    claim = ConveyanceClaim(
        technician_id=current_user.id,
        job_id=body.job_id,
        date=body.date,
        distance_km=body.distance_km,
        rate_per_km=body.rate_per_km,
        amount=round(body.distance_km * body.rate_per_km, 2),
        notes=body.notes,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return claim


@router.put("/{claim_id}/approve", response_model=ConveyanceResponse)
def approve_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    claim = db.query(ConveyanceClaim).filter(ConveyanceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.status = ConveyanceStatus.APPROVED
    claim.reviewed_by = current_user.id
    claim.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(claim)
    return claim


@router.put("/{claim_id}/reject", response_model=ConveyanceResponse)
def reject_claim(
    claim_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    claim = db.query(ConveyanceClaim).filter(ConveyanceClaim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    claim.status = ConveyanceStatus.REJECTED
    claim.reviewed_by = current_user.id
    claim.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(claim)
    return claim
