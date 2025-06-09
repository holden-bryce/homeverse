#!/usr/bin/env python3
"""Add database check endpoint"""

import re

def add_db_check():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Add a database check endpoint after health endpoint
    db_check_endpoint = '''
@app.get("/db-check")
async def db_check():
    """Check database connection and tables"""
    try:
        conn = next(get_db())
        cursor = conn.cursor()
        
        # Check which database we're using
        db_type = "PostgreSQL" if USE_POSTGRESQL else "SQLite"
        
        # Check if users table exists
        if USE_POSTGRESQL:
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                )
            """)
            users_exists = cursor.fetchone()[0]
        else:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            users_exists = cursor.fetchone() is not None
        
        # Count users if table exists
        user_count = 0
        if users_exists:
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
        
        return {
            "database_type": db_type,
            "use_postgresql": USE_POSTGRESQL,
            "database_url_set": bool(DATABASE_URL),
            "users_table_exists": users_exists,
            "user_count": user_count,
            "pg_pool_exists": pg_pool is not None
        }
    except Exception as e:
        return {
            "error": str(e),
            "database_type": "PostgreSQL" if USE_POSTGRESQL else "SQLite",
            "use_postgresql": USE_POSTGRESQL
        }'''
    
    # Insert after health endpoint
    health_pattern = r'(@app\.get\("/health"\)[\s\S]*?return {"status": "healthy", "timestamp": datetime\.utcnow\(\)\.isoformat\(\)})'
    content = re.sub(health_pattern, r'\1\n' + db_check_endpoint, content)
    
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Added /db-check endpoint")

if __name__ == "__main__":
    add_db_check()