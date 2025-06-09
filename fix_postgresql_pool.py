#!/usr/bin/env python3
"""Fix PostgreSQL pool initialization"""

import re

def fix_pool():
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Find the PostgreSQL pool initialization
    # The issue is we're using asyncpg.Pool but need psycopg2.pool.SimpleConnectionPool
    
    # Replace the pool initialization
    new_pool_init = '''if USE_POSTGRESQL:
    try:
        import psycopg2
        from psycopg2 import pool
        logger.info("🐘 PostgreSQL mode enabled")
        # Create connection pool
        pg_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20,  # min and max connections
            DATABASE_URL
        )
        logger.info("✅ PostgreSQL connection pool created")
    except ImportError:
        logger.error("❌ psycopg2 not installed - falling back to SQLite")
        pg_pool = None
        USE_POSTGRESQL = False
    except Exception as e:
        logger.error(f"❌ Failed to create PostgreSQL pool: {e}")
        pg_pool = None
        USE_POSTGRESQL = False
else:
    pg_pool = None
    logger.info("🗃️ SQLite mode enabled")'''
    
    # Find and replace the pool initialization section
    pool_pattern = r'if USE_POSTGRESQL:[\s\S]*?else:\s*logger\.info\("🗃️ SQLite mode enabled"\)'
    content = re.sub(pool_pattern, new_pool_init, content, count=1)
    
    # Also need to import psycopg2 at the top if not already
    if 'import psycopg2' not in content:
        # Add after other imports
        import_pattern = r'(import traceback\nimport math)'
        content = re.sub(import_pattern, r'\1\nimport psycopg2\nfrom psycopg2 import pool', content)
    
    # Write the fixed file
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Fixed PostgreSQL pool initialization")
    print("\nChanges:")
    print("1. Using psycopg2.pool.SimpleConnectionPool instead of asyncpg")
    print("2. Proper connection pool with getconn/putconn methods")

if __name__ == "__main__":
    fix_pool()