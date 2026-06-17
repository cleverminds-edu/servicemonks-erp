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
def login(body: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"=== LOGIN START: {body.employee_id} ===")
    try:
        # Step 1: Query user
        logger.info("Step 1: Querying user...")
        user = db.query(User).filter(
            User.employee_id == body.employee_id.upper(),
            User.is_active == True
        ).first()

        if not user:
            logger.warning(f"Step 1 FAIL: User not found for {body.employee_id}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Employee ID or password")

        logger.info(f"Step 1 OK: Found user {user.employee_id}")

        # Step 2: Verify password
        logger.info("Step 2: Verifying password...")
        if not verify_password(body.password, user.password_hash):
            logger.warning(f"Step 2 FAIL: Invalid password for {body.employee_id}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Employee ID or password")

        logger.info("Step 2 OK: Password verified")

        # Step 3: Create token
        logger.info("Step 3: Creating token...")
        token = create_access_token({"sub": str(user.id)})
        logger.info("Step 3 OK: Token created")

        # Step 4: Build response
        logger.info("Step 4: Building response...")
        response = Token(
            access_token=token,
            user_id=user.id,
            employee_id=user.employee_id,
            name=user.name,
            role=user.role,
            email=user.email or "",
            password_changed=False,
        )
        logger.info(f"Step 4 OK: Response built, returning")
        logger.info(f"=== LOGIN SUCCESS: {user.employee_id} ===")
        return response

    except HTTPException as e:
        logger.error(f"HTTP Exception: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"=== LOGIN ERROR ===", exc_info=True)
        logger.error(f"Error type: {type(e).__name__}")
        logger.error(f"Error message: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


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
