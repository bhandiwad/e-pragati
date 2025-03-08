from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging

from .config import config

# Configure logging
logger = logging.getLogger(__name__)

# Create database engine
engine = create_engine(
    config.database.connection_string,
    connect_args={"check_same_thread": False} if config.database.type.lower() == "sqlite" else {},
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

# Update get_db to use a generator pattern that works with FastAPI
def get_db() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize the database, creating all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

def verify_db_connection():
    """Verify database connection is working."""
    db = None
    try:
        db = SessionLocal()
        # Use SQLAlchemy text() for raw SQL
        db.execute(text("SELECT 1"))
        db.commit()
        logger.info("Database connection verified successfully")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return False
    finally:
        if db:
            db.close() 