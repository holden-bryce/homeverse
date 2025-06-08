#!/usr/bin/env python3
"""Production initialization script - ensures database and test users exist"""
import os
import sqlite3
import hashlib
import uuid
from datetime import datetime

def init_production_db():
    """Initialize production database with proper schema and test data"""
    
    # Use environment variable or default path
    db_path = os.getenv("DATABASE_PATH", "homeverse_demo.db")
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(os.path.abspath(db_path)) or ".", exist_ok=True)
    
    print(f"Initializing database at: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create all tables
    cursor.executescript("""
    -- Companies table
    CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        plan TEXT DEFAULT 'basic',
        seats INTEGER DEFAULT 5,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
    );

    -- Applicants table
    CREATE TABLE IF NOT EXISTS applicants (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        user_id TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        annual_income REAL,
        household_size INTEGER,
        employment_status TEXT,
        location TEXT,
        preferences TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        user_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        total_units INTEGER,
        available_units INTEGER,
        ami_percentage REAL,
        min_income REAL,
        max_income REAL,
        application_deadline DATE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    );

    -- Activities table
    CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        company_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        entity_type TEXT,
        entity_id TEXT,
        metadata TEXT,
        status TEXT DEFAULT 'info',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (company_id) REFERENCES companies (id)
    );

    -- Additional tables...
    CREATE TABLE IF NOT EXISTS contact_submissions (
        id TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT,
        message TEXT NOT NULL,
        department TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES companies (id)
    );
    """)
    
    # Create test company
    company_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT OR IGNORE INTO companies (id, key, name, plan, seats)
        VALUES (?, ?, ?, ?, ?)
    """, (company_id, "test-company", "Test Company", "enterprise", 100))
    
    # Get company ID (in case it already existed)
    cursor.execute("SELECT id FROM companies WHERE key = ?", ("test-company",))
    company_id = cursor.fetchone()[0]
    
    # Create test users
    test_users = [
        {"email": "developer@test.com", "password": "password123", "role": "developer"},
        {"email": "lender@test.com", "password": "password123", "role": "lender"},
        {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
        {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
        {"email": "admin@test.com", "password": "password123", "role": "admin"},
    ]
    
    for user_data in test_users:
        # Hash password
        password_hash = hashlib.sha256(user_data["password"].encode()).hexdigest()
        
        # Create user
        user_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT OR IGNORE INTO users (id, company_id, email, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, company_id, user_data["email"], password_hash, user_data["role"]))
        
        print(f"✅ Created/verified user: {user_data['email']} ({user_data['role']})")
    
    # Add some demo data
    cursor.execute("SELECT COUNT(*) FROM projects WHERE company_id = ?", (company_id,))
    if cursor.fetchone()[0] == 0:
        # Add demo projects
        projects = [
            {
                "name": "Sunset Gardens",
                "description": "Modern affordable housing complex",
                "location": "San Francisco, CA",
                "total_units": 120,
                "available_units": 45,
                "ami_percentage": 80
            },
            {
                "name": "Harbor View Apartments",
                "description": "Waterfront affordable community",
                "location": "Seattle, WA",
                "total_units": 200,
                "available_units": 78,
                "ami_percentage": 60
            }
        ]
        
        for project in projects:
            project_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO projects 
                (id, company_id, name, description, location, total_units, available_units, ami_percentage)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (project_id, company_id, project["name"], project["description"], 
                  project["location"], project["total_units"], project["available_units"], 
                  project["ami_percentage"]))
        
        print("✅ Added demo projects")
    
    conn.commit()
    conn.close()
    
    print(f"✅ Production database initialized successfully at {db_path}")
    
    # Verify database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"📊 Total users in database: {user_count}")
    conn.close()

if __name__ == "__main__":
    init_production_db()