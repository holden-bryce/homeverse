#!/usr/bin/env python3
"""
API-based Database Initialization for HomeVerse Production

This script provides multiple API-based approaches to initialize the database.
"""

import requests
import json
import base64
import time

# Configuration
API_BASE_URL = "https://homeverse-api.onrender.com"
RENDER_API_URL = "https://api.render.com/v1"

def option1_direct_sql_api():
    """Option 1: Create a temporary SQL execution endpoint"""
    print("Option 1: Direct SQL Execution via API")
    print("="*50)
    
    # Add this endpoint to your simple_backend.py:
    endpoint_code = '''
@app.post("/api/temp-sql-init")
async def temp_sql_init(request: dict = Body(...)):
    """Temporary SQL initialization endpoint"""
    if request.get("secret") != "homeverse-sql-2024":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        if USE_POSTGRESQL:
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Execute SQL commands
            for sql in request.get("commands", []):
                cursor.execute(sql)
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"status": "success", "message": "SQL executed successfully"}
        else:
            return {"status": "info", "message": "Using SQLite - already initialized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
'''
    
    print("Add this endpoint to simple_backend.py and deploy")
    print("\nThen run:")
    
    sql_commands = [
        "CREATE TABLE IF NOT EXISTS companies (id TEXT PRIMARY KEY, key TEXT UNIQUE NOT NULL, name TEXT NOT NULL, plan TEXT DEFAULT 'trial', seats INTEGER DEFAULT 5, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, company_id TEXT, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT DEFAULT 'user', active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS applicants (id TEXT PRIMARY KEY, company_id TEXT, full_name TEXT NOT NULL, email TEXT, phone TEXT, income NUMERIC, household_size INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, company_id TEXT, name TEXT NOT NULL, description TEXT, total_units INTEGER, available_units INTEGER, ami_percentage INTEGER, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, company_id TEXT, user_id TEXT, action TEXT NOT NULL, resource_type TEXT, resource_id TEXT, details TEXT DEFAULT '{}', timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "CREATE TABLE IF NOT EXISTS contact_submissions (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        "INSERT INTO companies (id, key, name) VALUES ('4bbbe3f3-002e-427e-aca5-04860b345688', 'demo-company-2024', 'Demo Company') ON CONFLICT (key) DO UPDATE SET id = EXCLUDED.id",
        "INSERT INTO users (id, email, password_hash, role, company_id) VALUES ('dev-001', 'developer@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'developer', '4bbbe3f3-002e-427e-aca5-04860b345688') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role",
        "INSERT INTO users (id, email, password_hash, role, company_id) VALUES ('lender-001', 'lender@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'lender', '4bbbe3f3-002e-427e-aca5-04860b345688') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role",
        "INSERT INTO users (id, email, password_hash, role, company_id) VALUES ('buyer-001', 'buyer@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'buyer', '4bbbe3f3-002e-427e-aca5-04860b345688') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role",
        "INSERT INTO users (id, email, password_hash, role, company_id) VALUES ('applicant-001', 'applicant@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'applicant', '4bbbe3f3-002e-427e-aca5-04860b345688') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role",
        "INSERT INTO users (id, email, password_hash, role, company_id) VALUES ('admin-001', 'admin@test.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'admin', '4bbbe3f3-002e-427e-aca5-04860b345688') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role"
    ]
    
    payload = {
        "secret": "homeverse-sql-2024",
        "commands": sql_commands
    }
    
    print(f"\ncurl -X POST {API_BASE_URL}/api/temp-sql-init \\")
    print("  -H 'Content-Type: application/json' \\")
    print(f"  -d '{json.dumps(payload, indent=2)}'")

def option2_render_job_api():
    """Option 2: Use Render Jobs API to run initialization"""
    print("\nOption 2: Render Jobs API")
    print("="*50)
    
    job_command = "python3 -c \"$(cat <<'EOF'\n" + open('manual_db_init.py').read() + "\nEOF\n)\""
    
    print("Use Render CLI or API to create a one-off job:")
    print(f"\nrender jobs create --service homeverse-api --command '{job_command}'")
    
    print("\nOr via API:")
    print(f"""
curl -X POST {RENDER_API_URL}/services/srv-ct8i4bl6l47c73buvmg0/jobs \\
  -H "Authorization: Bearer YOUR_RENDER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{{"command": "python3 manual_db_init.py"}}'
""")

def option3_github_action():
    """Option 3: GitHub Action for initialization"""
    print("\nOption 3: GitHub Action")
    print("="*50)
    
    github_action = '''name: Initialize Production Database

on:
  workflow_dispatch:  # Manual trigger

jobs:
  init-db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install psycopg2-binary
      
      - name: Initialize database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          python manual_db_init.py
'''
    
    print("Create .github/workflows/init-db.yml:")
    print(github_action)
    print("\n1. Add DATABASE_URL to GitHub Secrets")
    print("2. Go to Actions tab and run the workflow manually")

def option4_vercel_edge_function():
    """Option 4: Deploy as Vercel Edge Function"""
    print("\nOption 4: Vercel Edge Function")
    print("="*50)
    
    vercel_function = '''// api/init-db.js
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { secret } = req.body;
  if (secret !== process.env.INIT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  try {
    // Create tables
    await sql`CREATE TABLE IF NOT EXISTS companies (...)`;
    await sql`CREATE TABLE IF NOT EXISTS users (...)`;
    
    // Insert data
    await sql`INSERT INTO companies VALUES (...) ON CONFLICT DO UPDATE`;
    await sql`INSERT INTO users VALUES (...) ON CONFLICT DO UPDATE`;
    
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
'''
    
    print("Deploy to Vercel and call:")
    print("curl -X POST https://your-app.vercel.app/api/init-db \\")
    print("  -H 'Content-Type: application/json' \\")
    print("  -d '{\"secret\": \"your-secret\"}'")

def option5_netlify_function():
    """Option 5: Netlify Function"""
    print("\nOption 5: Netlify Function")
    print("="*50)
    
    netlify_function = '''// netlify/functions/init-db.js
const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  
  const { secret } = JSON.parse(event.body);
  if (secret !== process.env.INIT_SECRET) {
    return { statusCode: 403, body: 'Forbidden' };
  }
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    
    // Run initialization
    await client.query('CREATE TABLE IF NOT EXISTS ...');
    // ... more queries
    
    await client.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
'''
    
    print("Deploy to Netlify and call the function endpoint")

def option6_aws_lambda():
    """Option 6: AWS Lambda Function"""
    print("\nOption 6: AWS Lambda")
    print("="*50)
    
    print("Create a Lambda function with RDS access:")
    print("""
1. Create Lambda function in same VPC as RDS
2. Add psycopg2-binary layer
3. Set DATABASE_URL environment variable
4. Deploy this code:

import json
import psycopg2
import os

def lambda_handler(event, context):
    if event.get('secret') != os.environ.get('INIT_SECRET'):
        return {'statusCode': 403, 'body': 'Forbidden'}
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    
    # Run initialization
    # ... SQL commands ...
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps({'success': True})
    }

5. Create API Gateway trigger
6. Call: POST https://api-id.execute-api.region.amazonaws.com/prod/init
""")

def test_authentication():
    """Test if authentication works after initialization"""
    print("\nTesting Authentication...")
    print("="*50)
    
    test_users = [
        ("developer@test.com", "password123"),
        ("lender@test.com", "password123"),
        ("buyer@test.com", "password123"),
        ("applicant@test.com", "password123"),
        ("admin@test.com", "password123")
    ]
    
    for email, password in test_users:
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/v1/auth/login",
                json={"email": email, "password": password},
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ {email} - Login successful")
            else:
                print(f"❌ {email} - Login failed ({response.status_code})")
                
        except Exception as e:
            print(f"❌ {email} - Error: {e}")

def main():
    """Show all API-based initialization options"""
    print("🚀 API-Based Database Initialization Options")
    print("="*50)
    
    option1_direct_sql_api()
    option2_render_job_api()
    option3_github_action()
    option4_vercel_edge_function()
    option5_netlify_function()
    option6_aws_lambda()
    
    print("\n" + "="*50)
    print("Choose the option that best fits your infrastructure!")
    print("\nAfter initialization, test with:")
    print("python3 api_db_init.py --test")

if __name__ == "__main__":
    import sys
    if "--test" in sys.argv:
        test_authentication()
    else:
        main()