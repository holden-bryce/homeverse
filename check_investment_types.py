#!/usr/bin/env python3
"""
Check investment type constraints
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🔍 Checking Investment Type Constraints...\n")

# Try to get the constraint info from database
try:
    # Check existing investments to see valid types
    result = supabase.table('investments').select('investment_type').limit(10).execute()
    if result.data:
        types = set(inv['investment_type'] for inv in result.data if inv.get('investment_type'))
        print(f"Found investment types in use: {types}")
    else:
        print("No existing investments found")
        
    # Common investment types to try
    test_types = [
        "construction_loan",
        "construction",
        "permanent_loan", 
        "permanent",
        "bridge_loan",
        "equity",
        "grant",
        "other"
    ]
    
    print("\nTrying different investment types:")
    for inv_type in test_types:
        # Try a minimal insert with just required fields
        try:
            test_data = {
                "project_id": "bb010512-9062-400b-be9e-c95471b39164",
                "amount": 1000,
                "investment_type": inv_type,
                "lender_id": "d1c01378-e3d8-48f6-9c8e-6da8487d13e6",
                "status": "pending"
            }
            result = supabase.table('investments').insert(test_data).execute()
            print(f"✅ '{inv_type}' - Valid")
            # Delete the test record
            supabase.table('investments').delete().eq('id', result.data[0]['id']).execute()
        except Exception as e:
            if "constraint" in str(e):
                print(f"❌ '{inv_type}' - Invalid")
            else:
                print(f"❓ '{inv_type}' - Error: {str(e)[:50]}")
                
except Exception as e:
    print(f"Error: {e}")