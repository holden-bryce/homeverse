"""
Enhanced PostgreSQL Database Configuration for HomeVerse
Optimized for production use with advanced features
"""

import os
import asyncio
import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

import asyncpg
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import event, text
from sqlmodel import SQLModel

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://homeverse:secure_password123@localhost:5432/homeverse_dev")
DATABASE_POOL_SIZE = int(os.getenv("DATABASE_POOL_SIZE", "20"))
DATABASE_MAX_OVERFLOW = int(os.getenv("DATABASE_MAX_OVERFLOW", "30"))
DATABASE_POOL_TIMEOUT = int(os.getenv("DATABASE_POOL_TIMEOUT", "30"))
DATABASE_ECHO = os.getenv("DATABASE_ECHO", "false").lower() == "true"

logger = logging.getLogger(__name__)

class PostgreSQLDatabase:
    def __init__(self):
        self.engine = None
        self.async_session = None
        self._connection_pool = None
        
    async def initialize(self):
        """Initialize PostgreSQL database connection"""
        try:
            # Create async engine with optimized settings
            self.engine = create_async_engine(
                DATABASE_URL,
                echo=DATABASE_ECHO,
                pool_size=DATABASE_POOL_SIZE,
                max_overflow=DATABASE_MAX_OVERFLOW,
                pool_timeout=DATABASE_POOL_TIMEOUT,
                pool_recycle=3600,  # Recycle connections every hour
                pool_pre_ping=True,  # Validate connections before use
                connect_args={
                    "server_settings": {
                        "application_name": "homeverse_app",
                        "jit": "off"  # Disable JIT for better stability
                    }
                }
            )
            
            # Create session factory
            self.async_session = async_sessionmaker(
                bind=self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False
            )
            
            # Test connection
            await self.health_check()
            logger.info("✅ PostgreSQL database initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize PostgreSQL database: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Check database health"""
        try:
            async with self.engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    async def get_session(self) -> AsyncSession:
        """Get database session"""
        if not self.async_session:
            await self.initialize()
        return self.async_session()
    
    @asynccontextmanager
    async def session_scope(self) -> AsyncGenerator[AsyncSession, None]:
        """Provide a transactional scope around database operations"""
        session = await self.get_session()
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
    
    async def set_company_context(self, session: AsyncSession, company_id: str):
        """Set company context for Row Level Security"""
        try:
            await session.execute(
                text("SET app.current_company_id = :company_id"),
                {"company_id": company_id}
            )
        except Exception as e:
            logger.warning(f"Failed to set company context: {e}")
    
    async def set_user_context(self, session: AsyncSession, user_id: str, role: str):
        """Set user context for Row Level Security"""
        try:
            await session.execute(
                text("SET app.current_user_id = :user_id"),
                {"user_id": user_id}
            )
            await session.execute(
                text("SET app.current_user_role = :role"),
                {"role": role}
            )
        except Exception as e:
            logger.warning(f"Failed to set user context: {e}")
    
    async def create_tables(self):
        """Create all tables"""
        if not self.engine:
            await self.initialize()
            
        async with self.engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
    
    async def close(self):
        """Close database connections"""
        if self.engine:
            await self.engine.dispose()
            logger.info("Database connections closed")

# Global database instance
postgresql_db = PostgreSQLDatabase()

# Dependency for FastAPI
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Database dependency for FastAPI"""
    async with postgresql_db.session_scope() as session:
        yield session

# Enhanced database operations with PostgreSQL features
class PostgreSQLOperations:
    
    @staticmethod
    async def search_with_ranking(
        session: AsyncSession,
        table_name: str,
        search_query: str,
        company_id: str,
        limit: int = 50
    ):
        """Full-text search with ranking"""
        query = text(f"""
        SELECT *, ts_rank(search_vector, plainto_tsquery(:search_query)) as rank
        FROM {table_name}
        WHERE company_id = :company_id
        AND search_vector @@ plainto_tsquery(:search_query)
        ORDER BY rank DESC, created_at DESC
        LIMIT :limit
        """)
        
        result = await session.execute(
            query,
            {
                "search_query": search_query,
                "company_id": company_id,
                "limit": limit
            }
        )
        return result.fetchall()
    
    @staticmethod
    async def get_geospatial_nearby(
        session: AsyncSession,
        latitude: float,
        longitude: float,
        radius_km: float,
        company_id: str
    ):
        """Find projects within radius using geospatial queries"""
        query = text("""
        SELECT *,
               ST_Distance(
                   ST_Point(longitude, latitude),
                   ST_Point(:longitude, :latitude)
               ) * 111.32 as distance_km
        FROM projects
        WHERE company_id = :company_id
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        AND ST_DWithin(
            ST_Point(longitude, latitude),
            ST_Point(:longitude, :latitude),
            :radius_km / 111.32
        )
        ORDER BY distance_km
        """)
        
        result = await session.execute(
            query,
            {
                "latitude": latitude,
                "longitude": longitude,
                "radius_km": radius_km,
                "company_id": company_id
            }
        )
        return result.fetchall()
    
    @staticmethod
    async def bulk_insert_with_conflict_resolution(
        session: AsyncSession,
        table_name: str,
        records: list,
        conflict_columns: list,
        update_columns: list = None
    ):
        """Bulk insert with ON CONFLICT handling"""
        if not records:
            return
        
        columns = list(records[0].keys())
        values_placeholder = ", ".join([
            f"({', '.join([f'${i * len(columns) + j + 1}' for j in range(len(columns))])})"
            for i in range(len(records))
        ])
        
        conflict_clause = f"({', '.join(conflict_columns)})"
        
        if update_columns:
            update_clause = f"DO UPDATE SET {', '.join([f'{col} = EXCLUDED.{col}' for col in update_columns])}"
        else:
            update_clause = "DO NOTHING"
        
        query = f"""
        INSERT INTO {table_name} ({', '.join(columns)})
        VALUES {values_placeholder}
        ON CONFLICT {conflict_clause} {update_clause}
        """
        
        # Flatten values
        values = []
        for record in records:
            values.extend([record[col] for col in columns])
        
        await session.execute(text(query), values)
    
    @staticmethod
    async def get_table_statistics(session: AsyncSession, table_name: str):
        """Get table statistics for monitoring"""
        query = text("""
        SELECT 
            schemaname,
            tablename,
            n_tup_ins as inserts,
            n_tup_upd as updates,
            n_tup_del as deletes,
            n_live_tup as live_tuples,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
        FROM pg_stat_user_tables
        WHERE tablename = :table_name
        """)
        
        result = await session.execute(query, {"table_name": table_name})
        return result.fetchone()

# Connection event handlers for monitoring
@event.listens_for(postgresql_db.engine.sync_engine if postgresql_db.engine else None, "connect")
def on_connect(dbapi_connection, connection_record):
    """Set up connection parameters"""
    with dbapi_connection.cursor() as cursor:
        # Set timezone
        cursor.execute("SET timezone='UTC'")
        
        # Set work_mem for this session
        cursor.execute("SET work_mem='16MB'")
        
        # Set statement timeout (5 minutes)
        cursor.execute("SET statement_timeout='300s'")

# Export commonly used items
__all__ = [
    'postgresql_db',
    'get_db',
    'PostgreSQLOperations'
]