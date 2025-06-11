#!/usr/bin/env python3
"""Emergency RLS fix to disable problematic policies"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    exit(1)

# Initialize Supabase client with service key (bypasses RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def disable_rls_temporarily():
    """Disable RLS on all tables to fix infinite recursion"""
    print("🚨 EMERGENCY: Disabling RLS temporarily to fix infinite recursion...\n")
    
    tables = [
        'profiles', 'companies', 'applicants', 'projects', 
        'activities', 'contact_submissions', 'matches'
    ]
    
    for table in tables:
        try:
            # We can't execute raw SQL through Supabase client easily
            # But we can create a simple policy that allows all access
            print(f"Attempting to fix RLS for {table}...")
            
            # Try to create a simple "allow all" policy
            policy_name = f"allow_all_temp_{table}"
            
            # This is a workaround - we'll create permissive policies instead
            print(f"   Creating permissive policy for {table}")
            
        except Exception as e:
            print(f"❌ Failed to fix {table}: {str(e)}")
    
    print("\n⚠️  RLS is still active but we need to fix this via Supabase dashboard")
    print("\nPlease run this SQL in Supabase Dashboard SQL Editor:")
    print("-" * 50)
    print("-- TEMPORARY: Disable RLS for development")
    for table in tables:
        print(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY;")
    print("-" * 50)

def test_backend_health():
    """Test if backend responds after RLS fix"""
    print("\n🔍 Testing backend health...")
    
    import requests
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend health: {data.get('status', 'unknown')}")
            if data.get('database') == 'connected':
                print("✅ Database connection: OK")
            else:
                print(f"❌ Database connection: {data.get('database', 'unknown')}")
        else:
            print(f"❌ Backend returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not responding: {str(e)}")

def main():
    print("="*60)
    print("EMERGENCY RLS FIX FOR HOMEVERSE")
    print("="*60)
    
    disable_rls_temporarily()
    test_backend_health()
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("1. Copy the SQL commands above")
    print("2. Go to Supabase Dashboard → SQL Editor")
    print("3. Paste and run the SQL commands")
    print("4. Restart the backend: python3 supabase_backend.py")
    print("5. Test health: curl http://localhost:8000/health")
    print("="*60)

if __name__ == "__main__":
    main()