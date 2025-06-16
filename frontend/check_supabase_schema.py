#!/usr/bin/env python3
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase = create_client(url, key)

# Login
supabase.auth.sign_in_with_password({
    'email': 'admin@test.com',
    'password': 'password123'
})

print("Checking actual database schema...\n")

# Try to query with minimal fields
print("Testing minimal applicant insert...")
try:
    test_data = {
        'first_name': 'Test',
        'last_name': 'User', 
        'email': 'test@example.com',
        'company_id': '11111111-1111-1111-1111-111111111111',
        'user_id': supabase.auth.get_user().user.id
    }
    
    result = supabase.table('applicants').insert(test_data).execute()
    print("✅ Minimal insert succeeded!")
    print(f"Created applicant: {result.data[0]}")
    
    # Clean up
    supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
    
except Exception as e:
    print(f"❌ Minimal insert failed: {e}")

# Try to get one applicant to see structure
print("\nFetching existing applicant to see structure...")
try:
    result = supabase.table('applicants').select('*').limit(1).execute()
    if result.data:
        print("Applicant columns found:")
        for key in result.data[0].keys():
            print(f"  - {key}")
    else:
        print("No applicants found in database")
except Exception as e:
    print(f"Error fetching applicants: {e}")