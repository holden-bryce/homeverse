#!/usr/bin/env python3
"""
Seed test data directly in Supabase database
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
    logger.info("🚀 Starting database seeding...")
    
    # Create Supabase client with service role key
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # First, create or get test company
    logger.info("Creating test company...")
    try:
        # Check if test company exists
        result = supabase.table('companies').select('*').eq('name', 'Test Company').execute()
        
        if result.data:
            company_id = result.data[0]['id']
            logger.info(f"✅ Using existing test company: {company_id}")
        else:
            # Create test company
            company_data = {
                "name": "Test Company",
                "key": "test-company",
                "plan": "enterprise",
                "max_users": 100,
                "settings": {
                    "features": {
                        "ai_matching": True,
                        "document_processing": True,
                        "advanced_analytics": True
                    }
                }
            }
            result = supabase.table('companies').insert(company_data).execute()
            company_id = result.data[0]['id']
            logger.info(f"✅ Created test company: {company_id}")
    except Exception as e:
        logger.error(f"❌ Error with company: {e}")
        return
    
    # Create profiles for test users
    logger.info("Creating user profiles...")
    for user in TEST_USERS:
        try:
            # Check if profile exists
            result = supabase.table('profiles').select('*').eq('id', user['id']).execute()
            
            if result.data:
                # Update existing profile
                update_data = {
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "company_id": company_id,
                    "preferences": {
                        "email_new_applications": True,
                        "email_status_updates": True,
                        "theme": "light",
                        "language": "en",
                        "timezone": "America/Los_Angeles"
                    }
                }
                supabase.table('profiles').update(update_data).eq('id', user['id']).execute()
                logger.info(f"✅ Updated profile for {user['email']}")
            else:
                # Create new profile
                profile_data = {
                    "id": user["id"],
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "company_id": company_id,
                    "preferences": {
                        "email_new_applications": True,
                        "email_status_updates": True,
                        "theme": "light",
                        "language": "en",
                        "timezone": "America/Los_Angeles"
                    }
                }
                supabase.table('profiles').insert(profile_data).execute()
                logger.info(f"✅ Created profile for {user['email']}")
        except Exception as e:
            logger.error(f"❌ Error with profile for {user['email']}: {e}")
    
    # Create sample projects
    logger.info("Creating sample projects...")
    sample_projects = [
        {
            "name": "Sunset Heights Affordable Housing",
            "developer_name": "Test Developer LLC",
            "total_units": 120,
            "affordable_units": 40,
            "ami_percentage": 80,
            "location": {"lat": 37.7749, "lng": -122.4194},  # San Francisco
            "address": "123 Market Street, San Francisco, CA 94103",
            "amenities": ["parking", "gym", "laundry", "community_room"],
            "expected_completion": "2025-12-31",
            "application_deadline": "2025-06-30",
            "company_id": company_id,
            "status": "active",
            "description": "Modern affordable housing complex in downtown SF"
        },
        {
            "name": "Green Living Complex",
            "developer_name": "Eco Developers Inc",
            "total_units": 200,
            "affordable_units": 60,
            "ami_percentage": 60,
            "location": {"lat": 37.7858, "lng": -122.4065},  # SF Financial District
            "address": "456 Montgomery Street, San Francisco, CA 94104",
            "amenities": ["solar_panels", "ev_charging", "bike_storage", "rooftop_garden"],
            "expected_completion": "2026-03-31",
            "application_deadline": "2025-09-30",
            "company_id": company_id,
            "status": "active",
            "description": "Sustainable living with solar power and EV charging"
        },
        {
            "name": "Bay View Senior Housing",
            "developer_name": "Senior Living Partners",
            "total_units": 80,
            "affordable_units": 80,
            "ami_percentage": 50,
            "location": {"lat": 37.7258, "lng": -122.3882},  # Bayview
            "address": "789 Third Street, San Francisco, CA 94124",
            "amenities": ["accessible", "medical_office", "community_kitchen", "garden"],
            "expected_completion": "2025-09-30",
            "application_deadline": "2025-03-31",
            "company_id": company_id,
            "status": "active",
            "description": "Dedicated affordable housing for seniors 55+"
        }
    ]
    
    for project in sample_projects:
        try:
            # Check if project exists
            result = supabase.table('projects').select('*').eq('name', project['name']).eq('company_id', company_id).execute()
            
            if not result.data:
                supabase.table('projects').insert(project).execute()
                logger.info(f"✅ Created project: {project['name']}")
            else:
                logger.info(f"⚠️  Project already exists: {project['name']}")
        except Exception as e:
            logger.error(f"❌ Error creating project {project['name']}: {e}")
    
    # Create sample applicants
    logger.info("Creating sample applicants...")
    sample_applicants = [
        {
            "first_name": "Maria",
            "last_name": "Garcia",
            "email": "maria.garcia@example.com",
            "phone": "+14155551234",
            "household_size": 4,
            "income": 65000,
            "ami_percent": 75,
            "location_preference": "Mission District",
            "latitude": 37.7599,
            "longitude": -122.4148,
            "company_id": company_id,
            "status": "pending",
            "notes": "Family of 4, looking for 3BR unit"
        },
        {
            "first_name": "James",
            "last_name": "Chen",
            "email": "james.chen@example.com",
            "phone": "+14155555678",
            "household_size": 2,
            "income": 48000,
            "ami_percent": 55,
            "location_preference": "SOMA",
            "latitude": 37.7785,
            "longitude": -122.3948,
            "company_id": company_id,
            "status": "approved",
            "notes": "Young professional couple"
        },
        {
            "first_name": "Robert",
            "last_name": "Johnson",
            "email": "robert.johnson@example.com",
            "phone": "+14155559012",
            "household_size": 1,
            "income": 35000,
            "ami_percent": 40,
            "location_preference": "Tenderloin",
            "latitude": 37.7840,
            "longitude": -122.4139,
            "company_id": company_id,
            "status": "pending",
            "notes": "Senior citizen, needs accessible unit"
        }
    ]
    
    for applicant in sample_applicants:
        try:
            # Check if applicant exists
            result = supabase.table('applicants').select('*').eq('email', applicant['email']).eq('company_id', company_id).execute()
            
            if not result.data:
                supabase.table('applicants').insert(applicant).execute()
                logger.info(f"✅ Created applicant: {applicant['first_name']} {applicant['last_name']}")
            else:
                logger.info(f"⚠️  Applicant already exists: {applicant['email']}")
        except Exception as e:
            logger.error(f"❌ Error creating applicant: {e}")
    
    logger.info("✅ Database seeding completed!")
    logger.info("🔄 Please restart the backend server to ensure all changes are recognized")

if __name__ == "__main__":
    asyncio.run(seed_database())