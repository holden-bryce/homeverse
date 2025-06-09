#!/usr/bin/env python3
"""Remove async PostgreSQL initialization that's causing the error"""

import re

def remove_async_init():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # 1. Remove the async init_postgresql function completely
    init_pg_pattern = r'async def init_postgresql\(\):[\s\S]*?return pg_pool'
    content = re.sub(init_pg_pattern, '', content)
    
    # 2. Remove any remaining references to asyncpg
    content = re.sub(r'import asyncpg\n', '', content)
    content = re.sub(r'from asyncpg import.*\n', '', content)
    
    # 3. Fix the startup event to not call init_postgresql
    startup_fix = '''@app.on_event("startup")
async def startup_event():
    """Initialize database and create test users"""
    logger.info(f"🚀 Starting HomeVerse API v2.0.5 ({ENVIRONMENT} mode)")
    
    # Database is already initialized in the global scope
    if USE_POSTGRESQL:
        logger.info("🐘 PostgreSQL connection pool ready")
        # No need to call async init - pool is already created
    else:
        init_db()
        create_test_users_sqlite()
    
    logger.info("✅ Application startup completed")'''
    
    # Replace the startup event
    startup_pattern = r'@app\.on_event\("startup"\)[\s\S]*?logger\.info\("✅ Application startup completed"\)'
    content = re.sub(startup_pattern, startup_fix, content)
    
    # 4. Fix shutdown event to not await pool.close()
    shutdown_fix = '''@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 Shutting down HomeVerse API...")
    if USE_POSTGRESQL and pg_pool:
        # For psycopg2 pool, we call closeall()
        pg_pool.closeall()
        logger.info("🐘 PostgreSQL connection pool closed")
    logger.info("✅ Application shutdown completed")'''
    
    # Replace shutdown event
    shutdown_pattern = r'@app\.on_event\("shutdown"\)[\s\S]*?await pg_pool\.close\(\)'
    content = re.sub(shutdown_pattern, shutdown_fix, content)
    
    # 5. Remove any create_test_users_pg function calls that might be async
    content = re.sub(r'await create_test_users_pg\(\)\n', '', content)
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Removed async PostgreSQL initialization")
    print("\nChanges:")
    print("1. Removed async init_postgresql function")
    print("2. Fixed startup event to not call async functions")
    print("3. Fixed shutdown event to use psycopg2 closeall()")
    print("4. Removed all asyncpg references")

if __name__ == "__main__":
    remove_async_init()