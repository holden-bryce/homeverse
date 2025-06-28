#!/usr/bin/env python3
"""Script to fix empty applicant names in the database"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def fix_empty_names():
    """Fix applicants with empty or whitespace-only names"""
    try:
        # Get all applicants
        result = supabase.table('applicants').select('id, full_name, email').execute()
        applicants = result.data
        
        fixed_count = 0
        
        for applicant in applicants:
            full_name = applicant.get('full_name', '')
            
            # Check if name is empty or just whitespace
            if not full_name or not full_name.strip():
                # Generate a name from email if available
                email = applicant.get('email', '')
                if email and '@' in email:
                    # Use the part before @ as the name
                    new_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').title()
                else:
                    new_name = f"Applicant {applicant['id'][:8]}"
                
                # Update the applicant
                supabase.table('applicants').update({
                    'full_name': new_name
                }).eq('id', applicant['id']).execute()
                
                print(f"✅ Fixed applicant {applicant['id']}: '{full_name}' → '{new_name}'")
                fixed_count += 1
        
        if fixed_count > 0:
            print(f"\n✅ Fixed {fixed_count} applicant(s) with empty names")
        else:
            print("\n✅ No applicants with empty names found")
            
    except Exception as e:
        print(f"❌ Error fixing applicant names: {e}")

if __name__ == "__main__":
    print("🔧 Fixing empty applicant names...")
    fix_empty_names()