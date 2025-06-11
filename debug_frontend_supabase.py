#!/usr/bin/env python3
"""Debug Supabase frontend issues - check user profiles and companies"""

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

def check_companies():
    """Check existing companies"""
    print("\n=== Companies ===")
    try:
        companies = supabase.table('companies').select('*').execute()
        if companies.data:
            for company in companies.data:
                print(f"Company: {company['name']} (key: {company['key']}) - ID: {company['id']}")
        else:
            print("No companies found")
    except Exception as e:
        print(f"Error fetching companies: {e}")

def check_profiles():
    """Check user profiles"""
    print("\n=== User Profiles ===")
    try:
        profiles = supabase.table('profiles').select('*, companies(*)').execute()
        if profiles.data:
            for profile in profiles.data:
                print(f"Profile: {profile['full_name']} ({profile['role']}) - Company ID: {profile.get('company_id')} - Company: {profile.get('companies', {}).get('name', 'N/A') if profile.get('companies') else 'N/A'}")
        else:
            print("No profiles found")
    except Exception as e:
        print(f"Error fetching profiles: {e}")

def check_auth_users():
    """Check auth users"""
    print("\n=== Auth Users ===")
    try:
        # Use admin API to list users
        users = supabase.auth.admin.list_users()
        if users:
            for user in users:
                print(f"User: {user.email} - ID: {user.id} - Metadata: {user.user_metadata}")
        else:
            print("No auth users found")
    except Exception as e:
        print(f"Error fetching auth users: {e}")

def check_applicants():
    """Check existing applicants"""
    print("\n=== Applicants ===")
    try:
        applicants = supabase.table('applicants').select('*').execute()
        if applicants.data:
            print(f"Found {len(applicants.data)} applicants")
            for applicant in applicants.data[:3]:  # Show first 3
                print(f"  - {applicant['full_name']} (Company ID: {applicant.get('company_id')})")
        else:
            print("No applicants found")
    except Exception as e:
        print(f"Error fetching applicants: {e}")

def check_projects():
    """Check existing projects"""
    print("\n=== Projects ===")
    try:
        projects = supabase.table('projects').select('*').execute()
        if projects.data:
            print(f"Found {len(projects.data)} projects")
            for project in projects.data[:3]:  # Show first 3
                print(f"  - {project['name']} (Company ID: {project.get('company_id')})")
        else:
            print("No projects found")
    except Exception as e:
        print(f"Error fetching projects: {e}")

def fix_default_company():
    """Ensure default company exists"""
    print("\n=== Fixing Default Company ===")
    try:
        # Check if default company exists
        default_company = supabase.table('companies').select('*').eq('key', 'default-company').execute()
        
        if not default_company.data:
            print("Creating default company...")
            company = supabase.table('companies').insert({
                "name": "Default Company",
                "key": "default-company", 
                "plan": "trial",
                "seats": 100
            }).execute()
            print(f"✅ Created default company: {company.data[0]['id']}")
            return company.data[0]['id']
        else:
            print(f"✅ Default company exists: {default_company.data[0]['id']}")
            return default_company.data[0]['id']
    except Exception as e:
        print(f"❌ Error with default company: {e}")
        return None

def fix_profiles():
    """Fix user profiles that are missing company_id"""
    print("\n=== Fixing User Profiles ===")
    try:
        # Get all profiles without company_id
        broken_profiles = supabase.table('profiles').select('*').is_('company_id', 'null').execute()
        
        if broken_profiles.data:
            # Get default company ID
            default_company_id = fix_default_company()
            if not default_company_id:
                print("❌ Can't fix profiles without default company")
                return
            
            print(f"Found {len(broken_profiles.data)} profiles without company_id")
            for profile in broken_profiles.data:
                print(f"Fixing profile: {profile['full_name']} ({profile['id']})")
                supabase.table('profiles').update({
                    'company_id': default_company_id
                }).eq('id', profile['id']).execute()
                print(f"✅ Fixed profile {profile['full_name']}")
        else:
            print("✅ All profiles have company_id")
    except Exception as e:
        print(f"❌ Error fixing profiles: {e}")

def create_test_users():
    """Create test users if they don't exist"""
    print("\n=== Creating Test Users ===")
    
    test_users = [
        {"email": "developer@test.com", "password": "password123", "role": "developer", "full_name": "Test Developer"},
        {"email": "lender@test.com", "password": "password123", "role": "lender", "full_name": "Test Lender"},
        {"email": "buyer@test.com", "password": "password123", "role": "buyer", "full_name": "Test Buyer"},
        {"email": "admin@test.com", "password": "password123", "role": "admin", "full_name": "Test Admin"}
    ]
    
    default_company_id = fix_default_company()
    if not default_company_id:
        print("❌ Can't create users without default company")
        return
    
    for user_data in test_users:
        try:
            # Check if user already exists
            existing_users = supabase.auth.admin.list_users()
            existing_emails = [u.email for u in existing_users if u.email]
            
            if user_data["email"] in existing_emails:
                print(f"✅ User {user_data['email']} already exists")
                continue
            
            print(f"Creating user: {user_data['email']}")
            
            # Create user with admin API
            auth_response = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user_data["full_name"],
                    "role": user_data["role"]
                }
            })
            
            if auth_response.user:
                # Create profile
                supabase.table('profiles').insert({
                    "id": auth_response.user.id,
                    "company_id": default_company_id,
                    "role": user_data["role"],
                    "full_name": user_data["full_name"]
                }).execute()
                
                print(f"✅ Created user and profile for {user_data['email']}")
            else:
                print(f"❌ Failed to create user {user_data['email']}")
                
        except Exception as e:
            print(f"❌ Error creating user {user_data['email']}: {e}")

if __name__ == "__main__":
    print("🔍 Debugging Supabase Frontend Issues...")
    
    # Check current state
    check_companies()
    check_profiles()
    check_auth_users()
    check_applicants()
    check_projects()
    
    # Fix issues
    fix_default_company()
    fix_profiles()
    create_test_users()
    
    print("\n" + "="*50)
    print("🔍 Final State Check...")
    check_companies()
    check_profiles()
    
    print("\n✅ Debug complete!")
    print("\nTest credentials:")
    print("- developer@test.com / password123")
    print("- lender@test.com / password123") 
    print("- buyer@test.com / password123")
    print("- admin@test.com / password123")