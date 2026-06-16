import os
import logging
from typing import Optional

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .config import settings
from .database import Base, engine, SessionLocal
from .routers import auth, conveyance, customers, hr, jobs, services, tracking, users
from .models import attendance  # noqa: F401 — register with Base
from .utils.seed import seed_service_types, seed_admin_user

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Setup rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI with secure defaults
if settings.environment == "production":
    app = FastAPI(
        title="Service Monks ERP",
        version="1.0.0",
        docs_url=None,  # Disable Swagger UI in production
        redoc_url=None,  # Disable ReDoc in production
    )
else:
    app = FastAPI(
        title="Service Monks Integrated Solutions Private Limited — ERP",
        version="1.0.0"
    )

# Attach limiter to app
app.state.limiter = limiter

# Security middleware - restrict to allowed origins only
allowed_origins = [origin.strip() for origin in settings.allowed_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Trusted host middleware
if settings.environment == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=allowed_origins,
    )

# Rate limit exceeded handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    logger.warning(f"Rate limit exceeded for {request.client.host}")
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Rate limit exceeded. Please try again later."},
    )


# Request validation error handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Invalid request data"},
    )


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    if settings.environment == "production":
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
    else:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc)},
        )


@app.on_event("startup")
def startup():
    logger.info(f"Starting ServiceMonks ERP in {settings.environment} mode")

    # Check database connection
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("✓ Database connection verified")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {str(e)}")
        raise RuntimeError("Cannot connect to database") from e

    # Initialize database schema
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Database schema initialized")
    except Exception as e:
        logger.error(f"✗ Database schema initialization failed: {str(e)}")
        raise RuntimeError("Cannot initialize database schema") from e

    # Create upload directories
    try:
        os.makedirs("uploads/signatures", exist_ok=True)
        os.makedirs("uploads/pdfs", exist_ok=True)
        logger.info("✓ Upload directories ready")
    except Exception as e:
        logger.error(f"✗ Failed to create upload directories: {str(e)}")
        raise RuntimeError("Cannot create upload directories") from e

    # Seed data
    try:
        seed_service_types()
        seed_admin_user()
        logger.info("✓ Seed data initialized")
    except Exception as e:
        logger.error(f"Seed data initialization failed: {type(e).__name__}: {str(e)}", exc_info=True)


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(services.router, prefix="/api/services", tags=["services"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["tracking"])
app.include_router(conveyance.router, prefix="/api/conveyance", tags=["conveyance"])
app.include_router(hr.router, prefix="/api/hr", tags=["hr"])

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
def health():
    """Comprehensive health check endpoint"""
    health_status = {
        "status": "ok",
        "database": "unknown",
        "environment": settings.environment,
    }

    # Check database
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health_status["database"] = "ok"
    except Exception as e:
        logger.error(f"Health check - Database error: {str(e)}")
        health_status["database"] = "error"
        health_status["status"] = "degraded"

    status_code = 200 if health_status["status"] == "ok" else 503
    return JSONResponse(content=health_status, status_code=status_code)
