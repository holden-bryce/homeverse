#!/usr/bin/env python3
"""Update existing projects with better data for map display"""
from supabase import create_client
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize Supabase client
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# Get all projects
result = supabase.table('projects').select('*').execute()
projects = result.data

logger.info(f"Found {len(projects)} projects to update")

# Update each project with better data
updates = {
    'Marina Bay Towers': {
        'location': 'San Francisco, CA',
        'total_units': 200,
        'available_units': 75,
        'ami_percentage': 80,
        'status': 'accepting_applications',
        'price_range': '$1,500 - $3,200',
        'unit_types': ['1BR', '2BR', '3BR']
    },
    'Oakland Commons': {
        'location': 'Oakland, CA', 
        'total_units': 150,
        'available_units': 60,
        'ami_percentage': 60,
        'status': 'construction',
        'price_range': '$1,200 - $2,800',
        'unit_types': ['Studio', '1BR', '2BR']
    },
    'Sunset District Homes': {
        'location': 'San Francisco, CA',
        'total_units': 120,
        'available_units': 45,
        'ami_percentage': 70,
        'status': 'planning',
        'price_range': '$1,400 - $2,900',
        'unit_types': ['1BR', '2BR']
    }
}

for project in projects:
    name = project['name']
    if name in updates:
        try:
            update_data = updates[name]
            result = supabase.table('projects').update(update_data).eq('id', project['id']).execute()
            logger.info(f"✅ Updated {name}")
        except Exception as e:
            logger.error(f"❌ Error updating {name}: {e}")

# Also update test projects to have better locations
try:
    # Update any test projects to have proper locations
    test_updates = supabase.table('projects').update({
        'location': 'Berkeley, CA',
        'status': 'accepting_applications',
        'ami_percentage': 90
    }).like('name', 'Test Project%').execute()
    
    if test_updates.data:
        logger.info(f"✅ Updated {len(test_updates.data)} test projects")
except Exception as e:
    logger.info(f"No test projects to update: {e}")

# Verify the updates
all_projects = supabase.table('projects').select('name, location, status, available_units').execute()
logger.info(f"\n📍 Projects after update:")
for p in all_projects.data:
    logger.info(f"  - {p['name']} in {p['location']} ({p['status']}) - {p.get('available_units', 0)} units available")

print("\n✅ Projects updated successfully!")
print("\n⚠️  Note: The 'coordinates' column needs to be added to the Supabase projects table.")
print("Please run this SQL in the Supabase SQL Editor:")
print("""
-- Add coordinates column
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS coordinates FLOAT[] DEFAULT ARRAY[-122.4194, 37.7749]::FLOAT[];

-- Update with sample coordinates
UPDATE projects 
SET coordinates = CASE 
    WHEN location LIKE '%San Francisco%' THEN ARRAY[-122.4194, 37.7749]::FLOAT[]
    WHEN location LIKE '%Oakland%' THEN ARRAY[-122.2711, 37.8044]::FLOAT[]
    WHEN location LIKE '%Berkeley%' THEN ARRAY[-122.2730, 37.8715]::FLOAT[]
    WHEN location LIKE '%San Jose%' THEN ARRAY[-121.8863, 37.3382]::FLOAT[]
    ELSE ARRAY[-122.4194, 37.7749]::FLOAT[]
END;
""")