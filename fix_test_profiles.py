#!/usr/bin/env python3
"""
Fix missing profiles for test users
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔧 Fixing Test User Profiles...")

# Test user IDs from the logs
test_users = [
    {
        "id": "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2",  # developer@test.com
        "email": "developer@test.com",
        "role": "developer",
        "full_name": "Test Developer"
    },
    {
        "id": "55c8c24e-05eb-4a1b-b820-02e8b664cfc6",  # applicant@test.com
        "email": "applicant@test.com", 
        "role": "applicant",
        "full_name": "Test Applicant"
    }
]

# Get or create default company
try:
    company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
    company_id = company.data['id']
    print(f"✅ Using existing company: {company_id}")
except:
    # Create default company
    new_company = supabase.table('companies').insert({
        "name": "Default Test Company",
        "key": "default-company",
        "plan": "trial",
        "seats": 100
    }).execute()
    company_id = new_company.data[0]['id']
    print(f"✅ Created new company: {company_id}")

# Create/update profiles
for user in test_users:
    try:
        # Check if profile exists
        profile = supabase.table('profiles').select('*').eq('id', user['id']).single().execute()
        print(f"⚠️  Profile already exists for {user['email']}")
        
        # Update to ensure company_id is set
        supabase.table('profiles').update({
            'company_id': company_id,
            'role': user['role'],
            'full_name': user['full_name']
        }).eq('id', user['id']).execute()
        print(f"✅ Updated profile for {user['email']}")
        
    except:
        # Create new profile
        supabase.table('profiles').insert({
            'id': user['id'],
            'company_id': company_id,
            'role': user['role'],
            'full_name': user['full_name']
        }).execute()
        print(f"✅ Created profile for {user['email']}")

print("\n✅ Profile fix complete! Try the debug test again.")