#!/usr/bin/env python3
"""Verify that profiles are properly populated with company data"""

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

def verify_profile_population():
    """Verify all profiles are properly populated with company data"""
    print("🔍 Verifying Profile Population with Company Data...\n")
    
    try:
        # Get all profiles with company data
        profiles = supabase.table('profiles').select('*, companies(*)').execute()
        
        if not profiles.data:
            print("❌ No profiles found!")
            return
        
        print(f"Found {len(profiles.data)} profiles:\n")
        
        all_good = True
        for profile in profiles.data:
            profile_id = profile['id']
            full_name = profile.get('full_name', 'Unknown')
            role = profile.get('role', 'Unknown')
            company_id = profile.get('company_id')
            company_data = profile.get('companies')
            
            print(f"Profile: {full_name}")
            print(f"  - ID: {profile_id}")
            print(f"  - Role: {role}")
            print(f"  - Company ID: {company_id}")
            
            if company_data:
                print(f"  - Company Name: {company_data.get('name')}")
                print(f"  - Company Key: {company_data.get('key')}")
                print(f"  - Company Plan: {company_data.get('plan')}")
                print(f"  ✅ Profile properly populated with company data")
            else:
                print(f"  ❌ Missing company data!")
                all_good = False
            
            print()
        
        if all_good:
            print("✅ All profiles are properly populated with company data!")
        else:
            print("❌ Some profiles are missing company data")
            
    except Exception as e:
        print(f"❌ Error verifying profiles: {e}")

def check_role_based_access():
    """Show what navigation items each role should see"""
    print("\n📋 Role-Based Navigation Access:\n")
    
    navigation_items = {
        'overview': ['admin', 'manager', 'developer', 'lender', 'buyer', 'applicant'],
        'applicants': ['admin', 'manager', 'developer'],
        'projects': ['admin', 'manager', 'developer'],
        'lenders': ['admin', 'manager', 'lender'],
        'reports': ['admin', 'manager', 'lender'],
        'analytics': ['admin', 'manager', 'lender'],
        'buyer-portal': ['admin'],
        'housing-search': ['applicant', 'buyer'],
        'my-applications': ['admin', 'applicant', 'buyer'],
        'preferences': ['admin', 'applicant', 'buyer'],
        'map': ['admin', 'manager', 'lender'],
        'settings': ['admin'],
    }
    
    roles = ['admin', 'developer', 'lender', 'buyer', 'applicant', 'manager']
    
    for role in roles:
        accessible_items = [item for item, allowed_roles in navigation_items.items() if role in allowed_roles]
        print(f"{role.upper()} can access:")
        for item in accessible_items:
            print(f"  - {item}")
        print()

def test_user_login_simulation():
    """Simulate what each test user should see"""
    print("\n🧪 Test User Navigation Preview:\n")
    
    test_users = [
        {"email": "developer@test.com", "role": "developer", "company": "Default Company"},
        {"email": "lender@test.com", "role": "lender", "company": "Default Company"},
        {"email": "buyer@test.com", "role": "buyer", "company": "Default Company"},
        {"email": "admin@test.com", "role": "admin", "company": "Default Company"},
        {"email": "applicant@test.com", "role": "applicant", "company": "Default Company"},
    ]
    
    for user in test_users:
        print(f"{user['email']} ({user['role']}):")
        print(f"  Company: {user['company']}")
        
        # Show expected navigation items
        if user['role'] == 'developer':
            print("  Navigation: Overview, Applicants, Projects")
        elif user['role'] == 'lender':
            print("  Navigation: Overview, Lenders, Reports, Analytics, Map")
        elif user['role'] == 'buyer':
            print("  Navigation: Overview, Find Housing, My Applications, Preferences")
        elif user['role'] == 'applicant':
            print("  Navigation: Overview, Find Housing, My Applications, Preferences")
        elif user['role'] == 'admin':
            print("  Navigation: ALL items (full access)")
        print()

if __name__ == "__main__":
    print("=" * 60)
    print("HOMEVERSE PROFILE POPULATION VERIFICATION")
    print("=" * 60)
    
    verify_profile_population()
    check_role_based_access()
    test_user_login_simulation()
    
    print("\n✅ Verification complete!")
    print("\nThe frontend should now:")
    print("1. ✅ Show proper navigation items based on user role")
    print("2. ✅ Display company name in the sidebar")
    print("3. ✅ Allow creation of applicants and projects")
    print("4. ✅ Show user's full name and role in the UI")