#!/usr/bin/env python3
"""
Check the current status of applications in the database
"""
import os
import requests
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Checking Applications Status...")

# Check if applications table exists
print("\n1. Checking applications table structure:")
try:
    result = supabase.table('applications').select('*').limit(1).execute()
    print("   ✅ Applications table exists")
    print(f"   Sample data count: {len(result.data)}")
except Exception as e:
    print(f"   ❌ Applications table issue: {e}")

# Check total count of applications
print("\n2. Checking total applications count:")
try:
    result = supabase.table('applications').select('*').execute()
    applications = result.data or []
    print(f"   Total applications: {len(applications)}")
    
    if applications:
        print("   Sample applications:")
        for app in applications[:3]:
            print(f"     - ID: {app.get('id', 'N/A')}")
            print(f"       Project ID: {app.get('project_id', 'N/A')}")
            print(f"       Applicant ID: {app.get('applicant_id', 'N/A')}")
            print(f"       Status: {app.get('status', 'N/A')}")
            print(f"       Submitted: {app.get('submitted_at', 'N/A')}")
            print()
    else:
        print("   No applications found")
        
except Exception as e:
    print(f"   ❌ Error checking applications: {e}")

# Check related tables
print("\n3. Checking related tables:")

# Check applicants
try:
    result = supabase.table('applicants').select('id, full_name').limit(5).execute()
    applicants = result.data or []
    print(f"   Applicants available: {len(applicants)}")
    for app in applicants:
        print(f"     - {app.get('id')}: {app.get('full_name')}")
except Exception as e:
    print(f"   ❌ Error checking applicants: {e}")

# Check projects
try:
    result = supabase.table('projects').select('id, name').limit(5).execute()
    projects = result.data or []
    print(f"   Projects available: {len(projects)}")
    for proj in projects:
        print(f"     - {proj.get('id')}: {proj.get('name')}")
except Exception as e:
    print(f"   ❌ Error checking projects: {e}")

# Test API endpoint
print("\n4. Testing API endpoint:")
try:
    # Login first
    login_data = {"email": "developer@test.com", "password": "password123"}
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    
    if response.status_code == 200:
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test applications endpoint
        response = requests.get(f"{BASE_URL}/api/v1/applications", headers=headers)
        print(f"   API status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   API returned {data.get('count', 0)} applications")
        else:
            print(f"   API error: {response.text}")
    else:
        print(f"   Login failed: {response.status_code}")
        
except Exception as e:
    print(f"   ❌ API test error: {e}")

# Recommendations
print("\n5. Recommendations:")
print("   If no applications exist, you should:")
print("   - Create some test applications")
print("   - Ensure the application workflow works")
print("   - Test the full flow from project -> application -> review")