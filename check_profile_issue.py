#!/usr/bin/env python3
"""
Check what's wrong with profile query
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Debugging Profile Query Issue...")

# Test specific query that's failing
user_id = "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2"

print(f"\n1. Direct profile query for {user_id}:")
try:
    profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
    print(f"   Found {len(profile.data)} profiles")
    if profile.data:
        print(f"   Data: {profile.data[0]}")
except Exception as e:
    print(f"   Error: {e}")

print(f"\n2. Profile with companies join (failing query):")
try:
    # This is the exact query from the backend
    profile = supabase.table('profiles').select('*, companies(*)').eq('id', user_id).single().execute()
    print(f"   Success! Data: {profile.data}")
except Exception as e:
    print(f"   Error: {e}")

print(f"\n3. Profile with companies join (without single):")
try:
    profile = supabase.table('profiles').select('*, companies(*)').eq('id', user_id).execute()
    print(f"   Found {len(profile.data)} profiles")
    if profile.data:
        print(f"   Data: {profile.data[0]}")
except Exception as e:
    print(f"   Error: {e}")

print(f"\n4. Check company relationship:")
try:
    # Get profile first
    profile = supabase.table('profiles').select('*').eq('id', user_id).execute()
    if profile.data:
        company_id = profile.data[0]['company_id']
        print(f"   Profile company_id: {company_id}")
        
        # Check if company exists
        company = supabase.table('companies').select('*').eq('id', company_id).execute()
        if company.data:
            print(f"   Company exists: {company.data[0]['name']}")
        else:
            print(f"   ❌ Company {company_id} not found!")
except Exception as e:
    print(f"   Error: {e}")

print(f"\n5. All companies:")
companies = supabase.table('companies').select('id, name, key').execute()
for c in companies.data:
    print(f"   {c['id']} - {c['name']} ({c['key']})")