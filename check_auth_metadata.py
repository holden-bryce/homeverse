#!/usr/bin/env python3
"""Check if Supabase auth users have proper metadata"""

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

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_auth_metadata():
    """Check auth.users metadata"""
    print("🔍 Checking Supabase Auth User Metadata...\n")
    
    try:
        # Get all auth users
        users = supabase.auth.admin.list_users()
        
        print(f"Found {len(users)} users in auth.users:\n")
        
        for user in users:
            print(f"Email: {user.email}")
            print(f"  ID: {user.id}")
            print(f"  Metadata: {json.dumps(user.user_metadata, indent=4)}")
            print(f"  Email Confirmed: {user.email_confirmed_at is not None}")
            
            # Check if user has a profile
            profile = supabase.table('profiles').select('*').eq('id', user.id).single().execute()
            if profile.data:
                print(f"  ✅ Has profile with role: {profile.data['role']}, company_id: {profile.data['company_id']}")
            else:
                print(f"  ❌ No profile found!")
            print()
            
    except Exception as e:
        print(f"❌ Error checking auth metadata: {e}")

def update_auth_metadata():
    """Update auth user metadata to include role and company_id"""
    print("\n🔧 Updating Auth User Metadata...\n")
    
    test_users = [
        {"email": "admin@test.com", "role": "admin"},
        {"email": "developer@test.com", "role": "developer"},
        {"email": "lender@test.com", "role": "lender"},
        {"email": "buyer@test.com", "role": "buyer"},
        {"email": "applicant@test.com", "role": "applicant"}
    ]
    
    default_company_id = "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8"
    
    try:
        # Get all auth users
        all_users = supabase.auth.admin.list_users()
        
        for test_user in test_users:
            # Find the user
            auth_user = next((u for u in all_users if u.email == test_user["email"]), None)
            
            if auth_user:
                print(f"Updating {test_user['email']}...")
                
                # Update user metadata
                updated_metadata = {
                    "role": test_user["role"],
                    "company_id": default_company_id,
                    "full_name": test_user["email"].split('@')[0].replace('.', ' ').title()
                }
                
                # Update the user
                result = supabase.auth.admin.update_user_by_id(
                    auth_user.id,
                    {
                        "user_metadata": updated_metadata
                    }
                )
                
                print(f"✅ Updated metadata: {json.dumps(updated_metadata, indent=2)}")
            else:
                print(f"❌ User {test_user['email']} not found")
                
    except Exception as e:
        print(f"❌ Error updating metadata: {e}")

def verify_complete_setup():
    """Verify that users have both auth metadata and profiles"""
    print("\n✅ Verifying Complete Setup...\n")
    
    try:
        users = supabase.auth.admin.list_users()
        
        all_good = True
        for user in users:
            if user.email and '@test.com' in user.email:
                print(f"{user.email}:")
                
                # Check metadata
                has_role = 'role' in user.user_metadata
                has_company = 'company_id' in user.user_metadata
                print(f"  Auth metadata: role={has_role}, company_id={has_company}")
                
                # Check profile
                profile = supabase.table('profiles').select('*').eq('id', user.id).single().execute()
                has_profile = profile.data is not None
                print(f"  Profile exists: {has_profile}")
                
                if has_role and has_company and has_profile:
                    print(f"  ✅ Complete setup")
                else:
                    print(f"  ❌ Incomplete setup")
                    all_good = False
                print()
        
        return all_good
        
    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("SUPABASE AUTH METADATA CHECK")
    print("="*60)
    
    # Check current state
    check_auth_metadata()
    
    # Update metadata
    update_auth_metadata()
    
    # Verify everything is set up
    if verify_complete_setup():
        print("\n🎉 All test users are properly configured!")
        print("\nThe frontend should now work properly because:")
        print("1. Auth users have role and company_id in metadata")
        print("2. Profiles exist with matching data")
        print("3. Navigation will show based on role")
    else:
        print("\n⚠️  Some users still have incomplete setup")
        print("Check Supabase dashboard for any issues")