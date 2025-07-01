#!/usr/bin/env python3
"""
Check if projects in the database have proper coordinates for heatmap display
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("❌ Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

def check_project_coordinates():
    """Check and display project coordinate information"""
    try:
        # Fetch all projects
        response = supabase.table('projects').select('*').execute()
        projects = response.data or []
        
        print(f"\n📊 Total Projects: {len(projects)}")
        print("=" * 60)
        
        # Analyze coordinates
        projects_with_coords = 0
        projects_without_coords = 0
        invalid_coords = 0
        
        for project in projects:
            lat = project.get('latitude')
            lng = project.get('longitude')
            
            print(f"\n🏢 Project: {project.get('name', 'Unknown')}")
            print(f"   ID: {project.get('id')}")
            print(f"   Latitude: {lat}")
            print(f"   Longitude: {lng}")
            
            if lat is not None and lng is not None:
                # Check if coordinates are valid
                if isinstance(lat, (int, float)) and isinstance(lng, (int, float)):
                    if -90 <= lat <= 90 and -180 <= lng <= 180:
                        projects_with_coords += 1
                        print(f"   ✅ Valid coordinates")
                    else:
                        invalid_coords += 1
                        print(f"   ⚠️  Invalid coordinate range")
                else:
                    invalid_coords += 1
                    print(f"   ⚠️  Invalid coordinate type")
            else:
                projects_without_coords += 1
                print(f"   ❌ Missing coordinates")
                
            # Check other location fields
            if project.get('address'):
                print(f"   Address: {project.get('address')}")
            if project.get('city'):
                print(f"   City: {project.get('city')}")
            if project.get('state'):
                print(f"   State: {project.get('state')}")
        
        # Summary
        print("\n" + "=" * 60)
        print("📈 SUMMARY:")
        print(f"   ✅ Projects with valid coordinates: {projects_with_coords}")
        print(f"   ❌ Projects without coordinates: {projects_without_coords}")
        print(f"   ⚠️  Projects with invalid coordinates: {invalid_coords}")
        print(f"   📍 Percentage with valid coords: {(projects_with_coords / max(len(projects), 1) * 100):.1f}%")
        
        # Test heatmap endpoint
        print("\n" + "=" * 60)
        print("🔥 Testing Heatmap Data...")
        
        # Note: This would require authentication, so we'll just show what to check
        print("\nTo test the heatmap endpoint, check:")
        print("1. Visit: https://homeverse-api.onrender.com/api/v1/analytics/heatmap")
        print("2. Include Authorization header with a valid JWT token")
        print("3. Check if response contains 'projects' and 'demand_zones' arrays")
        
        return projects_with_coords > 0
        
    except Exception as e:
        print(f"\n❌ Error checking projects: {e}")
        return False

def suggest_fixes():
    """Suggest fixes for missing coordinates"""
    print("\n" + "=" * 60)
    print("💡 RECOMMENDATIONS:")
    print("\n1. To fix missing coordinates, update projects with latitude/longitude:")
    print("   - San Francisco: lat=37.7749, lng=-122.4194")
    print("   - Oakland: lat=37.8044, lng=-122.2711")
    print("   - San Jose: lat=37.3382, lng=-121.8863")
    print("   - Berkeley: lat=37.8715, lng=-122.2730")
    print("\n2. Run this SQL to add default SF coordinates to projects without them:")
    print("""
   UPDATE projects 
   SET latitude = 37.7749, longitude = -122.4194 
   WHERE latitude IS NULL OR longitude IS NULL;
   """)
    print("\n3. For production, ensure all new projects have coordinates when created")

if __name__ == "__main__":
    print("🗺️  HomeVerse Project Coordinate Checker")
    print("=" * 60)
    
    has_valid_projects = check_project_coordinates()
    
    if not has_valid_projects:
        suggest_fixes()
    else:
        print("\n✅ At least some projects have valid coordinates for heatmap display")