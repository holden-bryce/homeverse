#!/usr/bin/env python3
"""
Initialize a clean PostgreSQL database for HomeVerse Production

This script creates the proper schema without the full_name requirement
that was causing issues before.
"""

import psycopg2
import os
import hashlib
import uuid
import sys

def create_minimal_schema(cursor):
    """Create tables with minimal schema that matches what the code expects"""
    
    print("Creating tables with correct schema...")
    
    # Companies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            plan TEXT DEFAULT 'trial',
            seats INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Users table - minimal schema without full_name
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            company_id TEXT REFERENCES companies(id),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Applicants table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS applicants (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            income NUMERIC,
            household_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            total_units INTEGER,
            available_units INTEGER,
            ami_percentage INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Activities table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            user_id TEXT,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id TEXT,
            details TEXT DEFAULT '{}',
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Contact submissions table
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
    
    print("✅ All tables created successfully")

def insert_test_data(cursor):
    """Insert test data"""
    
    print("\nInserting test data...")
    
    # Create test company
    company_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO companies (id, key, name) 
        VALUES (%s, 'demo-company-2024', 'Demo Company')
        ON CONFLICT (key) DO UPDATE SET id = EXCLUDED.id
        RETURNING id
    """, (company_id,))
    company_id = cursor.fetchone()[0]
    print(f"✅ Company created: {company_id}")
    
    # Hash password (SHA256 as expected by the backend)
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
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, role, company_id)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (email) DO UPDATE 
            SET password_hash = EXCLUDED.password_hash,
                role = EXCLUDED.role,
                company_id = EXCLUDED.company_id
        """, (user_id, email, password_hash, role, company_id))
        print(f"✅ User created: {email} ({role})")
    
    print("\n✅ Test data inserted successfully")

def main():
    """Main initialization"""
    
    print("🚀 HomeVerse Clean PostgreSQL Initialization")
    print("="*50)
    
    # Get database URL
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("❌ DATABASE_URL not set!")
        print("\nOptions:")
        print("1. Run this in Render Shell where DATABASE_URL is set")
        print("2. Export DATABASE_URL before running:")
        print("   export DATABASE_URL='postgresql://...'")
        sys.exit(1)
    
    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor()
        print("✅ Connected to database")
        
        # Create schema
        create_minimal_schema(cursor)
        
        # Insert test data
        insert_test_data(cursor)
        
        # Commit changes
        conn.commit()
        
        # Verify
        print("\nVerifying data...")
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"Total users: {user_count}")
        
        cursor.execute("SELECT email, role FROM users ORDER BY email")
        print("\nUsers in database:")
        for email, role in cursor.fetchall():
            print(f"  - {email} ({role})")
        
        # Close connection
        cursor.close()
        conn.close()
        
        print("\n" + "="*50)
        print("🎉 SUCCESS! Database initialized for production!")
        print("="*50)
        print("\nTest at: https://homeverse-frontend.onrender.com/auth/login")
        print("\nCredentials:")
        print("  - developer@test.com / password123")
        print("  - lender@test.com / password123")
        print("  - buyer@test.com / password123")
        print("  - applicant@test.com / password123")
        print("  - admin@test.com / password123")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nThis script should be run in the Render Shell")
        print("or with a valid DATABASE_URL environment variable")
        sys.exit(1)

if __name__ == "__main__":
    main()