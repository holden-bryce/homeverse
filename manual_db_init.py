#!/usr/bin/env python3
"""
Manual Database Initialization Script for HomeVerse Production

Run this script in the Render Shell to initialize the PostgreSQL database with test users.

Instructions:
1. Go to https://dashboard.render.com
2. Click on 'homeverse-api' service
3. Click on 'Shell' tab
4. Copy and paste this entire script
5. The database will be initialized with test users
"""

import psycopg2
import os
import hashlib
import uuid

def initialize_database():
    """Initialize the production database with test users"""
    try:
        # Connect to database
        print("Connecting to database...")
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cursor = conn.cursor()
        print("✅ Connected to database")

        # Check if tables exist
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
        columns = [row[0] for row in cursor.fetchall()]
        print(f"Existing user table columns: {columns}")

        # Create companies table
        print("\nCreating companies table...")
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
        print("✅ Companies table ready")

        # Create users table (without full_name requirement)
        if not columns:
            print("\nCreating users table...")
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
            print("✅ Users table created")
        else:
            print("✅ Users table already exists")

        # Create other required tables
        print("\nCreating other required tables...")
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS applicants (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            full_name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            income NUMERIC,
            household_size INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            company_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            total_units INTEGER,
            available_units INTEGER,
            ami_percentage INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        cursor.execute('''
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
        ''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS contact_submissions (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        print("✅ All tables created successfully")

        # Insert test company
        print("\nCreating test company...")
        company_id = str(uuid.uuid4())
        cursor.execute('''
        INSERT INTO companies (id, key, name) 
        VALUES (%s, 'demo-company-2024', 'Demo Company')
        ON CONFLICT (key) DO UPDATE SET id = EXCLUDED.id
        RETURNING id
        ''', (company_id,))
        company_id = cursor.fetchone()[0]
        print(f"✅ Company created with ID: {company_id}")

        # Hash password (using SHA256 as expected by the backend)
        password = 'password123'
        password_hash = hashlib.sha256(password.encode()).hexdigest()

        # Insert test users
        print("\nCreating test users...")
        users = [
            ('developer@test.com', 'developer', 'Dev Thompson'),
            ('lender@test.com', 'lender', 'Lenny Banks'),
            ('buyer@test.com', 'buyer', 'Barry Buyer'),
            ('applicant@test.com', 'applicant', 'Annie Applicant'),
            ('admin@test.com', 'admin', 'Admin User')
        ]

        for email, role, name in users:
            user_id = str(uuid.uuid4())
            try:
                cursor.execute('''
                INSERT INTO users (id, email, password_hash, role, company_id)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE 
                SET password_hash = EXCLUDED.password_hash,
                    role = EXCLUDED.role,
                    company_id = EXCLUDED.company_id
                ''', (user_id, email, password_hash, role, company_id))
                print(f"  ✅ Created user: {email} ({role})")
            except Exception as e:
                print(f"  ⚠️  Error creating {email}: {e}")

        # Commit all changes
        conn.commit()
        print("\n✅ Database initialized successfully!")

        # Verify users were created
        print("\nVerifying users:")
        cursor.execute('SELECT email, role FROM users ORDER BY email')
        for row in cursor.fetchall():
            print(f"  - {row[0]} ({row[1]})")

        # Close connection
        cursor.close()
        conn.close()
        
        print("\n" + "="*50)
        print("🎉 SUCCESS! Database initialization complete!")
        print("="*50)
        print("\nTest the login at: https://homeverse-frontend.onrender.com/auth/login")
        print("\nTest Credentials:")
        print("  - developer@test.com / password123")
        print("  - lender@test.com / password123")
        print("  - buyer@test.com / password123")
        print("  - applicant@test.com / password123")
        print("  - admin@test.com / password123")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure you're running this in the Render Shell")
        print("2. Check that DATABASE_URL environment variable is set")
        print("3. Try running the commands individually to identify the issue")

if __name__ == "__main__":
    initialize_database()