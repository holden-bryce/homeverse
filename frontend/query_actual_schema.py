#!/usr/bin/env python3
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

print("🔍 Querying actual Supabase schema...\n")

supabase = create_client(url, key)

# Login as admin to get access
auth = supabase.auth.sign_in_with_password({
    'email': 'admin@test.com',
    'password': 'password123'
})

print(f"✅ Logged in as: {auth.user.email}\n")

# Function to test table structure by trying different field combinations
def test_table_structure(table_name, test_fields):
    print(f"🔍 Testing {table_name} table structure:")
    
    # Try to query with specific fields to see what exists
    for field_set in test_fields:
        try:
            result = supabase.table(table_name).select(', '.join(field_set)).limit(1).execute()
            print(f"  ✅ Fields {field_set} - EXIST")
            return field_set
        except Exception as e:
            if 'Could not find' in str(e):
                print(f"  ❌ Fields {field_set} - MISSING")
            else:
                print(f"  ❌ Fields {field_set} - ERROR: {e}")
    
    print(f"  ⚠️  Trying to get any data from {table_name}...")
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()
        if result.data and len(result.data) > 0:
            print(f"  ✅ Actual columns in {table_name}:")
            for col in result.data[0].keys():
                print(f"    - {col}")
        else:
            print(f"  📋 {table_name} exists but is empty")
    except Exception as e:
        print(f"  ❌ Error querying {table_name}: {e}")
    
    print()

# Test applicants table with different field combinations
applicant_field_tests = [
    # What our new code expects
    ['id', 'full_name', 'email', 'preferences', 'company_id', 'status'],
    # What old code expected
    ['id', 'first_name', 'last_name', 'email', 'ami_percent'],
    # Basic fields
    ['id', 'full_name'],
    ['id', 'company_id'],
    # Just try ID
    ['id']
]

test_table_structure('applicants', applicant_field_tests)

# Test projects table
project_field_tests = [
    # What our new code expects
    ['id', 'name', 'location', 'total_units', 'available_units', 'ami_percentage'],
    # What old code expected  
    ['id', 'name', 'city', 'state', 'total_units', 'affordable_units'],
    # Basic fields
    ['id', 'name'],
    ['id']
]

test_table_structure('projects', project_field_tests)

# Test companies table
companies_field_tests = [
    ['id', 'name', 'key', 'plan', 'seats'],
    ['id', 'name'],
    ['id']
]

test_table_structure('companies', companies_field_tests)

# Test profiles table
profiles_field_tests = [
    ['id', 'company_id', 'role', 'full_name'],
    ['id', 'full_name'],
    ['id']
]

test_table_structure('profiles', profiles_field_tests)

print("🧪 Testing actual data insertion...")

# Test if we can insert an applicant with our current schema expectation
try:
    test_applicant = {
        'full_name': 'Test User',
        'email': 'test@example.com',
        'phone': '555-1234',
        'household_size': 1,
        'income': 50000,
        'preferences': {
            'ami_percent': 80,
            'location_preference': 'Downtown',
            'latitude': 40.7128,
            'longitude': -74.0060
        },
        'company_id': '11111111-1111-1111-1111-111111111111',
        'status': 'active'
    }
    
    result = supabase.table('applicants').insert(test_applicant).execute()
    
    if result.data:
        print("✅ SUCCESS! Applicant insertion works with our schema!")
        print(f"   Created applicant: {result.data[0]['id']}")
        print("   Actual inserted data:")
        for key, value in result.data[0].items():
            print(f"     {key}: {value}")
        
        # Clean up test data
        supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
        print("   🧹 Test data cleaned up")
    else:
        print("❌ Insert succeeded but no data returned")
        
except Exception as e:
    print(f"❌ FAILED! Applicant insertion error: {e}")
    print("   This means our code won't work with the current schema")

print("\n📊 SUMMARY:")
print("The schema test will show if our TypeScript types match the actual database.")
print("If insertion fails, we need to update our code to match the real schema.")