import enum

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base

# Many-to-many junction table for services in a contract
contract_services = Table(
    "contract_services",
    Base.metadata,
    Column("contract_id", Integer, ForeignKey("service_contracts.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", Integer, ForeignKey("service_types.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True,
)


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
    services = relationship("ServiceType", secondary=contract_services, lazy="joined")
    jobs = relationship("Job", back_populates="contract")
