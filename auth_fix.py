#!/usr/bin/env python3
"""
Emergency Authentication Fix - Updates backend to properly use PostgreSQL
"""
import os

def create_backend_fix():
    """Create a fixed version of simple_backend.py that properly uses PostgreSQL"""
    
    # Read the current backend
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Fix 1: Add PostgreSQL get_db function after the SQLite get_db function
    pg_get_db_code = '''
def get_pg_db():
    """Get PostgreSQL database connection"""
    if USE_POSTGRESQL and pg_pool:
        conn = pg_pool.getconn()
        try:
            yield conn
        finally:
            pg_pool.putconn(conn)
    else:
        # Fallback to SQLite
        conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

def get_db():
    """Get database connection (PostgreSQL or SQLite)"""
    if USE_POSTGRESQL and pg_pool:
        conn = pg_pool.getconn()
        try:
            yield conn
        finally:
            pg_pool.putconn(conn)
    else:
        conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
'''
    
    # Replace the existing get_db function
    import re
    
    # Find and replace the get_db function
    pattern = r'def get_db\(\):.*?conn\.close\(\)'
    replacement = pg_get_db_code.strip()
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Fix 2: Update the login function to handle both column names
    # Replace hashed_password with password_hash in the login check
    content = content.replace("user['hashed_password']", "(user.get('hashed_password') or user.get('password_hash', ''))")
    
    # Fix 3: Add proper PostgreSQL user query handling
    login_fix = '''
        # Get user by email
        if USE_POSTGRESQL and pg_pool:
            cursor.execute(
                "SELECT * FROM users WHERE email = %s",
                (request.email,)
            )
            result = cursor.fetchone()
            if result:
                # Convert to dict
                columns = [desc[0] for desc in cursor.description]
                user = dict(zip(columns, result))
            else:
                user = None
        else:
            cursor.execute(
                "SELECT * FROM users WHERE email = ?",
                (request.email,)
            )
            user = cursor.fetchone()
'''
    
    # Find and fix the login endpoint
    pattern = r'cursor\.execute\(\s*"SELECT \* FROM users WHERE email = \?",\s*\(request\.email,\)\s*\)\s*user = cursor\.fetchone\(\)'
    content = re.sub(pattern, login_fix.strip(), content)
    
    # Write the fixed file
    with open('simple_backend_fixed.py', 'w') as f:
        f.write(content)
    
    print("✅ Created simple_backend_fixed.py with PostgreSQL fixes")
    print("\nNext steps:")
    print("1. Review the changes in simple_backend_fixed.py")
    print("2. Copy it over simple_backend.py")
    print("3. Commit and push to trigger deployment")

if __name__ == "__main__":
    create_backend_fix()