#!/usr/bin/env python3
"""
Fix Backend Authentication to Use PostgreSQL Properly
"""
import re

def fix_backend():
    # Read the current backend
    with open('simple_backend.py', 'r') as f:
        content = f.read()
    
    # Fix 1: Replace the get_db function to support PostgreSQL
    new_get_db = '''def get_db():
    """Get database connection"""
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
            conn.close()'''
    
    # Find and replace the get_db function
    pattern = r'def get_db\(\):.*?conn\.close\(\)'
    content = re.sub(pattern, new_get_db, content, flags=re.DOTALL)
    
    # Fix 2: Update get_user_by_email to work with PostgreSQL
    new_get_user = '''def get_user_by_email(conn, email: str):
    """Get user by email"""
    cursor = conn.cursor()
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if user:
            # Convert to dict for PostgreSQL
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, user))
    else:
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        return dict(user) if user else None
    
    return None'''
    
    # Replace get_user_by_email function
    pattern = r'def get_user_by_email\(conn, email: str\):.*?return dict\(user\) if user else None'
    content = re.sub(pattern, new_get_user, content, flags=re.DOTALL)
    
    # Fix 3: Update verify_user_credentials to handle both column names
    new_verify = '''def verify_user_credentials(conn, email: str, password: str):
    """Verify user login credentials"""
    user = get_user_by_email(conn, email)
    if not user:
        return None
    
    # Handle both column names for compatibility
    password_hash = user.get('hashed_password') or user.get('password_hash')
    if password_hash and verify_password(password, password_hash):
        return user
    return None'''
    
    # Replace verify_user_credentials function
    pattern = r'def verify_user_credentials\(conn, email: str, password: str\):.*?return None'
    content = re.sub(pattern, new_verify, content, flags=re.DOTALL)
    
    # Fix 4: Update create_user to use password_hash for PostgreSQL
    new_create_user = '''def create_user(conn, email: str, password: str, company_id: str, role: str = "user"):
    """Create new user"""
    cursor = conn.cursor()
    
    # Check if user exists
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    else:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    
    if cursor.fetchone():
        raise ValidationError("User with this email already exists", field="email")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO users (id, company_id, email, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, company_id, email, hashed_pw, role))
    else:
        cursor.execute("""
            INSERT INTO users (id, company_id, email, hashed_password, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, company_id, email, hashed_pw, role))
    
    conn.commit()
    return {"id": user_id, "email": email, "role": role, "company_id": company_id}'''
    
    # Replace create_user function
    pattern = r'def create_user\(conn, email: str, password: str, company_id: str, role: str = "user"\):.*?return {"id": user_id, "email": email, "role": role, "company_id": company_id}'
    content = re.sub(pattern, new_create_user, content, flags=re.DOTALL)
    
    # Fix 5: Update get_or_create_company for PostgreSQL
    new_get_company = '''def get_or_create_company(conn, company_key: str):
    """Get or create company by key"""
    cursor = conn.cursor()
    
    # Try to get existing company
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT * FROM companies WHERE key = %s", (company_key,))
        company = cursor.fetchone()
        if company:
            columns = [desc[0] for desc in cursor.description]
            company = dict(zip(columns, company))
    else:
        cursor.execute("SELECT * FROM companies WHERE key = ?", (company_key,))
        company = cursor.fetchone()
        if company:
            company = dict(company)
    
    if not company:
        # Create new company
        company_id = str(uuid.uuid4())
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("""
                INSERT INTO companies (id, key, name, plan, seats) 
                VALUES (%s, %s, %s, %s, %s)
            """, (company_id, company_key, f"Company {company_key}", "basic", 10))
        else:
            cursor.execute("""
                INSERT INTO companies (id, key, name, plan, seats) 
                VALUES (?, ?, ?, ?, ?)
            """, (company_id, company_key, f"Company {company_key}", "basic", 10))
        conn.commit()
        
        # Fetch the created company
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
            company = cursor.fetchone()
            columns = [desc[0] for desc in cursor.description]
            company = dict(zip(columns, company))
        else:
            cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
            company = cursor.fetchone()
            company = dict(company)
    
    return company'''
    
    # Replace get_or_create_company function
    pattern = r'def get_or_create_company\(conn, company_key: str\):.*?return dict\(company\)'
    content = re.sub(pattern, new_get_company, content, flags=re.DOTALL)
    
    # Write the fixed backend
    with open('simple_backend.py', 'w') as f:
        f.write(content)
    
    print("✅ Fixed simple_backend.py to properly use PostgreSQL!")
    print("\nChanges made:")
    print("1. ✅ get_db() now uses PostgreSQL when configured")
    print("2. ✅ get_user_by_email() handles PostgreSQL result conversion")
    print("3. ✅ verify_user_credentials() checks both column names")
    print("4. ✅ create_user() uses correct column names for each DB")
    print("5. ✅ get_or_create_company() handles PostgreSQL queries")
    print("\nAuthentication should now work with PostgreSQL!")

if __name__ == "__main__":
    fix_backend()