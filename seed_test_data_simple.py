#!/usr/bin/env python3
"""
Simple seed test data - just update profiles to link to company
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

# Test users - these IDs come from Supabase Auth
TEST_USERS = [
    {
        "id": "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2",
        "email": "developer@test.com",
        "full_name": "Test Developer",
        "role": "developer"
    },
    {
        "id": "d1c01378-e3d8-48f6-9c8e-6da8487d13e6",
        "email": "lender@test.com",
        "full_name": "Test Lender",
        "role": "lender"
    },
    {
        "id": "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027",
        "email": "buyer@test.com",
        "full_name": "Test Buyer",
        "role": "buyer"
    },
    {
        "id": "55c8c24e-05eb-4a1b-b820-02e8b664cfc6",
        "email": "applicant@test.com",
        "full_name": "Test Applicant",
        "role": "applicant"
    },
    {
        "id": "40e47137-78fd-4db6-a195-ba3aadc67eda",
        "email": "admin@test.com",
        "full_name": "Test Admin",
        "role": "admin"
    }
]

async def seed_database():
    """Seed the database with test data"""
    logger.info("🚀 Starting simple database seeding...")
    
    # Create Supabase client with service role key
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Get test company
    logger.info("Getting test company...")
    try:
        result = supabase.table('companies').select('*').eq('name', 'Test Company').execute()
        
        if result.data:
            company_id = result.data[0]['id']
            logger.info(f"✅ Using existing test company: {company_id}")
        else:
            logger.error("❌ No test company found")
            return
    except Exception as e:
        logger.error(f"❌ Error getting company: {e}")
        return
    
    # Update profiles for test users - just set company_id
    logger.info("Updating user profiles with company_id...")
    for user in TEST_USERS:
        try:
            # Just update the company_id for existing profiles
            update_data = {
                "company_id": company_id
            }
            result = supabase.table('profiles').update(update_data).eq('id', user['id']).execute()
            logger.info(f"✅ Updated company_id for {user['email']}")
        except Exception as e:
            logger.error(f"❌ Error updating profile for {user['email']}: {e}")
    
    logger.info("✅ Simple database seeding completed!")
    logger.info("🔄 Please run the test script again")

if __name__ == "__main__":
    asyncio.run(seed_database())