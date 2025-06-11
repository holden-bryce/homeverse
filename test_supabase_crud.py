#!/usr/bin/env python3
"""Test Supabase CRUD operations to verify data access"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    exit(1)

# Initialize Supabase client with service key for admin access
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def test_applicant_creation():
    """Test creating an applicant"""
    print("\n=== Testing Applicant Creation ===")
    
    # Get default company
    default_company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
    if not default_company.data:
        print("❌ No default company found")
        return
    
    company_id = default_company.data['id']
    print(f"Using company ID: {company_id}")
    
    # Test data
    test_applicant = {
        "company_id": company_id,
        "full_name": "Test Applicant " + str(int(__import__('time').time())),
        "email": f"test{int(__import__('time').time())}@example.com",
        "phone": "555-123-4567",
        "income": 50000,
        "household_size": 2,
        "preferences": {
            "ami_percent": 80,
            "location_preference": "San Francisco, CA",
            "coordinates": None
        },
        "status": "active"
    }
    
    try:
        print("Creating applicant with data:", json.dumps(test_applicant, indent=2))
        result = supabase.table('applicants').insert(test_applicant).execute()
        print("✅ Applicant created successfully:", result.data[0]['id'])
        return result.data[0]['id']
    except Exception as e:
        print(f"❌ Failed to create applicant: {e}")
        return None

def test_project_creation():
    """Test creating a project"""
    print("\n=== Testing Project Creation ===")
    
    # Get default company
    default_company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
    if not default_company.data:
        print("❌ No default company found")
        return
    
    company_id = default_company.data['id']
    print(f"Using company ID: {company_id}")
    
    # Test data
    test_project = {
        "company_id": company_id,
        "name": "Test Project " + str(int(__import__('time').time())),
        "description": "A test housing project",
        "location": "123 Test Street, San Francisco, CA",
        "total_units": 100,
        "available_units": 50,
        "ami_percentage": 60,
        "amenities": ["parking", "gym"],
        "images": [],
        "status": "active"
    }
    
    try:
        print("Creating project with data:", json.dumps(test_project, indent=2))
        result = supabase.table('projects').insert(test_project).execute()
        print("✅ Project created successfully:", result.data[0]['id'])
        return result.data[0]['id']
    except Exception as e:
        print(f"❌ Failed to create project: {e}")
        return None

def test_read_operations():
    """Test reading data"""
    print("\n=== Testing Read Operations ===")
    
    try:
        # Test reading applicants
        applicants = supabase.table('applicants').select('*').limit(3).execute()
        print(f"✅ Read {len(applicants.data)} applicants")
        
        # Test reading projects 
        projects = supabase.table('projects').select('*').limit(3).execute()
        print(f"✅ Read {len(projects.data)} projects")
        
        # Test reading with company join
        applicants_with_company = supabase.table('applicants').select('*, companies(*)').limit(1).execute()
        if applicants_with_company.data:
            print(f"✅ Read applicant with company: {applicants_with_company.data[0]['companies']['name']}")
        
    except Exception as e:
        print(f"❌ Failed to read data: {e}")

def verify_rls_policies():
    """Verify RLS policies are working correctly"""
    print("\n=== Testing RLS Policies ===")
    
    try:
        # Try with anon key (should be restricted)
        anon_client = create_client(SUPABASE_URL, os.getenv("SUPABASE_ANON_KEY"))
        
        # This should fail or return limited data
        result = anon_client.table('applicants').select('*').execute()
        print(f"⚠️ Anon access to applicants: {len(result.data)} records (expected: 0 or limited)")
        
        # Service key should have full access
        service_result = supabase.table('applicants').select('*').execute()
        print(f"✅ Service key access to applicants: {len(service_result.data)} records")
        
    except Exception as e:
        print(f"❌ RLS test failed: {e}")

if __name__ == "__main__":
    print("🔍 Testing Supabase CRUD Operations...")
    
    # Test reads first
    test_read_operations()
    
    # Test creation
    applicant_id = test_applicant_creation()
    project_id = test_project_creation()
    
    # Test RLS
    verify_rls_policies()
    
    print("\n✅ CRUD test complete!")
    
    if applicant_id:
        print(f"Created test applicant: {applicant_id}")
    if project_id:
        print(f"Created test project: {project_id}")