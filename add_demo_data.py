#!/usr/bin/env python3
"""
Simple demo data script for HomeVerse - works with current Supabase schema
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta
import uuid

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file")
    sys.exit(1)

supabase: Client = create_client(url, key)

# Demo data
DEMO_COMPANY_ID = str(uuid.uuid4())

def create_demo_company():
    """Create demo company"""
    print("🏢 Creating demo company...")
    try:
        # Check if demo company exists
        result = supabase.table('companies').select("*").eq('key', 'demo-homeverse').execute()
        if result.data:
            print("✓ Demo company already exists")
            return result.data[0]['id']
        
        # Create new company
        company = {
            'id': DEMO_COMPANY_ID,
            'name': 'HomeVerse Demo',
            'key': 'demo-homeverse',
            'plan': 'premium',
            'seats': 50
        }
        
        result = supabase.table('companies').insert(company).execute()
        print("✓ Created demo company")
        return DEMO_COMPANY_ID
    except Exception as e:
        print(f"❌ Error creating company: {e}")
        return None

def create_applicants(company_id):
    """Create diverse applicants"""
    print("\n👥 Creating applicants...")
    
    applicants = [
        {
            'company_id': company_id,
            'full_name': 'Sarah Johnson',
            'email': 'sarah.johnson@demo.homeverse.io',
            'phone': '(415) 555-0101',
            'income': 65000,
            'household_size': 3,
            'ami_percent': 80,
            'location_preference': 'Mission District',
            'latitude': 37.7599,
            'longitude': -122.4148,
            'status': 'approved',
            'preferences': {
                'bedrooms_needed': 2,
                'max_rent': 2000,
                'move_in_date': '2024-03-01',
                'has_pets': True,
                'pet_type': 'cat'
            }
        },
        {
            'company_id': company_id,
            'full_name': 'Michael Chen',
            'email': 'michael.chen@demo.homeverse.io',
            'phone': '(415) 555-0102',
            'income': 45000,
            'household_size': 1,
            'ami_percent': 55,
            'location_preference': 'Sunset District',
            'latitude': 37.7577,
            'longitude': -122.5048,
            'status': 'pending',
            'preferences': {
                'bedrooms_needed': 1,
                'max_rent': 1500,
                'move_in_date': '2024-02-15'
            }
        },
        {
            'company_id': company_id,
            'full_name': 'Maria Rodriguez',
            'email': 'maria.rodriguez@demo.homeverse.io',
            'phone': '(415) 555-0103',
            'income': 72000,
            'household_size': 4,
            'ami_percent': 90,
            'location_preference': 'Bayview',
            'latitude': 37.7309,
            'longitude': -122.3795,
            'status': 'approved',
            'preferences': {
                'bedrooms_needed': 3,
                'max_rent': 2500,
                'move_in_date': '2024-04-01',
                'has_pets': True,
                'pet_type': 'dog',
                'needs_parking': True
            }
        },
        {
            'company_id': company_id,
            'full_name': 'James Wilson',
            'email': 'james.wilson@demo.homeverse.io',
            'phone': '(415) 555-0104',
            'income': 38000,
            'household_size': 2,
            'ami_percent': 45,
            'location_preference': 'Excelsior',
            'latitude': 37.7239,
            'longitude': -122.4311,
            'status': 'under_review',
            'preferences': {
                'bedrooms_needed': 1,
                'max_rent': 1200,
                'move_in_date': '2024-03-15'
            }
        },
        {
            'company_id': company_id,
            'full_name': 'Linda Davis',
            'email': 'linda.davis@demo.homeverse.io',
            'phone': '(415) 555-0105',
            'income': 85000,
            'household_size': 2,
            'ami_percent': 100,
            'location_preference': 'SOMA',
            'latitude': 37.7785,
            'longitude': -122.3892,
            'status': 'approved',
            'preferences': {
                'bedrooms_needed': 2,
                'max_rent': 3000,
                'move_in_date': '2024-02-01',
                'wants_amenities': ['gym', 'rooftop', 'concierge']
            }
        },
        {
            'company_id': company_id,
            'full_name': 'Robert Martinez',
            'email': 'robert.martinez@demo.homeverse.io',
            'phone': '(415) 555-0106',
            'income': 55000,
            'household_size': 1,
            'ami_percent': 65,
            'location_preference': 'Richmond District',
            'latitude': 37.7795,
            'longitude': -122.4835,
            'status': 'waitlist',
            'preferences': {
                'bedrooms_needed': 1,
                'max_rent': 1800,
                'move_in_date': '2024-05-01'
            }
        },
        {
            'company_id': company_id,
            'full_name': 'Jennifer Lee',
            'email': 'jennifer.lee@demo.homeverse.io',
            'phone': '(415) 555-0107',
            'income': 92000,
            'household_size': 3,
            'ami_percent': 110,
            'location_preference': 'Pacific Heights',
            'latitude': 37.7925,
            'longitude': -122.4382,
            'status': 'approved',
            'preferences': {
                'bedrooms_needed': 2,
                'max_rent': 3500,
                'move_in_date': '2024-03-01',
                'school_district_priority': True
            }
        },
        {
            'company_id': company_id,
            'full_name': 'David Thompson',
            'email': 'david.thompson@demo.homeverse.io',
            'phone': '(415) 555-0108',
            'income': 42000,
            'household_size': 1,
            'ami_percent': 50,
            'location_preference': 'Tenderloin',
            'latitude': 37.7830,
            'longitude': -122.4167,
            'status': 'pending',
            'preferences': {
                'bedrooms_needed': 0,  # Studio
                'max_rent': 1400,
                'move_in_date': '2024-02-15'
            }
        }
    ]
    
    created = 0
    for applicant in applicants:
        try:
            result = supabase.table('applicants').insert(applicant).execute()
            created += 1
            print(f"✓ Created applicant: {applicant['full_name']}")
        except Exception as e:
            print(f"❌ Error creating applicant {applicant['full_name']}: {e}")
    
    print(f"\n✓ Created {created} applicants")

def create_projects(company_id):
    """Create diverse housing projects"""
    print("\n🏗️ Creating housing projects...")
    
    projects = [
        {
            'company_id': company_id,
            'name': 'Sunset Heights Affordable Community',
            'description': 'A new 150-unit affordable housing development in the heart of Sunset District, featuring modern amenities and easy transit access.',
            'address': '1900 19th Avenue',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94122',
            'total_units': 150,
            'affordable_units': 120,
            'ami_levels': ['50%', '60%', '80%'],
            'status': 'active',
            'latitude': 37.7577,
            'longitude': -122.4788,
            'price_range': '$1,200 - $2,400',
            'bedrooms': 2,
            'bathrooms': 1.5,
            'square_feet': 850,
            'unit_types': ['Studio', '1BR', '2BR'],
            'monthly_rent': 1800,
            'amenities': ['Gym', 'Community Room', 'Bike Storage', 'Playground'],
            'pet_policy': 'Cats allowed, dogs under 25lbs',
            'parking': '1 space per unit available',
            'laundry': 'In-unit washer/dryer',
            'application_fee': 50,
            'security_deposit': 1800,
            'move_in_cost': 3650,
            'transit_notes': 'N-Judah line 2 blocks away, multiple bus lines nearby',
            'school_district': 'San Francisco Unified School District',
            'walk_score': 85,
            'transit_score': 78,
            'contact_email': 'leasing@sunsetheights.com',
            'contact_phone': '(415) 555-1001',
            'website': 'https://sunsetheights.com'
        },
        {
            'company_id': company_id,
            'name': 'Mission Bay Senior Living',
            'description': 'Senior housing community (55+) with 100 units, offering independent living with optional support services.',
            'address': '500 Channel Street',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94158',
            'total_units': 100,
            'affordable_units': 80,
            'ami_levels': ['30%', '50%', '60%'],
            'status': 'active',
            'latitude': 37.7664,
            'longitude': -122.3903,
            'price_range': '$900 - $1,800',
            'bedrooms': 1,
            'bathrooms': 1,
            'square_feet': 650,
            'unit_types': ['Studio', '1BR'],
            'monthly_rent': 1200,
            'amenities': ['Community Kitchen', 'Library', 'Medical Office', 'Emergency Call System'],
            'pet_policy': 'Small pets welcome',
            'parking': 'Limited parking available',
            'laundry': 'Laundry room on each floor',
            'application_fee': 35,
            'security_deposit': 1200,
            'move_in_cost': 2435,
            'transit_notes': 'T-Third line nearby, shuttle service to medical appointments',
            'school_district': 'N/A',
            'walk_score': 90,
            'transit_score': 85,
            'contact_email': 'info@missionbaysenior.com',
            'contact_phone': '(415) 555-1002'
        },
        {
            'company_id': company_id,
            'name': 'Bayview Mixed-Income Development',
            'description': 'Large-scale mixed-income community with 250 units, offering a range of affordability levels and unit sizes.',
            'address': '3801 Third Street',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94124',
            'total_units': 250,
            'affordable_units': 150,
            'ami_levels': ['30%', '50%', '80%', '120%'],
            'status': 'construction',
            'latitude': 37.7409,
            'longitude': -122.3895,
            'price_range': '$800 - $3,200',
            'bedrooms': 2,
            'bathrooms': 2,
            'square_feet': 1100,
            'unit_types': ['Studio', '1BR', '2BR', '3BR'],
            'monthly_rent': 2000,
            'estimated_delivery': '2024-09-01',
            'amenities': ['Pool', 'Fitness Center', 'Business Center', 'Rooftop Garden'],
            'pet_policy': 'Pet-friendly with deposit',
            'parking': 'Garage parking included',
            'laundry': 'In-unit washer/dryer',
            'application_fee': 75,
            'security_deposit': 2000,
            'transit_notes': 'T-Third line adjacent, Caltrain shuttle',
            'school_district': 'San Francisco Unified School District',
            'walk_score': 72,
            'transit_score': 75,
            'contact_email': 'leasing@bayviewmixed.com',
            'contact_phone': '(415) 555-1003',
            'website': 'https://bayviewmixed.com'
        },
        {
            'company_id': company_id,
            'name': 'Teachers Village at Balboa Park',
            'description': 'Educator housing program offering below-market-rate homes exclusively for SFUSD teachers and staff.',
            'address': '100 Havelock Street',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94112',
            'total_units': 80,
            'affordable_units': 80,
            'ami_levels': ['80%', '100%', '120%'],
            'status': 'active',
            'latitude': 37.7205,
            'longitude': -122.4520,
            'price_range': '$1,500 - $2,800',
            'bedrooms': 2,
            'bathrooms': 1,
            'square_feet': 900,
            'unit_types': ['1BR', '2BR', '3BR'],
            'monthly_rent': 2100,
            'amenities': ['Teacher Resource Center', 'Study Rooms', 'Childcare Facility'],
            'pet_policy': 'Pets allowed with approval',
            'parking': '1 assigned space',
            'laundry': 'Laundry in building',
            'application_fee': 50,
            'security_deposit': 2100,
            'transit_notes': 'BART station 10 min walk, multiple bus lines',
            'school_district': 'San Francisco Unified School District',
            'walk_score': 78,
            'transit_score': 82,
            'contact_email': 'apply@teachersvillage.org',
            'contact_phone': '(415) 555-1004'
        },
        {
            'company_id': company_id,
            'name': 'SOMA Artists Lofts',
            'description': 'Live/work spaces for artists and creative professionals, with gallery space and studios.',
            'address': '855 Folsom Street',
            'city': 'San Francisco',
            'state': 'CA',
            'zip_code': '94103',
            'total_units': 60,
            'affordable_units': 48,
            'ami_levels': ['60%', '80%', '100%'],
            'status': 'active',
            'latitude': 37.7785,
            'longitude': -122.4056,
            'price_range': '$1,400 - $3,000',
            'bedrooms': 1,
            'bathrooms': 1,
            'square_feet': 750,
            'unit_types': ['Studio', 'Loft', '1BR+Work'],
            'monthly_rent': 2200,
            'amenities': ['Gallery Space', 'Art Studio', 'Darkroom', 'Kiln Room'],
            'pet_policy': 'Pets welcome',
            'parking': 'Street parking only',
            'laundry': 'Common laundry room',
            'application_fee': 60,
            'security_deposit': 2200,
            'transit_notes': 'Multiple MUNI lines, Civic Center BART 15 min walk',
            'walk_score': 95,
            'transit_score': 88,
            'contact_email': 'info@somaartists.com',
            'contact_phone': '(415) 555-1005',
            'website': 'https://somaartistslofts.com'
        }
    ]
    
    created = 0
    for project in projects:
        try:
            # Set a user_id (we'll use a fixed UUID for demo)
            project['user_id'] = str(uuid.uuid4())
            result = supabase.table('projects').insert(project).execute()
            created += 1
            print(f"✓ Created project: {project['name']}")
        except Exception as e:
            print(f"❌ Error creating project {project['name']}: {e}")
    
    print(f"\n✓ Created {created} projects")

def main():
    print("🏠 HomeVerse Demo Data Population")
    print("=" * 50)
    
    # Create demo company
    company_id = create_demo_company()
    if not company_id:
        print("❌ Failed to create demo company. Exiting.")
        return
    
    # Create applicants
    create_applicants(company_id)
    
    # Create projects
    create_projects(company_id)
    
    print("\n✅ Demo data population complete!")
    print("\nYou can now log in and see the populated data in all dashboards.")
    print("The app should look great for your meeting! 🎉")

if __name__ == "__main__":
    main()