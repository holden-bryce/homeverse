#!/usr/bin/env python3
"""Debug and fix map coordinate issues"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("🔍 Debugging Map Coordinates Issue")
print("=" * 50)

# 1. Check what projects exist
print("\n📍 Checking existing projects...")
try:
    projects = supabase.table('projects').select('*').execute()
    
    if projects.data:
        print(f"✅ Found {len(projects.data)} projects")
        for project in projects.data[:5]:  # Show first 5
            coords = project.get('coordinates', [])
            print(f"\n  Project: {project['name']}")
            print(f"  Location: {project.get('location', 'N/A')}")
            print(f"  Coordinates: {coords}")
            if coords and len(coords) >= 2:
                print(f"  → Longitude: {coords[0]}, Latitude: {coords[1]}")
            print(f"  Status: {project.get('status', 'N/A')}")
            print(f"  Units: {project.get('available_units', 0)}/{project.get('total_units', 0)}")
    else:
        print("❌ No projects found in database")
except Exception as e:
    print(f"❌ Error fetching projects: {e}")

# 2. Test coordinate transformation
print("\n\n🔄 Testing coordinate transformation...")
test_coords = [
    ([-122.4194, 37.7749], "San Francisco (lng, lat)"),
    ([37.7749, -122.4194], "San Francisco (lat, lng)"),
]

for coords, label in test_coords:
    print(f"\n  {label}: {coords}")
    # The map expects [lat, lng] but DB stores [lng, lat]
    if coords and len(coords) >= 2:
        swapped = [coords[1], coords[0]]
        print(f"  → Swapped: {swapped}")

# 3. Add test projects with correct coordinates if needed
print("\n\n➕ Adding/updating test projects with correct coordinates...")

test_projects = [
    {
        "name": "Golden Gate Heights",
        "description": "Affordable housing with ocean views",
        "location": "San Francisco, CA",
        "coordinates": [-122.4946, 37.7599],  # [lng, lat] format
        "total_units": 120,
        "available_units": 45,
        "ami_percentage": 80,
        "status": "accepting_applications",
        "developer_name": "SF Housing Partners",
        "price_range": "$1,200 - $2,800",
        "unit_types": ["Studio", "1BR", "2BR"],
        "estimated_delivery": "2025-06-01"
    },
    {
        "name": "Bay Bridge Vista",
        "description": "Waterfront community with city views",
        "location": "Oakland, CA", 
        "coordinates": [-122.2585, 37.8044],  # [lng, lat] format
        "total_units": 200,
        "available_units": 75,
        "ami_percentage": 60,
        "status": "construction",
        "developer_name": "East Bay Developers",
        "price_range": "$1,500 - $3,200",
        "unit_types": ["1BR", "2BR", "3BR"],
        "estimated_delivery": "2025-09-15"
    },
    {
        "name": "Tech Park Residences",
        "description": "Modern workforce housing",
        "location": "San Jose, CA",
        "coordinates": [-121.8863, 37.3382],  # [lng, lat] format
        "total_units": 250,
        "available_units": 100,
        "ami_percentage": 120,
        "status": "accepting_applications",
        "developer_name": "Silicon Valley Housing",
        "price_range": "$1,800 - $3,500",
        "unit_types": ["Studio", "1BR", "2BR"],
        "estimated_delivery": "2025-03-01"
    }
]

# Get company ID
try:
    company = supabase.table('companies').select('id').eq('key', 'demo-company-2024').single().execute()
    if company.data:
        company_id = company.data['id']
        print(f"✅ Using company ID: {company_id}")
        
        for project_data in test_projects:
            project_data['company_id'] = company_id
            
            # Check if project exists
            existing = supabase.table('projects').select('id').eq('name', project_data['name']).execute()
            
            if existing.data:
                # Update existing project
                project_id = existing.data[0]['id']
                result = supabase.table('projects').update({
                    'coordinates': project_data['coordinates'],
                    'location': project_data['location'],
                    'available_units': project_data['available_units'],
                    'status': project_data['status']
                }).eq('id', project_id).execute()
                print(f"  ✅ Updated: {project_data['name']}")
            else:
                # Create new project
                result = supabase.table('projects').insert(project_data).execute()
                print(f"  ✅ Created: {project_data['name']}")
                
except Exception as e:
    print(f"❌ Error adding/updating projects: {e}")

# 4. Verify final state
print("\n\n✅ Final verification...")
try:
    final_projects = supabase.table('projects').select('name, location, coordinates, status').execute()
    
    if final_projects.data:
        print(f"\n📍 Total projects in database: {len(final_projects.data)}")
        for project in final_projects.data[:10]:
            coords = project.get('coordinates', [])
            if coords and len(coords) >= 2:
                print(f"  • {project['name']}: [{coords[0]:.4f}, {coords[1]:.4f}] - {project['status']}")
            else:
                print(f"  • {project['name']}: No coordinates - {project['status']}")
except Exception as e:
    print(f"❌ Error in final verification: {e}")

print("\n\n💡 Recommendations:")
print("1. The database stores coordinates as [longitude, latitude] (correct for PostgreSQL)")
print("2. The frontend map component expects [latitude, longitude] for markers")
print("3. The transformation in the frontend should swap the coordinates")
print("4. Check that NEXT_PUBLIC_MAPBOX_TOKEN is set in production environment")