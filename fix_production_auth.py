#!/usr/bin/env python3
"""Fix Production Authentication - Initialize Database with Test Users"""
import os
import psycopg2
import hashlib
import json
from datetime import datetime
import uuid

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_test_users():
    """Create test users in production database"""
    
    # Production database URL from Render
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set. Using test URL...")
        # This is a placeholder - you'll need to set the actual URL from Render
        DATABASE_URL = "postgresql://homeverse_user:password@dpg-xxxxx.render.com/homeverse_db"
    
    try:
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        print("✅ Connected to PostgreSQL database")
        
        # Create companies table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS companies (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                company_key TEXT UNIQUE NOT NULL,
                plan TEXT DEFAULT 'trial',
                max_users INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                settings JSONB DEFAULT '{}'::jsonb
            )
        """)
        
        # Create users table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT NOT NULL,
                company_id TEXT REFERENCES companies(id),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                profile JSONB DEFAULT '{}'::jsonb
            )
        """)
        
        # Create default company
        company_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO companies (id, name, company_key, plan, max_users)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (company_key) DO UPDATE
            SET name = EXCLUDED.name
            RETURNING id
        """, (company_id, "Demo Company", "demo-company-2024", "premium", 50))
        
        result = cursor.fetchone()
        if result:
            company_id = result[0]
        
        # Test users data
        test_users = [
            {
                "email": "developer@test.com",
                "password": "password123",
                "full_name": "Dev Thompson",
                "role": "developer"
            },
            {
                "email": "lender@test.com",
                "password": "password123",
                "full_name": "Lenny Banks",
                "role": "lender"
            },
            {
                "email": "buyer@test.com",
                "password": "password123",
                "full_name": "Bailey Buyer",
                "role": "buyer"
            },
            {
                "email": "applicant@test.com",
                "password": "password123",
                "full_name": "Alex Applicant",
                "role": "applicant"
            },
            {
                "email": "admin@test.com",
                "password": "password123",
                "full_name": "Admin User",
                "role": "admin"
            }
        ]
        
        # Create test users
        for user_data in test_users:
            user_id = str(uuid.uuid4())
            password_hash = hash_password(user_data["password"])
            
            cursor.execute("""
                INSERT INTO users (id, email, password_hash, full_name, role, company_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE
                SET password_hash = EXCLUDED.password_hash,
                    full_name = EXCLUDED.full_name,
                    role = EXCLUDED.role
            """, (
                user_id,
                user_data["email"],
                password_hash,
                user_data["full_name"],
                user_data["role"],
                company_id
            ))
            
            print(f"✅ Created/Updated user: {user_data['email']} ({user_data['role']})")
        
        # Create other required tables
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS applicants (
                id TEXT PRIMARY KEY,
                company_id TEXT REFERENCES companies(id),
                full_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                income NUMERIC,
                household_size INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                company_id TEXT REFERENCES companies(id),
                name TEXT NOT NULL,
                description TEXT,
                total_units INTEGER,
                available_units INTEGER,
                ami_percentage INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                company_id TEXT REFERENCES companies(id),
                user_id TEXT REFERENCES users(id),
                action TEXT NOT NULL,
                resource_type TEXT,
                resource_id TEXT,
                details JSONB DEFAULT '{}'::jsonb,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Commit all changes
        conn.commit()
        print("\n✅ Database initialization complete!")
        print("✅ All test users created successfully")
        print("\n📝 Test Credentials:")
        print("-" * 40)
        for user in test_users:
            print(f"Email: {user['email']}")
            print(f"Password: {user['password']}")
            print(f"Role: {user['role']}")
            print("-" * 40)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

def test_authentication():
    """Test authentication with created users"""
    import requests
    
    api_url = "https://homeverse-api.onrender.com"
    
    print("\n🧪 Testing authentication...")
    
    try:
        # Test login
        response = requests.post(
            f"{api_url}/api/v1/auth/login",
            json={
                "email": "developer@test.com",
                "password": "password123"
            }
        )
        
        if response.status_code == 200:
            print("✅ Authentication test passed!")
            data = response.json()
            print(f"✅ Token received: {data.get('access_token', '')[:20]}...")
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    print("🔧 Fixing Production Authentication...")
    print("=" * 50)
    
    # First create users
    create_test_users()
    
    # Then test authentication
    test_authentication()