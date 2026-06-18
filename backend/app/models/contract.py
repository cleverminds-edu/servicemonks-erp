from datetime import date
from sqlalchemy import Boolean, Column, Date, ForeignKey, Integer, Table
from sqlalchemy.orm import relationship

from ..database import Base


# Many-to-many junction table for services in a contract
contract_services = Table(
    "contract_services",
    Base.metadata,
    Column("contract_id", Integer, ForeignKey("service_contracts.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", Integer, ForeignKey("service_types.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True,
)


class ServiceContract(Base):
    __tablename__ = "service_contracts"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), unique=True, nullable=False)
    start_date = Column(Date, nullable=False, default=date.today)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    customer = relationship("Customer", back_populates="contracts")
    services = relationship("ServiceType", secondary=contract_services, lazy="joined")
