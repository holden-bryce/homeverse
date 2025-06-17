#!/usr/bin/env python3
"""Add location data to existing projects for heatmap functionality"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('frontend/.env.local')

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Use service role for admin access
)

# Sample Bay Area locations for projects
project_locations = [
    {"name": "Sunset Gardens", "lat": 37.7558, "lng": -122.4449},  # Sunset District, SF
    {"name": "Riverside Commons", "lat": 37.8044, "lng": -122.2711},  # Oakland
    {"name": "Harbor View Apartments", "lat": 37.3382, "lng": -121.8863},  # San Jose
    {"name": "Marina Heights", "lat": 37.8058, "lng": -122.4331},  # Marina District, SF
    {"name": "Bayshore Landing", "lat": 37.6688, "lng": -122.0807},  # Hayward
    {"name": "Peninsula Plaza", "lat": 37.5071, "lng": -122.2605},  # Redwood City
    {"name": "Mission Terrace", "lat": 37.7599, "lng": -122.4148},  # Mission District, SF
    {"name": "Berkeley Commons", "lat": 37.8715, "lng": -122.2730},  # Berkeley
]

# Sample applicant desired locations
applicant_locations = [
    {"lat": 37.7749, "lng": -122.4194},  # Downtown SF
    {"lat": 37.7858, "lng": -122.4064},  # SOMA, SF
    {"lat": 37.8044, "lng": -122.2711},  # Oakland
    {"lat": 37.7751, "lng": -122.4193},  # Financial District, SF
    {"lat": 37.3688, "lng": -122.0363},  # Sunnyvale
    {"lat": 37.4419, "lng": -122.1430},  # Palo Alto
    {"lat": 37.7694, "lng": -122.4862},  # Golden Gate Park area
    {"lat": 37.8016, "lng": -122.4493},  # Pacific Heights, SF
]

def update_project_locations():
    """Update existing projects with location data"""
    try:
        # Get all projects
        projects = supabase.table('projects').select('*').execute()
        
        if not projects.data:
            print("No projects found. Creating sample projects...")
            # Create sample projects with locations
            for i, loc in enumerate(project_locations[:5]):
                project_data = {
                    "name": loc["name"],
                    "location": {"lat": loc["lat"], "lng": loc["lng"]},
                    "address": f"{i+1}00 Main Street, {loc['name'].split()[0]}",
                    "total_units": 100 + (i * 20),
                    "affordable_units": 30 + (i * 5),
                    "ami_percentage": 60 + (i * 5),
                    "status": "active",
                    "description": f"Affordable housing development in {loc['name'].split()[0]} area",
                    "completion_date": "2025-12-31"
                }
                result = supabase.table('projects').insert(project_data).execute()
                print(f"Created project: {project_data['name']}")
        else:
            # Update existing projects with location data
            for i, project in enumerate(projects.data):
                if i < len(project_locations):
                    loc = project_locations[i]
                    update_data = {
                        "location": {"lat": loc["lat"], "lng": loc["lng"]}
                    }
                    result = supabase.table('projects').update(update_data).eq('id', project['id']).execute()
                    print(f"Updated project {project['name']} with location: {loc['lat']}, {loc['lng']}")
        
        print("\nProject locations updated successfully!")
        
    except Exception as e:
        print(f"Error updating project locations: {e}")

def update_applicant_locations():
    """Update existing applicants with desired location data"""
    try:
        # Get all applicants
        applicants = supabase.table('applicants').select('*').execute()
        
        if applicants.data:
            # Update existing applicants with desired locations
            for i, applicant in enumerate(applicants.data):
                if i < len(applicant_locations):
                    loc = applicant_locations[i]
                    update_data = {
                        "desired_location": {"lat": loc["lat"], "lng": loc["lng"]}
                    }
                    result = supabase.table('applicants').update(update_data).eq('id', applicant['id']).execute()
                    print(f"Updated applicant {applicant['first_name']} {applicant['last_name']} with desired location")
        
        print("\nApplicant locations updated successfully!")
        
    except Exception as e:
        print(f"Error updating applicant locations: {e}")

if __name__ == "__main__":
    print("Adding location data to projects and applicants...")
    update_project_locations()
    update_applicant_locations()
    print("\nLocation data added successfully!")