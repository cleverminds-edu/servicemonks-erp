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
        # Drop dependent tables first (due to foreign keys)
        Attendance.__table__.drop(engine, checkfirst=True)
        logger.info("✓ Dropped Attendance table")

        # Now drop users table
        User.__table__.drop(engine, checkfirst=True)
        logger.info("✓ Dropped Users table")

        # Recreate in correct order
        User.__table__.create(engine)
        logger.info("✓ Recreated Users table")

        Attendance.__table__.create(engine)
        logger.info("✓ Recreated Attendance table")

    except Exception as e:
        logger.warning(f"Schema update: {e}")


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
        # Note: Demo user cleanup disabled in production
        # Uncomment below only for development/testing to reset demo users
        # old_demo_ids = ["SM001", "SM002", "SM003", "SM004", "SM005"]
        # for emp_id in old_demo_ids:
        #     user = db.query(User).filter(User.employee_id == emp_id).first()
        #     if user:
        #         db.query(Attendance).filter(Attendance.user_id == user.id).delete()
        #         db.query(User).filter(User.id == user.id).delete()
        #         logger.info(f"Cleaned up demo user: {emp_id}")

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
