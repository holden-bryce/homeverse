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

print("Checking available tables in Supabase...\n")

# These are the tables we expect
expected_tables = [
    'profiles',
    'companies', 
    'applicants',
    'projects',
    'matches',
    'contact_submissions'
]

for table in expected_tables:
    try:
        result = supabase.table(table).select('*').limit(1).execute()
        if hasattr(result, 'data'):
            if result.data and len(result.data) > 0:
                print(f"✅ {table} - Found with columns:")
                for col in result.data[0].keys():
                    print(f"   - {col}")
            else:
                print(f"✅ {table} - Exists but empty")
        else:
            print(f"❌ {table} - Not found")
    except Exception as e:
        error_msg = str(e)
        if 'PGRST204' in error_msg:
            # Extract column name from error
            if "Could not find the" in error_msg:
                print(f"⚠️  {table} - Exists but schema mismatch: {error_msg}")
            else:
                print(f"❌ {table} - Error: {e}")
        else:
            print(f"❌ {table} - Error: {e}")