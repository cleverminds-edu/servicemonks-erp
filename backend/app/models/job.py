import enum

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, Float,
    ForeignKey, Integer, String, Text, Time,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class JobStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ConveyanceStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("service_contracts.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time)
    status = Column(Enum(JobStatus), default=JobStatus.SCHEDULED)
    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="jobs")
    contract = relationship("ServiceContract", back_populates="jobs")
    service_type = relationship("ServiceType", foreign_keys=[service_type_id])
    technician = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])
    execution = relationship("JobExecution", back_populates="job", uselist=False)


class JobExecution(Base):
    __tablename__ = "job_executions"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), unique=True, nullable=False)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    checkin_time = Column(DateTime(timezone=True))
    checkin_lat = Column(Float)
    checkin_lng = Column(Float)
    checkout_time = Column(DateTime(timezone=True))
    checkout_lat = Column(Float)
    checkout_lng = Column(Float)
    products_used = Column(Text)
    remarks = Column(Text)
    signature_path = Column(String(255))
    pdf_path = Column(String(255))
    email_sent = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True))

    job = relationship("Job", back_populates="execution")
    technician = relationship("User")


class GPSPoint(Base):
    __tablename__ = "gps_points"

    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    accuracy = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    technician = relationship("User")


class ConveyanceClaim(Base):
    __tablename__ = "conveyance_claims"

    id = Column(Integer, primary_key=True, index=True)
    technician_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    date = Column(Date, nullable=False)
    distance_km = Column(Float, nullable=False)
    rate_per_km = Column(Float, default=5.0)
    amount = Column(Float, nullable=False)
    notes = Column(Text)
    status = Column(Enum(ConveyanceStatus), default=ConveyanceStatus.PENDING)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime(timezone=True))

    technician = relationship("User", foreign_keys=[technician_id])
    job = relationship("Job")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
