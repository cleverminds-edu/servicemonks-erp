import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.auth import LoginRequest, Token
from ..utils.auth import create_access_token, get_current_user, verify_password
from ..middleware.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = (
            db.query(User)
            .filter(User.employee_id == body.employee_id.upper(), User.is_active == True)
            .first()
        )
        if not user or not verify_password(body.password, user.password_hash):
            logger.warning(f"Failed login attempt for employee_id: {body.employee_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Employee ID or password",
            )

        token = create_access_token({"sub": str(user.id)})
        logger.info(f"Successful login: {user.employee_id}")
        return Token(
            access_token=token,
            user_id=user.id,
            employee_id=user.employee_id,
            name=user.name,
            role=user.role,
            email=user.email or "",
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
    }
