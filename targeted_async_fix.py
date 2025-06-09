#!/usr/bin/env python3
"""Targeted fix to remove only PostgreSQL async code"""

import re

def targeted_fix():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # 1. Remove ONLY the init_postgresql function and its usage
    # Find and remove the async init_postgresql function
    init_pg_pattern = r'async def init_postgresql\(\):[\s\S]*?(?=\n\nasync def|\n\ndef|\n\nclass|\n\n@|\n\nif)'
    content = re.sub(init_pg_pattern, '\n\n', content)
    
    # 2. Remove ONLY the create_test_users_pg function
    create_users_pg_pattern = r'async def create_test_users_pg\(\):[\s\S]*?(?=\n\nasync def|\n\ndef|\n\nclass|\n\n@|\n\nif)'
    content = re.sub(create_users_pg_pattern, '\n\n', content)
    
    # 3. Fix the startup event to not call init_postgresql
    startup_replacement = '''@app.on_event("startup")
async def startup_event():
    """Initialize database and create test users"""
    logger.info(f"🚀 Starting HomeVerse API v2.0.5 ({ENVIRONMENT} mode)")
    
    # PostgreSQL pool is already initialized at module level
    if not USE_POSTGRESQL:
        init_db()
        create_test_users_sqlite()
    
    logger.info("✅ Application startup completed")'''
    
    startup_pattern = r'@app\.on_event\("startup"\)\nasync def startup_event\(\):[\s\S]*?logger\.info\("✅ Application startup completed"\)'
    content = re.sub(startup_pattern, startup_replacement, content)
    
    # 4. Fix shutdown to use psycopg2 closeall()
    shutdown_replacement = '''@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 Shutting down HomeVerse API...")
    if USE_POSTGRESQL and pg_pool:
        pg_pool.closeall()
        logger.info("🐘 PostgreSQL connection pool closed")
    logger.info("✅ Application shutdown completed")'''
    
    shutdown_pattern = r'@app\.on_event\("shutdown"\)\nasync def shutdown_event\(\):[\s\S]*?(?=\n\nasync def|\n\ndef|\n\nclass|\n\n@|\n\nif|\Z)'
    content = re.sub(shutdown_pattern, shutdown_replacement + '\n\n', content)
    
    # 5. Remove any calls to the removed functions
    content = re.sub(r'\s*await init_postgresql\(\)\n', '', content)
    content = re.sub(r'\s*await create_test_users_pg\(\)\n', '', content)
    
    # 6. Remove import asyncpg
    content = re.sub(r'import asyncpg\n', '', content)
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Applied targeted async fix")

if __name__ == "__main__":
    targeted_fix()