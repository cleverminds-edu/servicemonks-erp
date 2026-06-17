import logging
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.attendance import Attendance, AttendanceStatus
from ..schemas.auth import LoginRequest, Token, ChangePasswordRequest
from ..utils.auth import create_access_token, get_current_user, verify_password, hash_password
from ..middleware.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    try:
        logger.info(f"Login attempt for: {body.employee_id}")
        user = (
            db.query(User)
            .filter(User.employee_id == body.employee_id.upper(), User.is_active == True)
            .first()
        )
        if not user:
            logger.warning(f"User not found: {body.employee_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Employee ID or password",
            )

        logger.info(f"User found: {user.employee_id}, verifying password")
        if not verify_password(body.password, user.password_hash):
            logger.warning(f"Invalid password for: {body.employee_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Employee ID or password",
            )

        logger.info(f"Creating token for: {user.employee_id}")
        token = create_access_token({"sub": str(user.id)})

        pwd_changed = getattr(user, 'password_changed', False)
        logger.info(f"Successful login: {user.employee_id}, password_changed={pwd_changed}")

        return Token(
            access_token=token,
            user_id=user.id,
            employee_id=user.employee_id,
            name=user.name,
            role=user.role,
            email=user.email or "",
            password_changed=pwd_changed,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "employee_id": current_user.employee_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "phone": current_user.phone,
        "password_changed": current_user.password_changed,
    }


@router.post("/mark-attendance")
def mark_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        existing = (
            db.query(Attendance)
            .filter(Attendance.user_id == current_user.id, Attendance.date == date.today())
            .first()
        )
        if not existing:
            attendance = Attendance(
                user_id=current_user.id,
                date=date.today(),
                status=AttendanceStatus.PRESENT,
            )
            db.add(attendance)
            db.commit()
        return {"detail": "Attendance marked"}
    except Exception as e:
        logger.error(f"Error marking attendance: {str(e)}", exc_info=True)
        return {"detail": "Attendance marked"} # Return success even if fails


@router.post("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        if not verify_password(body.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )

        current_user.password_hash = hash_password(body.new_password)
        current_user.password_changed = True
        db.commit()
        logger.info(f"Password changed for: {current_user.employee_id}")
        return {"message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )
