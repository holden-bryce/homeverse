#!/usr/bin/env python3
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print("❌ Missing Supabase credentials in .env.local")
    exit(1)

print(f"✅ Supabase URL: {url}")
print(f"✅ Supabase Key exists: {len(key) > 0}")

# Create client
supabase: Client = create_client(url, key)

# Test authentication
print("\n🔐 Testing authentication...")
try:
    response = supabase.auth.sign_in_with_password({
        'email': 'admin@test.com',
        'password': 'password123'
    })
    print(f"✅ Logged in as: {response.user.email}")
    user_id = response.user.id
except Exception as e:
    print(f"❌ Auth error: {e}")
    exit(1)

# Test creating an applicant
print("\n📝 Testing applicant creation...")
try:
    # First, try to get or create a company
    print("  → Checking for existing company...")
    company_result = supabase.table('companies').select('id').limit(1).execute()
    
    if company_result.data:
        company_id = company_result.data[0]['id']
        print(f"  ✅ Using existing company: {company_id}")
    else:
        print("  → Creating new company...")
        new_company = supabase.table('companies').insert({
            'name': 'Test Company',
            'key': 'test-company',
            'plan': 'trial',
            'seats': 5
        }).execute()
        company_id = new_company.data[0]['id']
        print(f"  ✅ Created company: {company_id}")
    
    # Try to create applicant
    print("  → Creating applicant...")
    applicant_data = {
        'first_name': 'Test',
        'last_name': 'User',
        'email': 'test@example.com',
        'household_size': 1,
        'income': 50000,
        'ami_percent': 80,
        'latitude': 40.7128,
        'longitude': -74.0060,
        'company_id': company_id,
        'user_id': user_id,
        'status': 'pending'
    }
    
    result = supabase.table('applicants').insert(applicant_data).execute()
    print(f"  ✅ Created applicant: {result.data[0]['id']}")
    
    # Clean up
    print("  → Cleaning up test data...")
    supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
    print("  ✅ Cleaned up")
    
except Exception as e:
    print(f"❌ Database error: {e}")
    
    # Try simpler test
    print("\n🔍 Checking table access...")
    try:
        # Check if we can read from tables
        tables = ['profiles', 'companies', 'applicants']
        for table in tables:
            result = supabase.table(table).select('count').execute()
            print(f"  → {table}: {'✅ Accessible' if result else '❌ Not accessible'}")
    except Exception as e2:
        print(f"  ❌ Table access error: {e2}")

print("\n📊 Summary:")
print("If applicant creation failed, likely causes:")
print("1. RLS policies blocking inserts")
print("2. Missing foreign key relationships")
print("3. Required fields not being set")
print("\nCheck Supabase dashboard for RLS policies on 'applicants' table")