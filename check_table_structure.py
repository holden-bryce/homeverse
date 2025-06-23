#!/usr/bin/env python3
"""
Check actual table structure in Supabase
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Checking Table Structures...\n")

# Check applicants table
print("1. Applicants Table:")
try:
    # Get one row to see structure
    result = supabase.table('applicants').select('*').limit(1).execute()
    if result.data:
        print("   Columns found:")
        for key in result.data[0].keys():
            print(f"   - {key}")
    else:
        print("   No data found, inserting test row to check structure...")
        # Try different column names
        test_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "555-0123",
            "income": 50000,
            "household_size": 1,
            "company_id": "11111111-1111-1111-1111-111111111111"
        }
        insert_result = supabase.table('applicants').insert(test_data).execute()
        if insert_result.data:
            print("   ✅ Insert successful with 'name' field")
        else:
            print("   ❌ Insert failed")
except Exception as e:
    print(f"   Error: {e}")

print("\n2. Projects Table:")
try:
    result = supabase.table('projects').select('*').limit(1).execute()
    if result.data:
        print("   Columns found:")
        for key in result.data[0].keys():
            print(f"   - {key}: {type(result.data[0][key]).__name__}")
        
        # Check ami_levels specifically
        if 'ami_levels' in result.data[0]:
            print(f"\n   ami_levels value: {result.data[0]['ami_levels']}")
            print(f"   ami_levels type: {type(result.data[0]['ami_levels'])}")
except Exception as e:
    print(f"   Error: {e}")

print("\n3. Applications Table:")
try:
    result = supabase.table('applications').select('*').limit(1).execute()
    if result.data:
        print("   Columns found:")
        for key in result.data[0].keys():
            print(f"   - {key}")
    else:
        print("   No applications found")
except Exception as e:
    print(f"   Error: {e}")

print("\n4. Investments Table:")
try:
    result = supabase.table('investments').select('*').limit(1).execute()
    if result.data:
        print("   Columns found:")
        for key in result.data[0].keys():
            print(f"   - {key}")
    else:
        print("   No investments found")
except Exception as e:
    print(f"   Error: {e}")