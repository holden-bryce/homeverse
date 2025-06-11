#!/usr/bin/env python3
"""Apply RLS fix to allow frontend profile queries"""

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

def apply_rls_fix():
    """Apply the RLS fix by executing SQL commands"""
    print("🔧 Applying RLS fix for frontend profile access...\n")
    
    # Read the SQL file
    with open('fix_rls_for_frontend.sql', 'r') as f:
        sql_commands = f.read()
    
    # Split into individual commands (by semicolon, but not inside strings)
    commands = []
    current_command = ""
    in_string = False
    string_char = None
    
    for char in sql_commands:
        if char in ["'", '"'] and not in_string:
            in_string = True
            string_char = char
        elif char == string_char and in_string:
            in_string = False
            string_char = None
        
        current_command += char
        
        if char == ';' and not in_string:
            commands.append(current_command.strip())
            current_command = ""
    
    # Execute each command
    success_count = 0
    for i, cmd in enumerate(commands):
        if not cmd or cmd.startswith('--'):
            continue
            
        try:
            # Use raw SQL execution through Supabase
            result = supabase.postgrest.rpc('exec_sql', {'sql': cmd}).execute()
            print(f"✅ Command {i+1} executed successfully")
            success_count += 1
        except Exception as e:
            print(f"❌ Command {i+1} failed: {str(e)}")
            print(f"   Command: {cmd[:100]}...")
    
    print(f"\n📊 Executed {success_count} commands successfully")

def test_profile_access():
    """Test if profiles can be accessed"""
    print("\n🧪 Testing profile access...\n")
    
    try:
        # Get a test user
        test_user_id = "40e47137-78fd-4db6-a195-ba3aadc67eda"  # admin user from the error
        
        # Try to fetch the profile
        result = supabase.table('profiles').select('*, companies(*)').eq('id', test_user_id).single().execute()
        
        if result.data:
            print(f"✅ Profile retrieved successfully!")
            print(f"   User: {result.data.get('email', 'N/A')}")
            print(f"   Role: {result.data.get('role', 'N/A')}")
            print(f"   Company: {result.data.get('companies', {}).get('name', 'N/A')}")
        else:
            print("❌ No profile found")
            
    except Exception as e:
        print(f"❌ Error accessing profile: {str(e)}")

def main():
    print("="*60)
    print("RLS FIX FOR FRONTEND PROFILE ACCESS")
    print("="*60)
    
    # Note: Supabase doesn't allow direct SQL execution via client
    # We need to use the Supabase dashboard or create policies via API
    
    print("\n⚠️  IMPORTANT: Supabase client doesn't support direct SQL execution")
    print("\nTo fix the RLS issues, please:")
    print("1. Go to your Supabase dashboard")
    print("2. Navigate to SQL Editor")
    print("3. Copy and paste the contents of 'fix_rls_for_frontend.sql'")
    print("4. Run the SQL commands")
    print("\nAlternatively, I'll create a simpler fix using the Supabase API...")
    
    # Test current access
    test_profile_access()
    
    print("\n🔍 Checking current auth users...")
    try:
        # List auth users to verify they exist
        users = supabase.auth.admin.list_users()
        print(f"\nFound {len(users)} auth users")
        
        for user in users[:5]:  # Show first 5
            print(f"- {user.email} (ID: {user.id})")
            
            # Check if profile exists
            profile = supabase.table('profiles').select('*').eq('id', user.id).single().execute()
            if profile.data:
                print(f"  ✅ Has profile with role: {profile.data.get('role')}")
            else:
                print(f"  ❌ No profile found")
                
    except Exception as e:
        print(f"❌ Error checking users: {str(e)}")

if __name__ == "__main__":
    main()