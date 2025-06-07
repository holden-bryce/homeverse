#!/usr/bin/env python3
"""
Initialize PostgreSQL schema for HomeVerse on Render
Creates tables and sets up database structure
"""

import os
import asyncio
import logging
import asyncpg

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_schema():
    """Initialize database schema"""
    if not DATABASE_URL:
        logger.error("DATABASE_URL not found")
        return False
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        logger.info("✅ Connected to PostgreSQL")
        
        # Read and execute schema
        schema_path = os.path.join(os.path.dirname(__file__), 'schema_postgresql.sql')
        
        if os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
            
            # Execute schema creation
            await conn.execute(schema_sql)
            logger.info("✅ Schema created successfully")
        else:
            logger.warning("Schema file not found, creating basic tables")
            # Create basic tables
            await create_basic_tables(conn)
        
        await conn.close()
        return True
        
    except Exception as e:
        logger.error(f"Failed to initialize schema: {e}")
        return False

async def create_basic_tables(conn):
    """Create basic tables if schema file not found"""
    
    # Enable extensions
    await conn.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Companies table
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_key VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'trial',
        max_seats INTEGER DEFAULT 5,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Users table
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Projects table
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        developer VARCHAR(255),
        location VARCHAR(255),
        total_units INTEGER,
        affordable_units INTEGER,
        status VARCHAR(50) DEFAULT 'planning',
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Applicants table
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS applicants (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        household_size INTEGER,
        annual_income DECIMAL(12,2),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Applications table
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'submitted',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Contact submissions table
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS contact_submissions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(20),
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    logger.info("✅ Basic tables created")

if __name__ == "__main__":
    success = asyncio.run(init_schema())
    if success:
        logger.info("🎉 Schema initialization completed")
    else:
        logger.error("❌ Schema initialization failed")
        exit(1)