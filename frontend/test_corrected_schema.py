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
    'email': 'admin@test.com',
    'password': 'password123'
})

print(f"✅ Logged in as: {auth.user.email}")
print("\n🧪 Testing corrected applicant schema...")

# Test with the corrected schema matching actual database
try:
    test_applicant = {
        'first_name': 'Test',
        'last_name': 'User', 
        'email': 'test@example.com',
        'phone': '555-1234',
        'household_size': 1,
        'income': 50000,
        'ami_percent': 80,
        'location_preference': 'Downtown',
        'latitude': 40.7128,
        'longitude': -74.0060,
        'company_id': '11111111-1111-1111-1111-111111111111',
        'user_id': auth.user.id,
        'status': 'pending'
    }
    
    result = supabase.table('applicants').insert(test_applicant).execute()
    
    if result.data:
        print("🎉 SUCCESS! Corrected schema works!")
        print(f"   Created applicant: {result.data[0]['id']}")
        print("   Fields created:")
        for key, value in result.data[0].items():
            print(f"     {key}: {value}")
        
        # Clean up
        supabase.table('applicants').delete().eq('id', result.data[0]['id']).execute()
        print("\n   🧹 Test data cleaned up")
        print("\n✅ CONCLUSION: The applicant creation should now work in production!")
    else:
        print("❌ Insert succeeded but no data returned")
        
except Exception as e:
    print(f"❌ STILL FAILING: {e}")
    print("   Need to investigate further...")