
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
