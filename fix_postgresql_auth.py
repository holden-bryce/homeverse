#!/usr/bin/env python3
"""Fix PostgreSQL authentication issues in simple_backend.py"""

import sys

def fix_postgresql_auth():
    """Apply targeted fixes for PostgreSQL authentication"""
    
    # Read the file
    with open('simple_backend.py', 'r') as f:
        lines = f.readlines()
    
    print("🔧 Applying PostgreSQL authentication fixes...")
    
    # Fix 1: Import psycopg2.pool
    for i, line in enumerate(lines):
        if "import asyncpg" in line and "PostgreSQL mode enabled" in lines[i+2]:
            lines[i] = "        import psycopg2\n"
            lines.insert(i+1, "        from psycopg2 import pool\n")
            print("✅ Fixed import: Using psycopg2 instead of asyncpg")
            break
    
    # Fix 2: Replace asyncpg pool creation with psycopg2 pool
    for i, line in enumerate(lines):
        if "pg_pool = await asyncpg.create_pool(" in line:
            lines[i] = "        pg_pool = psycopg2.pool.SimpleConnectionPool(\n"
            lines[i+1] = "            1, 20,\n"
            lines[i+2] = "            DATABASE_URL\n"
            lines[i+3] = "        )\n"
            # Remove command_timeout line
            if "command_timeout" in lines[i+4]:
                lines.pop(i+4)
            print("✅ Fixed pool creation: Using psycopg2.pool.SimpleConnectionPool")
            break
    
    # Fix 3: Make init_postgresql synchronous
    for i, line in enumerate(lines):
        if line.strip() == "async def init_postgresql():":
            lines[i] = "def init_postgresql():\n"
            print("✅ Fixed init_postgresql: Made function synchronous")
            break
    
    # Fix 4: Fix async pool operations in init_postgresql
    in_init_postgresql = False
    for i, line in enumerate(lines):
        if "def init_postgresql():" in line:
            in_init_postgresql = True
        elif in_init_postgresql and "def " in line and "init_postgresql" not in line:
            in_init_postgresql = False
        
        if in_init_postgresql:
            if "async with pg_pool.acquire() as conn:" in line:
                lines[i] = "        conn = pg_pool.getconn()\n"
                lines.insert(i+1, "        cursor = conn.cursor()\n")
                lines.insert(i+2, "        try:\n")
                print("✅ Fixed pool acquire: Using getconn() instead of async acquire")
            elif "await conn.execute(" in line:
                lines[i] = line.replace("await conn.execute(", "cursor.execute(")
    
    # Fix 5: Add cleanup for PostgreSQL connections in init_postgresql
    for i, line in enumerate(lines):
        if "logger.info(\"✅ PostgreSQL tables created/verified\")" in line:
            lines.insert(i+1, "            cursor.close()\n")
            lines.insert(i+2, "            conn.commit()\n")
            lines.insert(i+3, "        finally:\n")
            lines.insert(i+4, "            pg_pool.putconn(conn)\n")
            print("✅ Added proper connection cleanup in init_postgresql")
            break
    
    # Fix 6: Fix log_activity to use PostgreSQL placeholders
    in_log_activity = False
    for i, line in enumerate(lines):
        if line.strip().startswith("def log_activity("):
            in_log_activity = True
            log_start = i
        elif in_log_activity and line.strip().startswith("def ") and not line.strip().startswith("def log_activity"):
            in_log_activity = False
            # Insert the fixed version
            fixed_log_activity = '''def log_activity(conn, user_id: str, company_id: str, activity_type: str, title: str, 
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
    return activity_id

'''
            # Replace the old function
            lines[log_start:i] = [fixed_log_activity]
            print("✅ Fixed log_activity: Added PostgreSQL placeholder support")
            break
    
    # Fix 7: Fix startup event to call init_postgresql synchronously
    for i, line in enumerate(lines):
        if "await init_postgresql()" in line and "@app.on_event(\"startup\")" in lines[i-5:i]:
            lines[i] = line.replace("await init_postgresql()", "init_postgresql()")
            print("✅ Fixed startup event: Calling init_postgresql synchronously")
            break
    
    # Fix 8: Fix shutdown event
    for i, line in enumerate(lines):
        if "await pg_pool.close()" in line:
            lines[i] = line.replace("await pg_pool.close()", "pg_pool.closeall()")
            print("✅ Fixed shutdown event: Using closeall() instead of async close")
            break
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.writelines(lines)
    
    print("\n✅ All PostgreSQL authentication fixes applied!")
    print("\n🚀 Next steps:")
    print("1. The fixes have been applied directly to simple_backend.py")
    print("2. Commit and push to trigger deployment:")
    print("   git add simple_backend.py")
    print("   git commit -m 'fix: PostgreSQL authentication - use psycopg2 and fix placeholders'")
    print("   git push origin main")

if __name__ == "__main__":
    fix_postgresql_auth()