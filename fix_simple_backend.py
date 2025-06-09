#!/usr/bin/env python3
"""Fix simple_backend.py to properly use PostgreSQL"""

import re

# Read the file
with open('simple_backend.py', 'r') as f:
    content = f.read()

# Fix 1: Replace asyncpg with psycopg2 pool
content = content.replace(
    """import asyncpg
        import asyncio
        logger.info("🐘 PostgreSQL mode enabled")
    except ImportError:
        logger.warning("PostgreSQL dependencies not found, falling back to SQLite")""",
    """import psycopg2
        from psycopg2 import pool
        logger.info("🐘 PostgreSQL mode enabled")
    except ImportError:
        logger.warning("PostgreSQL dependencies not found, falling back to SQLite")"""
)

# Fix 2: Replace async pool initialization
old_init = """async def init_postgresql():
    """Initialize PostgreSQL connection pool"""
    global pg_pool
    try:
        pg_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=20,
            command_timeout=60
        )
        logger.info("✅ PostgreSQL connection pool initialized")"""

new_init = """def init_postgresql():
    """Initialize PostgreSQL connection pool"""
    global pg_pool
    try:
        pg_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20, DATABASE_URL
        )
        logger.info("✅ PostgreSQL connection pool initialized")"""

content = content.replace(old_init, new_init)

# Fix 3: Fix the get_db function
old_get_db = """def get_db():
    """Get database connection"""
    if USE_POSTGRESQL and pg_pool:
        conn = pg_pool.getconn()
        try:
            yield conn
        finally:
            pg_pool.putconn(conn)"""

new_get_db = """def get_db():
    """Get database connection"""
    if USE_POSTGRESQL and pg_pool:
        conn = pg_pool.getconn()
        try:
            yield conn
        finally:
            pg_pool.putconn(conn)"""

# Actually the get_db function is correct for psycopg2, no need to change

# Fix 4: Replace async pool operations with sync
content = content.replace("async with pg_pool.acquire() as conn:", "conn = psycopg2.connect(DATABASE_URL)")
content = content.replace("await conn.execute(", "cursor = conn.cursor()\n            cursor.execute(")
content = content.replace("await pg_pool.close()", "pg_pool.closeall()")

# Fix 5: Fix log_activity to use PostgreSQL placeholders when needed
old_log_activity = """def log_activity(conn, user_id: str, company_id: str, activity_type: str, title: str, 
                description: str, entity_type: str = None, entity_id: str = None, 
                metadata: dict = None, status: str = "info"):
    """Log user activity"""
    cursor = conn.cursor()
    activity_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO activity_logs (
            id, company_id, user_id, type, title, description, 
            entity_type, entity_id, metadata, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        activity_id, company_id, user_id, activity_type, title, description,
        entity_type, entity_id, json.dumps(metadata) if metadata else None, status
    ))
    
    conn.commit()
    return activity_id"""

new_log_activity = """def log_activity(conn, user_id: str, company_id: str, activity_type: str, title: str, 
                description: str, entity_type: str = None, entity_id: str = None, 
                metadata: dict = None, status: str = "info"):
    """Log user activity"""
    cursor = conn.cursor()
    activity_id = str(uuid.uuid4())
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO activity_logs (
                id, company_id, user_id, type, title, description, 
                entity_type, entity_id, metadata, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            activity_id, company_id, user_id, activity_type, title, description,
            entity_type, entity_id, json.dumps(metadata) if metadata else None, status
        ))
    else:
        cursor.execute("""
            INSERT INTO activity_logs (
                id, company_id, user_id, type, title, description, 
                entity_type, entity_id, metadata, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            activity_id, company_id, user_id, activity_type, title, description,
            entity_type, entity_id, json.dumps(metadata) if metadata else None, status
        ))
    
    conn.commit()
    return activity_id"""

content = content.replace(old_log_activity, new_log_activity)

# Fix 6: Update startup event
content = content.replace(
    """@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("🚀 Starting HomeVerse Production API...")
    
    if USE_POSTGRESQL:
        await init_postgresql()""",
    """@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("🚀 Starting HomeVerse Production API...")
    
    if USE_POSTGRESQL:
        init_postgresql()"""
)

# Fix 7: Fix the init_postgresql function to be sync and use proper cursor operations
# Find and replace the table creation in init_postgresql
content = re.sub(
    r'await conn\.execute\("""([^"]*?)"""\)',
    r'''cursor.execute("""\\1""")
            conn.commit()
            cursor.close()''',
    content,
    flags=re.DOTALL
)

# Write the fixed content
with open('simple_backend_fixed.py', 'w') as f:
    f.write(content)

print("✅ Created simple_backend_fixed.py with PostgreSQL fixes")
print("\nKey fixes applied:")
print("1. Replaced asyncpg with psycopg2.pool")
print("2. Made init_postgresql synchronous")
print("3. Fixed log_activity to use PostgreSQL placeholders")
print("4. Fixed database operations to use psycopg2 properly")
print("\nTo apply the fix:")
print("1. Backup current file: cp simple_backend.py simple_backend.backup.py")
print("2. Apply fix: mv simple_backend_fixed.py simple_backend.py")
print("3. Commit and push to trigger deployment")