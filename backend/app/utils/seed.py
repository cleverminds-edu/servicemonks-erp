from ..database import SessionLocal, engine, Base
from ..models.service import ServiceType
from ..models.user import User, UserRole
from ..models.attendance import Attendance
from .auth import hash_password
import logging

logger = logging.getLogger(__name__)

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


def ensure_schema():
    """Ensure all tables have required columns"""
    try:
        # Drop and recreate attendance table to ensure new columns exist
        Attendance.__table__.drop(engine, checkfirst=True)
        Attendance.__table__.create(engine)
        logger.info("✓ Attendance table schema updated")

        # Recreate users table to ensure password_changed column exists
        User.__table__.drop(engine, checkfirst=True)
        User.__table__.create(engine)
        logger.info("✓ Users table schema updated")
    except Exception as e:
        logger.warning(f"Could not update schema: {e}")


def seed_service_types():
    db = SessionLocal()
    try:
        if db.query(ServiceType).count() == 0:
            for name, category in SERVICE_TYPES:
                db.add(ServiceType(name=name, category=category))
            db.commit()
            logger.info(f"✓ Created {len(SERVICE_TYPES)} service types")
    finally:
        db.close()


def seed_admin_user():
    db = SessionLocal()
    try:
        # Clean up old demo users
        old_demo_ids = ["SM001", "SM002", "SM003", "SM004", "SM005"]
        for emp_id in old_demo_ids:
            db.query(User).filter(User.employee_id == emp_id).delete()
        
        # Create superuser
        superuser_id = "SM000"
        existing = db.query(User).filter(User.employee_id == superuser_id).first()
        
        if not existing:
            superuser = User(
                employee_id=superuser_id,
                name="D S Reddy",
                email="superuser@servicemonks.com",
                phone=None,
                password_hash=hash_password("Anupally@123"),
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(superuser)
            logger.info(f"✓ Created superuser: {superuser_id} (D S Reddy)")
        else:
            logger.info(f"✓ Superuser {superuser_id} already exists")
        
        db.commit()
            
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding superuser: {e}", exc_info=True)
        raise
    finally:
        db.close()
