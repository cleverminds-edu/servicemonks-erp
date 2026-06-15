from ..database import SessionLocal
from ..models.service import ServiceType
from ..models.user import User, UserRole
from .auth import hash_password

SERVICE_TYPES = [
    ("Rodent Control",                "Rodent & Pest Control"),
    ("Cockroach Control",             "Rodent & Pest Control"),
    ("Spider Control",                "Rodent & Pest Control"),
    ("Lizard Control",                "Rodent & Pest Control"),
    ("Ant Control",                   "Rodent & Pest Control"),
    ("All Crawling & Flying Insects", "Rodent & Pest Control"),
    ("Mosquito Control",              "Vector-Borne Disease Management"),
    ("Fly Control",                   "Vector-Borne Disease Management"),
    ("Bed Bug Control",               "Vector-Borne Disease Management"),
    ("Termite Control",               "Structural & Property Protection"),
    ("Entry Point Closure",           "Structural & Property Protection"),
    ("Snake Prevention",              "Structural & Property Protection"),
    ("Disinfection / Sterifume",      "Specialized Treatments"),
    ("Beehive Removal",               "Specialized Treatments"),
    ("Stored Pest Insects",           "Specialized Treatments"),
    ("Weed Control",                  "Specialized Treatments"),
]

SEED_USERS = [
    ("SM001", "Admin",        "admin@servicemonks.com",   None,         "Admin@123",  UserRole.ADMIN),
    ("SM002", "Manager",      "manager@servicemonks.com", "9000000002", "Manager@123", UserRole.MANAGER),
    ("SM003", "Suresh Patil", "suresh@servicemonks.com",  "9111111111", "Tech@123",   UserRole.TECHNICIAN),
    ("SM004", "Deepak Kumar", "deepak@servicemonks.com",  "9222222222", "Tech@123",   UserRole.TECHNICIAN),
    ("SM005", "Manoj Singh",  "manoj@servicemonks.com",   "9333333333", "Tech@123",   UserRole.TECHNICIAN),
]


def seed_service_types():
    db = SessionLocal()
    try:
        if db.query(ServiceType).count() == 0:
            for name, category in SERVICE_TYPES:
                db.add(ServiceType(name=name, category=category))
            db.commit()
    finally:
        db.close()


def seed_admin_user():
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            for emp_id, name, email, phone, pwd, role in SEED_USERS:
                db.add(User(
                    employee_id=emp_id,
                    name=name,
                    email=email,
                    phone=phone,
                    password_hash=hash_password(pwd),
                    role=role,
                ))
            db.commit()
            print("Seeded users: SM001–SM005 | Passwords: Admin@123 / Manager@123 / Tech@123")
    finally:
        db.close()
