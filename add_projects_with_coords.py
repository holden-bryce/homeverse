#!/usr/bin/env python3
"""Add test projects with coordinates to Supabase"""
from supabase import create_client
import os
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize Supabase client
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# First check if we have the demo company
result = supabase.table('companies').select('id').eq('key', 'demo-company-2024').execute()
if not result.data:
    logger.error("Demo company not found. Please create it first.")
    exit(1)

company_id = result.data[0]['id']
logger.info(f"Using company ID: {company_id}")

# Sample projects with Bay Area coordinates
projects = [
    {
        'company_id': company_id,
        'name': 'Sunset Gardens',
        'description': 'Modern affordable housing in the Sunset District',
        'location': 'San Francisco, CA',
        'coordinates': [-122.4946, 37.7599],  # Note: [lng, lat] format
        'total_units': 120,
        'available_units': 45,
        'ami_percentage': 80,
        'status': 'accepting_applications',
        'price_range': '$1,200 - $2,800',
        'unit_types': ['Studio', '1BR', '2BR'],
        'developer_name': 'Urban Housing LLC'
    },
    {
        'company_id': company_id,
        'name': 'Mission Bay Heights',
        'description': 'Waterfront community with transit access',
        'location': 'San Francisco, CA',
        'coordinates': [-122.3893, 37.7706],
        'total_units': 200,
        'available_units': 75,
        'ami_percentage': 60,
        'status': 'construction',
        'price_range': '$1,500 - $3,200',
        'unit_types': ['1BR', '2BR', '3BR'],
        'developer_name': 'Bay Area Developers'
    },
    {
        'company_id': company_id,
        'name': 'Lake Merritt Commons',
        'description': 'Urban living with lake views',
        'location': 'Oakland, CA',
        'coordinates': [-122.2585, 37.8044],
        'total_units': 150,
        'available_units': 60,
        'ami_percentage': 70,
        'status': 'accepting_applications',
        'price_range': '$1,400 - $2,900',
        'unit_types': ['Studio', '1BR', '2BR'],
        'developer_name': 'Oakland Housing Partners'
    },
    {
        'company_id': company_id,
        'name': 'University Commons',
        'description': 'Student and workforce housing near UC Berkeley',
        'location': 'Berkeley, CA',
        'coordinates': [-122.2730, 37.8715],
        'total_units': 100,
        'available_units': 40,
        'ami_percentage': 80,
        'status': 'planning',
        'price_range': '$1,300 - $2,400',
        'unit_types': ['Studio', '1BR'],
        'developer_name': 'East Bay Housing Corp'
    },
    {
        'company_id': company_id,
        'name': 'Silicon Valley Homes',
        'description': 'Tech worker affordable housing',
        'location': 'San Jose, CA',
        'coordinates': [-121.8863, 37.3382],
        'total_units': 250,
        'available_units': 100,
        'ami_percentage': 120,
        'status': 'accepting_applications',
        'price_range': '$1,800 - $3,500',
        'unit_types': ['1BR', '2BR', '3BR'],
        'developer_name': 'Silicon Valley Development'
    }
]

# Check if coordinates column exists by trying to query it
try:
    test_result = supabase.table('projects').select('id, coordinates').limit(1).execute()
    has_coordinates = True
    logger.info("✅ Coordinates column exists")
except Exception as e:
    has_coordinates = False
    logger.warning(f"⚠️  Coordinates column might not exist: {e}")
    logger.info("Projects will be created without coordinates for now")

# Add each project
for project in projects:
    try:
        # Check if project already exists
        existing = supabase.table('projects').select('id').eq('name', project['name']).execute()
        
        if existing.data:
            # Update existing project
            project_id = existing.data[0]['id']
            if not has_coordinates:
                # Remove coordinates if column doesn't exist
                project.pop('coordinates', None)
            
            result = supabase.table('projects').update(project).eq('id', project_id).execute()
            logger.info(f"✅ Updated project: {project['name']}")
        else:
            # Create new project
            if not has_coordinates:
                # Remove coordinates if column doesn't exist
                project.pop('coordinates', None)
                
            result = supabase.table('projects').insert(project).execute()
            logger.info(f"✅ Created project: {project['name']}")
            
    except Exception as e:
        logger.error(f"❌ Error with project {project['name']}: {e}")

# Verify projects
try:
    if has_coordinates:
        all_projects = supabase.table('projects').select('name, location, coordinates, status').execute()
    else:
        all_projects = supabase.table('projects').select('name, location, status').execute()
        
    logger.info(f"\n📍 Total projects in database: {len(all_projects.data)}")
    for p in all_projects.data:
        coords = p.get('coordinates', 'No coordinates') if has_coordinates else 'Coordinates not available'
        logger.info(f"  - {p['name']} ({p['location']}): {coords}")
        
except Exception as e:
    logger.error(f"Error fetching projects: {e}")

print("\n✅ Done! Projects are ready for the map view.")
print("\nIf coordinates column doesn't exist, please run this SQL in Supabase SQL Editor:")
print("""
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS coordinates FLOAT[] DEFAULT ARRAY[-122.4194, 37.7749]::FLOAT[];
""")