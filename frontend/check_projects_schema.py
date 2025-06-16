#!/usr/bin/env python3
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(url, key)

# Login
auth = supabase.auth.sign_in_with_password({
    'email': 'developer@test.com',
    'password': 'password123'
})

print(f"✅ Logged in as: {auth.user.email}")
print("\n🔍 Checking projects table schema...")

# Test different field combinations
field_tests = [
    # What our code expects
    ['id', 'name', 'address', 'city', 'state', 'zip_code', 'total_units', 'affordable_units', 'user_id'],
    # What the SQL schema shows
    ['id', 'name', 'location', 'total_units', 'available_units', 'ami_percentage'],
    # Basic test
    ['id', 'name'],
]

for fields in field_tests:
    try:
        result = supabase.table('projects').select(', '.join(fields)).limit(1).execute()
        print(f"✅ Fields {fields} - EXIST")
        if result.data:
            print("   Sample data:")
            for key, value in result.data[0].items():
                print(f"     {key}: {value}")
        break
    except Exception as e:
        print(f"❌ Fields {fields} - ERROR: {e}")

print("\n🧪 Testing project creation with expected schema...")

try:
    test_project = {
        'name': 'Test Housing Project',
        'description': 'A test project',
        'address': '123 Main St',
        'city': 'San Francisco',
        'state': 'CA',
        'zip_code': '94105',
        'total_units': 100,
        'affordable_units': 30,
        'ami_levels': [60, 80, 120],
        'latitude': 37.7749,
        'longitude': -122.4194,
        'company_id': '11111111-1111-1111-1111-111111111111',
        'user_id': auth.user.id,
        'status': 'planning'
    }
    
    result = supabase.table('projects').insert(test_project).execute()
    
    if result.data:
        print("🎉 SUCCESS! Project creation works!")
        print(f"   Created project: {result.data[0]['id']}")
        print("   Actual fields:")
        for key in result.data[0].keys():
            print(f"     - {key}")
        
        # Clean up
        supabase.table('projects').delete().eq('id', result.data[0]['id']).execute()
        print("\n   🧹 Test data cleaned up")
    else:
        print("❌ Insert succeeded but no data returned")
        
except Exception as e:
    print(f"❌ Project creation failed: {e}")
    
    # Try simpler version
    print("\n🔄 Trying simpler schema based on SQL file...")
    try:
        simple_project = {
            'name': 'Test Housing Project',
            'description': 'A test project',
            'location': 'San Francisco, CA',
            'total_units': 100,
            'available_units': 70,
            'ami_percentage': 80,
            'company_id': '11111111-1111-1111-1111-111111111111',
            'status': 'active'
        }
        
        result = supabase.table('projects').insert(simple_project).execute()
        
        if result.data:
            print("✅ Simple schema works!")
            print("   Fields needed:")
            for key in result.data[0].keys():
                print(f"     - {key}")
            
            # Clean up
            supabase.table('projects').delete().eq('id', result.data[0]['id']).execute()
        else:
            print("❌ Simple insert also failed")
            
    except Exception as e2:
        print(f"❌ Simple schema also failed: {e2}")