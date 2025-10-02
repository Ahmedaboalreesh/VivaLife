"""
Database connection and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
from typing import Generator

from config import get_database_url
from .models import Base


# Create database engine
engine = create_engine(
    get_database_url(),
    poolclass=StaticPool,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,   # Recycle connections every hour
    echo=False  # Set to True for SQL query logging in development
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session
    Used with FastAPI's dependency injection
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager for database sessions
    Use this for operations outside of FastAPI routes
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


class DatabaseManager:
    """Database management utilities"""
    
    @staticmethod
    def init_database():
        """Initialize database with tables and basic data"""
        create_tables()
        print("Database tables created successfully")
    
    @staticmethod
    def reset_database():
        """Drop and recreate all tables (USE WITH CAUTION)"""
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("Database reset completed")
    
    @staticmethod
    def check_connection() -> bool:
        """Check if database connection is working"""
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            return True
        except Exception as e:
            print(f"Database connection failed: {e}")
            return False
