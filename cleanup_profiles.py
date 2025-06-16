#!/usr/bin/env python3
"""
Clean up duplicate profiles in Supabase
"""

import os
import sys
import asyncio
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    logger.error("Missing Supabase configuration in .env file")
    sys.exit(1)

# Test users
TEST_USER_IDS = [
    "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2",  # developer
    "d1c01378-e3d8-48f6-9c8e-6da8487d13e6",  # lender
    "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027",  # buyer
    "55c8c24e-05eb-4a1b-b820-02e8b664cfc6",  # applicant
    "40e47137-78fd-4db6-a195-ba3aadc67eda"   # admin
]

async def cleanup_profiles():
    """Clean up duplicate profiles"""
    logger.info("🧹 Starting profile cleanup...")
    
    # Create Supabase client with service role key
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    for user_id in TEST_USER_IDS:
        try:
            # Check for duplicates
            result = supabase.table('profiles').select('*').eq('id', user_id).execute()
            
            if result.data and len(result.data) > 1:
                logger.warning(f"⚠️  Found {len(result.data)} profiles for user {user_id}")
                
                # Keep the one with company_id if exists
                profile_with_company = None
                for profile in result.data:
                    if profile.get('company_id'):
                        profile_with_company = profile
                        break
                
                # Delete all profiles for this user first
                supabase.table('profiles').delete().eq('id', user_id).execute()
                logger.info(f"🗑️  Deleted all profiles for user {user_id}")
                
                # Re-create the profile with company if we had one
                if profile_with_company:
                    # Remove timestamps before reinserting
                    profile_with_company.pop('created_at', None)
                    profile_with_company.pop('updated_at', None)
                    supabase.table('profiles').insert(profile_with_company).execute()
                    logger.info(f"✅ Re-created profile for user {user_id} with company")
            elif result.data and len(result.data) == 1:
                logger.info(f"✅ Single profile found for user {user_id}")
            else:
                logger.warning(f"⚠️  No profile found for user {user_id}")
                
        except Exception as e:
            logger.error(f"❌ Error processing user {user_id}: {e}")
    
    logger.info("✅ Profile cleanup completed!")

if __name__ == "__main__":
    asyncio.run(cleanup_profiles())