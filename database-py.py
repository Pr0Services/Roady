"""
ROADY Construction - Database Configuration
SQLAlchemy Async + Redis Connection
"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import Column, DateTime, text
from sqlalchemy.sql import func
import redis.asyncio as redis

from src.config import settings

# ============================================================
# ASYNC ENGINE
# ============================================================

# Convert sync URL to async (postgresql:// -> postgresql+asyncpg://)
ASYNC_DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=settings.APP_ENV == "development",
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# ============================================================
# BASE MODEL
# ============================================================

class Base(DeclarativeBase):
    """Base class for all models"""
    
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name"""
        # Convert CamelCase to snake_case
        name = cls.__name__
        return ''.join(
            ['_' + c.lower() if c.isupper() else c for c in name]
        ).lstrip('_') + 's'
    
    # Common columns
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

# ============================================================
# DEPENDENCY - Get DB Session
# ============================================================

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.
    Usage: db: AsyncSession = Depends(get_db)
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# ============================================================
# REDIS CONNECTION
# ============================================================

redis_pool = redis.ConnectionPool.from_url(
    settings.REDIS_URL,
    max_connections=20,
    decode_responses=True,
)

async def get_redis() -> redis.Redis:
    """Get Redis client"""
    return redis.Redis(connection_pool=redis_pool)

# ============================================================
# HEALTH CHECKS
# ============================================================

async def check_db_connection() -> bool:
    """Check if database is accessible"""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection error: {e}")
        return False

async def check_redis_connection() -> bool:
    """Check if Redis is accessible"""
    try:
        client = await get_redis()
        await client.ping()
        return True
    except Exception as e:
        print(f"Redis connection error: {e}")
        return False

# ============================================================
# SYNC SESSION (for scripts/seeds)
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sync_engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_size=5,
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)

def get_sync_db():
    """Get sync database session (for scripts)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
