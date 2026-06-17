import logging
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..models.job import Job, JobExecution, JobStatus
from ..models.user import User, UserRole
from ..schemas.job import JobCreate, JobExecutionSubmit, JobResponse, JobUpdate
from ..utils.auth import get_current_user, require_roles
from ..utils.pdf import generate_completion_pdf
from ..utils.email_sender import send_completion_email

logger = logging.getLogger(__name__)
router = APIRouter()


async def _generate_and_send_completion(
    job_id: int,
    customer_name: str,
    customer_address: str,
    customer_email: str,
    service_name: str,
    technician_name: str,
    checkin_time,
    checkout_time,
    products_used: str,
    remarks: str,
    signature_base64: str,
    scheduled_date: str,
):
    """Background task to generate PDF and send email"""
    try:
        logger.info(f"[BG] ★ BACKGROUND TASK STARTED for job {job_id}")

        # Generate PDF
        logger.info(f"[BG] Step 1: Generating PDF for job {job_id}...")
        pdf_path = generate_completion_pdf(
            job_id=job_id,
            customer_name=customer_name,
            customer_address=customer_address,
            customer_email=customer_email,
            service_name=service_name,
            technician_name=technician_name,
            checkin_time=checkin_time,
            checkout_time=checkout_time,
            products_used=products_used,
            remarks=remarks,
            signature_base64=signature_base64,
        )
        logger.info(f"[BG] ✓ Step 1 OK: PDF generated at {pdf_path}")

        # Send email
        logger.info(f"[BG] Step 2: Sending email for job {job_id}...")
        email_result = await send_completion_email(
            customer_name=customer_name,
            customer_email=customer_email,
            service_name=service_name,
            technician_name=technician_name,
            scheduled_date=scheduled_date,
            job_id=job_id,
            pdf_path=pdf_path,
        )

        if email_result:
            logger.info(f"[BG] ✓ Step 2 OK: Email sent successfully")
            logger.info(f"[BG] ★ BACKGROUND TASK COMPLETED for job {job_id}")
        else:
            logger.warning(f"[BG] ⚠ Step 2 WARNING: Email returned False (check SMTP config)")

    except Exception as e:
        logger.error(f"[BG] ✗ BACKGROUND TASK FAILED for job {job_id}: {type(e).__name__}: {str(e)}", exc_info=True)


def _load_job(db, job_id):
    return (
        db.query(Job)
        .options(
            joinedload(Job.customer),
            joinedload(Job.technician),
            joinedload(Job.service_type),
            joinedload(Job.execution),
        )
        .filter(Job.id == job_id)
        .first()
    )


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    scheduled_date: Optional[date] = None,
    technician_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Job).options(
        joinedload(Job.customer),
        joinedload(Job.technician),
        joinedload(Job.service_type),
    )
    if current_user.role == UserRole.TECHNICIAN:
        q = q.filter(Job.assigned_to == current_user.id)
    elif technician_id:
        q = q.filter(Job.assigned_to == technician_id)

    if customer_id:
        q = q.filter(Job.customer_id == customer_id)
    if scheduled_date:
        q = q.filter(Job.scheduled_date == scheduled_date)
    if status:
        q = q.filter(Job.status == status)

    return q.order_by(Job.scheduled_date, Job.scheduled_time).all()


@router.post("/", response_model=JobResponse)
def create_job(
    body: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    """Create a new job."""
    try:
        job = Job(**body.model_dump(), created_by=current_user.id)
        db.add(job)
        db.commit()
        logger.info(f"Job created: {job.id} by user {current_user.id}")
        return _load_job(db, job.id)
    except Exception as e:
        logger.error(f"Failed to create job: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job"
        )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = _load_job(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if current_user.role == UserRole.TECHNICIAN and job.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Not your job")
    return job


@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    body: JobUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN, UserRole.MANAGER)),
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(job, field, value)
    db.commit()
    return _load_job(db, job_id)


@router.post("/{job_id}/checkin")
def checkin(
    job_id: int,
    lat: float = 0.0,
    lng: float = 0.0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check in to a job."""
    try:
        job = db.query(Job).filter(Job.id == job_id, Job.assigned_to == current_user.id).first()
        if not job:
            logger.warning(f"Checkin failed - Job not found: {job_id} for user {current_user.id}")
            raise HTTPException(status_code=404, detail="Job not found")

        if job.status == JobStatus.COMPLETED:
            logger.warning(f"Checkin failed - Job already completed: {job_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job already completed"
            )

        job.status = JobStatus.IN_PROGRESS
        existing = db.query(JobExecution).filter(JobExecution.job_id == job_id).first()
        if not existing:
            execution = JobExecution(
                job_id=job_id,
                technician_id=current_user.id,
                checkin_time=datetime.utcnow(),
                checkin_lat=lat,
                checkin_lng=lng,
            )
            db.add(execution)

        db.commit()
        logger.info(f"Checked in to job {job_id} by user {current_user.id}")
        return {"status": "checked_in"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkin failed for job {job_id}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check in"
        )


@router.post("/{job_id}/submit")
async def submit_job(
    job_id: int,
    body: JobExecutionSubmit,
    background_tasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit job completion with signature, remarks, and generate certificate."""
    try:
        # Verify job exists and user has access
        job = _load_job(db, job_id)
        if not job:
            logger.warning(f"Job not found: {job_id} (user: {current_user.id})")
            raise HTTPException(status_code=404, detail="Job not found")

        if current_user.role == UserRole.TECHNICIAN and job.assigned_to != current_user.id:
            logger.warning(f"Unauthorized job submit: {job_id} by user {current_user.id}")
            raise HTTPException(status_code=403, detail="Not your job")

        if job.status == JobStatus.COMPLETED:
            logger.warning(f"Job already completed: {job_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Job already completed"
            )

        # Prepare execution record
        execution = job.execution or JobExecution(
            job_id=job_id,
            technician_id=current_user.id,
            checkin_time=datetime.utcnow(),
        )

        execution.checkout_time = datetime.utcnow()
        execution.checkout_lat = body.checkout_lat
        execution.checkout_lng = body.checkout_lng
        execution.products_used = body.products_used
        execution.remarks = body.remarks
        execution.submitted_at = datetime.utcnow()

        if not execution.id:
            db.add(execution)
            db.flush()

        # Update job status immediately
        job.status = JobStatus.COMPLETED
        db.commit()
        logger.info(f"Job {job_id} marked as COMPLETED")

        # Queue PDF generation and email as background tasks (non-blocking)
        background_tasks.add_task(
            _generate_and_send_completion,
            job_id=job_id,
            customer_name=job.customer.name,
            customer_address=job.customer.address,
            customer_email=job.customer.email or "",
            service_name=job.service_type.name,
            technician_name=job.technician.name if job.technician else current_user.name,
            checkin_time=execution.checkin_time,
            checkout_time=execution.checkout_time,
            products_used=body.products_used or "",
            remarks=body.remarks or "",
            signature_base64=body.signature_data,
            scheduled_date=str(job.scheduled_date),
        )

        return {
            "status": "completed",
            "pdf_path": pdf_path,
            "email_sent": email_sent,
            "message": "Service completion recorded successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during job submission {job_id}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process job submission. Please try again."
        )
