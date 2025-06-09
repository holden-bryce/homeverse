#!/usr/bin/env python3
"""Initialize production database with test users via API"""
import requests
import json
import time

API_URL = "https://homeverse-api.onrender.com"

def test_current_state():
    """Test current authentication state"""
    print("🧪 Testing current authentication state...")
    
    response = requests.post(
        f"{API_URL}/api/v1/auth/login",
        json={"email": "developer@test.com", "password": "password123"}
    )
    
    if response.status_code == 200:
        print("✅ Authentication already working!")
        return True
    elif response.status_code == 500:
        print("❌ Authentication failing - database needs initialization")
        return False
    else:
        print(f"⚠️ Unexpected status: {response.status_code}")
        return False

def initialize_via_api():
    """Try to initialize database via API endpoints"""
    print("\n🔧 Attempting to initialize database via API...")
    
    # First, try to trigger database initialization by accessing certain endpoints
    endpoints_to_try = [
        ("/health", "GET"),
        ("/", "GET"),
        ("/api/v1/auth/register", "POST"),
    ]
    
    for endpoint, method in endpoints_to_try:
        print(f"Trying {method} {endpoint}...")
        try:
            if method == "GET":
                response = requests.get(f"{API_URL}{endpoint}")
            else:
                # Try to register a new user which might trigger DB init
                response = requests.post(
                    f"{API_URL}{endpoint}",
                    json={
                        "email": "test@example.com",
                        "password": "password123",
                        "full_name": "Test User",
                        "role": "developer"
                    }
                )
            print(f"Response: {response.status_code}")
        except Exception as e:
            print(f"Error: {e}")

def check_database_type():
    """Check what database is being used"""
    print("\n📊 Checking database configuration...")
    
    response = requests.get(f"{API_URL}/")
    if response.status_code == 200:
        data = response.json()
        db_type = data.get("database", "unknown")
        print(f"Database type: {db_type}")
        return db_type
    return "unknown"

def create_temporary_fix():
    """Create a temporary fix script"""
    print("\n📝 Creating temporary fix instructions...")
    
    fix_content = """
# Temporary Fix for Authentication

## Option 1: Switch to SQLite (Quickest)
1. Go to Render Dashboard > homeverse-api > Environment
2. Add environment variable: `USE_SQLITE=true`
3. Add environment variable: `DATABASE_PATH=homeverse_demo.db`
4. Save and let it redeploy

## Option 2: Initialize PostgreSQL
1. Go to Render Dashboard > homeverse-api > Shell
2. Run these commands:
   ```python
   import psycopg2
   import os
   import hashlib
   
   # Connect to database
   conn = psycopg2.connect(os.getenv('DATABASE_URL'))
   cursor = conn.cursor()
   
   # Create tables
   cursor.execute('''
   CREATE TABLE IF NOT EXISTS companies (
       id TEXT PRIMARY KEY,
       name TEXT NOT NULL,
       company_key TEXT UNIQUE NOT NULL
   )
   ''')
   
   cursor.execute('''
   CREATE TABLE IF NOT EXISTS users (
       id TEXT PRIMARY KEY,
       email TEXT UNIQUE NOT NULL,
       password_hash TEXT NOT NULL,
       full_name TEXT NOT NULL,
       role TEXT NOT NULL,
       company_id TEXT
   )
   ''')
   
   # Insert test company
   cursor.execute('''
   INSERT INTO companies (id, name, company_key) 
   VALUES ('test-company', 'Demo Company', 'demo-company-2024')
   ON CONFLICT DO NOTHING
   ''')
   
   # Insert test users (password: password123)
   password_hash = hashlib.sha256('password123'.encode()).hexdigest()
   
   users = [
       ('developer@test.com', 'Dev Thompson', 'developer'),
       ('lender@test.com', 'Lenny Banks', 'lender'),
       ('admin@test.com', 'Admin User', 'admin')
   ]
   
   for email, name, role in users:
       cursor.execute('''
       INSERT INTO users (id, email, password_hash, full_name, role, company_id)
       VALUES (%s, %s, %s, %s, %s, 'test-company')
       ON CONFLICT DO NOTHING
       ''', (email.split('@')[0], email, password_hash, name, role))
   
   conn.commit()
   print("✅ Database initialized!")
   ```
"""
    
    with open("AUTHENTICATION_FIX.md", "w") as f:
        f.write(fix_content)
    
    print("✅ Fix instructions saved to AUTHENTICATION_FIX.md")

def main():
    """Main function"""
    print("🚀 Production Database Initialization Helper")
    print("=" * 50)
    
    # Check current state
    if test_current_state():
        print("\n✅ Authentication is already working! No action needed.")
        return
    
    # Check database type
    db_type = check_database_type()
    
    if db_type == "postgresql":
        print("\n⚠️ PostgreSQL is configured but not initialized")
        print("The database needs test users to be created.")
    elif db_type == "sqlite":
        print("\n✅ SQLite is configured - authentication should work")
    
    # Try to initialize via API
    initialize_via_api()
    
    # Test again
    time.sleep(2)
    if test_current_state():
        print("\n✅ Authentication fixed!")
    else:
        print("\n❌ Authentication still not working")
        create_temporary_fix()
        print("\n📋 Next Steps:")
        print("1. Check AUTHENTICATION_FIX.md for manual fix instructions")
        print("2. Access Render dashboard to apply the fix")
        print("3. Run this script again to verify")

if __name__ == "__main__":
    main()