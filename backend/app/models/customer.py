import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class CustomerSector(str, enum.Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    HEALTHCARE = "healthcare"
    INDUSTRIAL = "industrial"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    contact_person = Column(String(100))
    phone = Column(String(20), nullable=False)
    email = Column(String(150))
    address = Column(Text, nullable=False)
    city = Column(String(100))
    pincode = Column(String(10))
    sector = Column(Enum(CustomerSector), nullable=False)
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contracts = relationship("ServiceContract", back_populates="customer")
    jobs = relationship("Job", back_populates="customer")
