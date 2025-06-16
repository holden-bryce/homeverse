#!/usr/bin/env python3
import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

print(f"Connecting to Supabase...")
supabase = create_client(url, key)

# Login as admin
auth = supabase.auth.sign_in_with_password({
    'email': 'admin@test.com',
    'password': 'password123'
})

print("\nTrying different approaches to insert applicant...\n")

user_id = auth.user.id

# Approach 1: Try with just ID
print("1. Testing with just ID...")
try:
    result = supabase.table('applicants').insert({
        'user_id': user_id
    }).execute()
    print(f"✅ Success with just user_id!")
    print(f"Result: {result.data}")
    if result.data:
        # Delete test record
        supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
except Exception as e:
    print(f"❌ Failed: {e}")

# Approach 2: Try with company_id too
print("\n2. Testing with user_id and company_id...")
try:
    result = supabase.table('applicants').insert({
        'user_id': user_id,
        'company_id': '11111111-1111-1111-1111-111111111111'
    }).execute()
    print(f"✅ Success with user_id and company_id!")
    print(f"Result: {result.data}")
    if result.data:
        print("\nColumns returned:")
        for key in result.data[0].keys():
            print(f"  - {key}: {result.data[0][key]}")
        # Delete test record
        supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
except Exception as e:
    print(f"❌ Failed: {e}")

# Approach 3: Try to select from empty table with explicit columns
print("\n3. Querying table structure...")
try:
    # This should work even on empty table
    result = supabase.table('applicants').select('id').limit(0).execute()
    print("✅ Table exists and is queryable")
except Exception as e:
    print(f"❌ Query failed: {e}")