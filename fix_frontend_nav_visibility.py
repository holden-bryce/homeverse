#!/usr/bin/env python3
"""Quick fix to ensure navigation visibility for all test users"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def ensure_all_profiles_complete():
    """Ensure all profiles have complete data including role and company_id"""
    print("🔧 Ensuring all profiles are complete...\n")
    
    # Get default company ID
    default_company_id = "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8"
    
    # Test users with their expected roles
    test_users = [
        {"id": "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2", "email": "developer@test.com", "role": "developer", "full_name": "Developer User"},
        {"id": "d1c01378-e3d8-48f6-9c8e-6da8487d13e6", "email": "lender@test.com", "role": "lender", "full_name": "Lender User"},
        {"id": "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027", "email": "buyer@test.com", "role": "buyer", "full_name": "Buyer User"},
        {"id": "40e47137-78fd-4db6-a195-ba3aadc67eda", "email": "admin@test.com", "role": "admin", "full_name": "Admin User"},
        {"id": "55c8c24e-05eb-4a1b-b820-02e8b664cfc6", "email": "applicant@test.com", "role": "applicant", "full_name": "Applicant User"}
    ]
    
    for user in test_users:
        try:
            # Check current profile
            profile = supabase.table('profiles').select('*').eq('id', user['id']).single().execute()
            
            update_needed = False
            updates = {}
            
            if profile.data:
                # Check if updates are needed
                if not profile.data.get('company_id'):
                    updates['company_id'] = default_company_id
                    update_needed = True
                
                if profile.data.get('role') != user['role']:
                    updates['role'] = user['role']
                    update_needed = True
                
                if not profile.data.get('full_name') or profile.data.get('full_name') == user['email'].split('@')[0]:
                    updates['full_name'] = user['full_name']
                    update_needed = True
                
                if update_needed:
                    print(f"Updating {user['email']}...")
                    result = supabase.table('profiles').update(updates).eq('id', user['id']).execute()
                    print(f"✅ Updated: {updates}")
                else:
                    print(f"✅ {user['email']} profile is complete")
            else:
                # Create profile
                print(f"Creating profile for {user['email']}...")
                result = supabase.table('profiles').insert({
                    'id': user['id'],
                    'company_id': default_company_id,
                    'role': user['role'],
                    'full_name': user['full_name']
                }).execute()
                print(f"✅ Created profile")
                
        except Exception as e:
            print(f"❌ Error with {user['email']}: {e}")
    
    print("\n✅ All profiles verified and updated!")

def verify_navigation_access():
    """Show what each user should see"""
    print("\n📋 Expected Navigation for Each User:\n")
    
    expectations = {
        "admin@test.com": "ALL navigation items (admin has full access)",
        "developer@test.com": "Overview, Applicants, Projects",
        "lender@test.com": "Overview, Lenders, Reports, Analytics, Map",
        "buyer@test.com": "Overview, Find Housing, My Applications, Preferences",
        "applicant@test.com": "Overview, Find Housing, My Applications, Preferences"
    }
    
    for email, expected in expectations.items():
        print(f"{email}:")
        print(f"  → {expected}\n")

if __name__ == "__main__":
    print("="*60)
    print("FIXING FRONTEND NAVIGATION VISIBILITY")
    print("="*60)
    
    ensure_all_profiles_complete()
    verify_navigation_access()
    
    print("\n💡 Next Steps:")
    print("1. Clear your browser cache/cookies")
    print("2. Log out and log back in")
    print("3. The navigation should now show correctly")
    print("4. If still having issues, check browser console for errors")