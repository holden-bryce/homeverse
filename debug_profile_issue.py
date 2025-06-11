#!/usr/bin/env python3
"""Debug script to check profile loading issues"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
anon_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not anon_key:
    print("❌ Missing Supabase environment variables")
    exit(1)

supabase: Client = create_client(url, anon_key)

print("🔍 Checking profiles and companies...")

# Check all profiles
profiles_response = supabase.table('profiles').select('*').execute()
print(f"\n📋 Found {len(profiles_response.data)} profiles:")
for profile in profiles_response.data:
    print(f"  - {profile.get('id')}: {profile.get('full_name')} (company_id: {profile.get('company_id')})")

# Check all companies
companies_response = supabase.table('companies').select('*').execute()
print(f"\n🏢 Found {len(companies_response.data)} companies:")
for company in companies_response.data:
    print(f"  - {company.get('id')}: {company.get('name')} (key: {company.get('key')})")

# Check for profiles without company_id
orphan_profiles = [p for p in profiles_response.data if not p.get('company_id')]
if orphan_profiles:
    print(f"\n⚠️  Found {len(orphan_profiles)} profiles without company_id:")
    for profile in orphan_profiles:
        print(f"  - {profile.get('id')}: {profile.get('full_name')}")
        
        # Try to fix by assigning to default company
        default_company = next((c for c in companies_response.data if c.get('key') == 'demo-company-2024'), None)
        if default_company:
            print(f"    → Fixing: Assigning to company {default_company.get('id')}")
            update_response = supabase.table('profiles').update({
                'company_id': default_company.get('id')
            }).eq('id', profile.get('id')).execute()
            
            if update_response.data:
                print(f"    ✅ Fixed profile {profile.get('id')}")
            else:
                print(f"    ❌ Failed to fix profile {profile.get('id')}")

# Check test users
print("\n👥 Checking test users:")
test_emails = ['developer@test.com', 'lender@test.com', 'buyer@test.com', 'applicant@test.com', 'admin@test.com']

for email in test_emails:
    # Get user from auth
    users_response = supabase.auth.admin.list_users()
    user = next((u for u in users_response if u.email == email), None)
    
    if user:
        # Check if profile exists
        profile_response = supabase.table('profiles').select('*').eq('id', user.id).execute()
        if profile_response.data:
            profile = profile_response.data[0]
            print(f"  ✅ {email}: Profile exists (company_id: {profile.get('company_id')})")
        else:
            print(f"  ❌ {email}: No profile found")
    else:
        print(f"  ❌ {email}: User not found in auth")

print("\n✅ Debug check complete")