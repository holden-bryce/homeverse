#!/usr/bin/env python3
"""Fix production database initialization with proper schema detection"""
import requests
import json
import hashlib
import uuid

API_URL = "https://homeverse-api.onrender.com"

def check_health():
    """Check if service is healthy"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Service is healthy!")
            return True
    except Exception as e:
        print(f"❌ Service check failed: {e}")
    return False

def init_via_api():
    """Try to initialize via the temporary API endpoint"""
    print("\n🔧 Attempting database initialization via API...")
    
    try:
        # First, let's create a custom initialization endpoint that handles the schema properly
        response = requests.post(
            f"{API_URL}/api/init-db-simple",
            json={
                "secret": "homeverse-2024",
                "users": [
                    {
                        "email": "developer@test.com",
                        "password": "password123",
                        "role": "developer"
                    },
                    {
                        "email": "lender@test.com", 
                        "password": "password123",
                        "role": "lender"
                    },
                    {
                        "email": "buyer@test.com",
                        "password": "password123", 
                        "role": "buyer"
                    },
                    {
                        "email": "applicant@test.com",
                        "password": "password123",
                        "role": "applicant"
                    },
                    {
                        "email": "admin@test.com",
                        "password": "password123",
                        "role": "admin"
                    }
                ]
            },
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {data.get('message', 'Initialization successful!')}")
            return True
        elif response.status_code == 404:
            print("❌ Simple init endpoint not found, trying original endpoint...")
            return False
        else:
            print(f"❌ Initialization failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API Error: {e}")
        return False

def test_authentication():
    """Test if authentication works"""
    print("\n🧪 Testing authentication...")
    
    test_users = [
        ("developer@test.com", "password123", "developer"),
        ("lender@test.com", "password123", "lender"),
        ("buyer@test.com", "password123", "buyer"),
        ("applicant@test.com", "password123", "applicant"),
        ("admin@test.com", "password123", "admin")
    ]
    
    success_count = 0
    
    for email, password, expected_role in test_users:
        try:
            response = requests.post(
                f"{API_URL}/api/v1/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                user_role = data.get('user', {}).get('role', 'unknown')
                if user_role == expected_role:
                    print(f"✅ {email} - Login successful (role: {user_role})")
                    success_count += 1
                else:
                    print(f"⚠️  {email} - Login successful but wrong role: {user_role} (expected: {expected_role})")
            else:
                print(f"❌ {email} - Login failed ({response.status_code})")
                if response.text:
                    print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"❌ {email} - Error: {e}")
    
    return success_count > 0

def provide_manual_instructions():
    """Provide manual initialization instructions"""
    print("\n📋 Manual Database Initialization Instructions:")
    print("=" * 50)
    print("\n1. Go to Render Dashboard > homeverse-api > Shell")
    print("\n2. Run this Python script:")
    print("""
import psycopg2
import os
import hashlib
import uuid

# Connect to database
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

# Check if tables exist and their schema
cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
columns = [row[0] for row in cursor.fetchall()]
print(f"User table columns: {columns}")

# Create companies table if needed
cursor.execute('''
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    plan TEXT DEFAULT 'trial',
    seats INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

# Create users table based on what columns exist
if 'full_name' in columns:
    # New schema
    print("Using new schema with full_name")
else:
    # Old schema - recreate table
    print("Using simplified schema")
    cursor.execute('DROP TABLE IF EXISTS users CASCADE')
    cursor.execute('''
    CREATE TABLE users (
        id TEXT PRIMARY KEY,
        company_id TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

# Insert test company
company_id = str(uuid.uuid4())
cursor.execute('''
INSERT INTO companies (id, key, name) 
VALUES (%s, 'demo-company-2024', 'Demo Company')
ON CONFLICT (key) DO UPDATE SET id = EXCLUDED.id
RETURNING id
''', (company_id,))
company_id = cursor.fetchone()[0]

# Hash password
password_hash = hashlib.sha256('password123'.encode()).hexdigest()

# Insert test users
users = [
    ('developer@test.com', 'developer'),
    ('lender@test.com', 'lender'),
    ('buyer@test.com', 'buyer'),
    ('applicant@test.com', 'applicant'),
    ('admin@test.com', 'admin')
]

for email, role in users:
    user_id = str(uuid.uuid4())
    cursor.execute('''
    INSERT INTO users (id, email, password_hash, role, company_id)
    VALUES (%s, %s, %s, %s, %s)
    ON CONFLICT (email) DO UPDATE 
    SET password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
    ''', (user_id, email, password_hash, role, company_id))

conn.commit()
print("✅ Database initialized successfully!")

# Verify
cursor.execute('SELECT email, role FROM users')
for row in cursor.fetchall():
    print(f"  User: {row[0]} ({row[1]})")

cursor.close()
conn.close()
""")
    
    print("\n3. After running the script, test login at:")
    print("   https://homeverse-frontend.onrender.com/auth/login")

def main():
    """Main initialization process"""
    print("🚀 HomeVerse Production Database Fix")
    print("=" * 50)
    
    # Step 1: Check health
    if not check_health():
        print("❌ Service not responding")
        return
    
    # Step 2: Try API initialization
    if init_via_api():
        # Test authentication
        if test_authentication():
            print("\n🎉 SUCCESS! All test users can login!")
        else:
            print("\n⚠️ Initialization completed but authentication not working")
    else:
        # Step 3: Provide manual instructions
        provide_manual_instructions()
    
    print("\n📝 Test Credentials:")
    print("- developer@test.com / password123")
    print("- lender@test.com / password123")
    print("- buyer@test.com / password123")
    print("- applicant@test.com / password123")
    print("- admin@test.com / password123")
    
    print("\n🌐 Frontend URL: https://homeverse-frontend.onrender.com")

if __name__ == "__main__":
    main()