#!/usr/bin/env python3
"""
Fix company mismatch for test users
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔧 Fixing Company Mismatch...")

# Get the Test Company (11111111-1111-1111-1111-111111111111)
test_company_id = "11111111-1111-1111-1111-111111111111"

# Update all test users to use the Test Company
test_users = [
    "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2",  # developer@test.com
    "55c8c24e-05eb-4a1b-b820-02e8b664cfc6",  # applicant@test.com
    "d1c01378-e3d8-48f6-9c8e-6da8487d13e6",  # lender@test.com
    "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027",  # buyer@test.com
    "40e47137-78fd-4db6-a195-ba3aadc67eda"   # admin@test.com
]

for user_id in test_users:
    try:
        # Update profile to use test company
        result = supabase.table('profiles').update({
            'company_id': test_company_id
        }).eq('id', user_id).execute()
        
        if result.data:
            print(f"✅ Updated user {user_id} to Test Company")
        else:
            print(f"⚠️  No update for user {user_id}")
            
    except Exception as e:
        print(f"❌ Error updating user {user_id}: {e}")

print("\n✅ Company fix complete! Test users now belong to Test Company.")
print("   Company ID: 11111111-1111-1111-1111-111111111111")