import enum

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class ServiceFrequency(str, enum.Enum):
    ONE_TIME = "one_time"
    WEEKLY = "weekly"
    FORTNIGHTLY = "fortnightly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    HALF_YEARLY = "half_yearly"
    ANNUAL = "annual"


class ServiceType(Base):
    __tablename__ = "service_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)


class ServiceContract(Base):
    __tablename__ = "service_contracts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    service_type_id = Column(Integer, ForeignKey("service_types.id"), nullable=False)
    frequency = Column(Enum(ServiceFrequency), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    contract_value = Column(Integer)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="contracts")
    service_type = relationship("ServiceType")
    jobs = relationship("Job", back_populates="contract")
