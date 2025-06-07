"""
Simplified PostgreSQL Database for Production Deployment
No external dependencies beyond asyncpg
"""

import os
import asyncio
import asyncpg
import logging
from typing import AsyncGenerator, Optional
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)

class SimplePostgreSQLDatabase:
    def __init__(self):
        self.pool = None
        self.database_url = os.getenv("DATABASE_URL")
        
    async def initialize(self):
        """Initialize PostgreSQL connection pool"""
        if not self.database_url:
            raise Exception("DATABASE_URL environment variable not set")
            
        try:
            # Create connection pool
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=5,
                max_size=20,
                command_timeout=60
            )
            logger.info("✅ PostgreSQL connection pool initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize PostgreSQL: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Check database health"""
        if not self.pool:
            return False
            
        try:
            async with self.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            return True
        except Exception:
            return False
    
    async def get_connection(self):
        """Get database connection from pool"""
        if not self.pool:
            await self.initialize()
        return self.pool.acquire()
    
    async def close(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")

# Global database instance
postgresql_db = SimplePostgreSQLDatabase()

# Dependency for FastAPI
async def get_db():
    """Database dependency for FastAPI"""
    async with postgresql_db.get_connection() as conn:
        yield conn