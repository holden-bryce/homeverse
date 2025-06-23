#!/usr/bin/env python3
"""Apply preferences column migration to Supabase"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client with service role key
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def apply_migration():
    """Apply the preferences column migration"""
    print("🔧 Adding preferences column to profiles table...")
    
    try:
        # Read the SQL migration file
        with open('/mnt/c/Users/12486/homeverse/add_preferences_column.sql', 'r') as f:
            sql_commands = f.read()
        
        # Split SQL commands and execute each one
        commands = [cmd.strip() for cmd in sql_commands.split(';') if cmd.strip()]
        
        for i, command in enumerate(commands, 1):
            print(f"Executing command {i}/{len(commands)}...")
            print(f"SQL: {command[:100]}...")
            
            # Execute SQL using Supabase client
            result = supabase.rpc('exec_sql', {'sql': command}).execute()
            
            if hasattr(result, 'error') and result.error:
                print(f"❌ Error executing command {i}: {result.error}")
                return False
            else:
                print(f"✅ Command {i} executed successfully")
        
        print("🎉 Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

if __name__ == "__main__":
    apply_migration()