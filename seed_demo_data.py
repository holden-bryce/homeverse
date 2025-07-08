#!/usr/bin/env python3
"""
Comprehensive demo data seeder for HomeVerse presentations
Creates realistic mock data for all entity types
"""

import os
import sys
import asyncio
import logging
import random
from datetime import datetime, timedelta
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

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Comprehensive mock data
DEMO_APPLICANTS = [
    # Diverse families
    {
        "first_name": "Maria",
        "last_name": "Rodriguez",
        "email": "maria.rodriguez@demo.homeverse.io",
        "phone": "+14155551001",
        "household_size": 4,
        "income": 72000,
        "ami_percent": 80,
        "location_preference": "Mission District, San Francisco",
        "latitude": 37.7599,
        "longitude": -122.4148,
        "status": "approved",
        "notes": "Family of 4 with 2 children, looking for 3BR unit. Currently renting, excellent credit.",
        "employment_status": "Full-time",
        "employer": "San Francisco General Hospital",
        "years_at_job": 5,
        "credit_score": 720,
        "preferred_move_date": "2025-03-01"
    },
    {
        "first_name": "James",
        "last_name": "Chen",
        "email": "james.chen@demo.homeverse.io",
        "phone": "+14155551002",
        "household_size": 2,
        "income": 95000,
        "ami_percent": 100,
        "location_preference": "SOMA, San Francisco",
        "latitude": 37.7785,
        "longitude": -122.3948,
        "status": "pending",
        "notes": "Young professional couple, both tech workers. First-time homebuyers.",
        "employment_status": "Full-time",
        "employer": "Salesforce",
        "years_at_job": 3,
        "credit_score": 780,
        "preferred_move_date": "2025-06-01"
    },
    {
        "first_name": "Aisha",
        "last_name": "Williams",
        "email": "aisha.williams@demo.homeverse.io",
        "phone": "+14155551003",
        "household_size": 3,
        "income": 58000,
        "ami_percent": 65,
        "location_preference": "Bayview-Hunters Point",
        "latitude": 37.7258,
        "longitude": -122.3882,
        "status": "approved",
        "notes": "Single mother with 2 children, works as a teacher. Strong community ties.",
        "employment_status": "Full-time",
        "employer": "SFUSD",
        "years_at_job": 8,
        "credit_score": 680,
        "preferred_move_date": "2025-02-15"
    },
    {
        "first_name": "Robert",
        "last_name": "Johnson",
        "email": "robert.johnson@demo.homeverse.io",
        "phone": "+14155551004",
        "household_size": 1,
        "income": 42000,
        "ami_percent": 50,
        "location_preference": "Tenderloin",
        "latitude": 37.7840,
        "longitude": -122.4139,
        "status": "approved",
        "notes": "Senior citizen, veteran, needs accessible unit. Fixed income.",
        "employment_status": "Retired",
        "employer": "N/A - Social Security & VA Benefits",
        "years_at_job": 0,
        "credit_score": 650,
        "preferred_move_date": "2025-01-15"
    },
    {
        "first_name": "Priya",
        "last_name": "Patel",
        "email": "priya.patel@demo.homeverse.io",
        "phone": "+14155551005",
        "household_size": 2,
        "income": 68000,
        "ami_percent": 75,
        "location_preference": "Richmond District",
        "latitude": 37.7775,
        "longitude": -122.4833,
        "status": "pending",
        "notes": "Healthcare worker with elderly parent. Looking for ground floor unit.",
        "employment_status": "Full-time",
        "employer": "Kaiser Permanente",
        "years_at_job": 6,
        "credit_score": 710,
        "preferred_move_date": "2025-04-01"
    },
    {
        "first_name": "Carlos",
        "last_name": "Mendez",
        "email": "carlos.mendez@demo.homeverse.io",
        "phone": "+14155551006",
        "household_size": 5,
        "income": 85000,
        "ami_percent": 90,
        "location_preference": "Excelsior District",
        "latitude": 37.7246,
        "longitude": -122.4260,
        "status": "approved",
        "notes": "Large family, works in construction. Looking for 4BR unit.",
        "employment_status": "Full-time",
        "employer": "Bay Area Construction Co.",
        "years_at_job": 10,
        "credit_score": 690,
        "preferred_move_date": "2025-05-01"
    },
    {
        "first_name": "Sarah",
        "last_name": "Thompson",
        "email": "sarah.thompson@demo.homeverse.io",
        "phone": "+14155551007",
        "household_size": 1,
        "income": 52000,
        "ami_percent": 60,
        "location_preference": "Hayes Valley",
        "latitude": 37.7758,
        "longitude": -122.4128,
        "status": "pending",
        "notes": "Young professional, works at nonprofit. Active in community service.",
        "employment_status": "Full-time",
        "employer": "Bay Area Legal Aid",
        "years_at_job": 2,
        "credit_score": 700,
        "preferred_move_date": "2025-03-15"
    },
    {
        "first_name": "David",
        "last_name": "Kim",
        "email": "david.kim@demo.homeverse.io",
        "phone": "+14155551008",
        "household_size": 3,
        "income": 76000,
        "ami_percent": 85,
        "location_preference": "Sunset District",
        "latitude": 37.7604,
        "longitude": -122.5088,
        "status": "approved",
        "notes": "Small business owner with family. Stable income from restaurant.",
        "employment_status": "Self-employed",
        "employer": "Kim's Kitchen (Owner)",
        "years_at_job": 7,
        "credit_score": 720,
        "preferred_move_date": "2025-02-01"
    },
    {
        "first_name": "Linda",
        "last_name": "Martinez",
        "email": "linda.martinez@demo.homeverse.io",
        "phone": "+14155551009",
        "household_size": 2,
        "income": 48000,
        "ami_percent": 55,
        "location_preference": "Visitacion Valley",
        "latitude": 37.7163,
        "longitude": -122.4040,
        "status": "pending",
        "notes": "Works in retail, caring for disabled adult child. Needs accessible features.",
        "employment_status": "Full-time",
        "employer": "Target",
        "years_at_job": 4,
        "credit_score": 660,
        "preferred_move_date": "2025-04-15"
    },
    {
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "email": "ahmed.hassan@demo.homeverse.io",
        "phone": "+14155551010",
        "household_size": 4,
        "income": 92000,
        "ami_percent": 95,
        "location_preference": "Outer Richmond",
        "latitude": 37.7810,
        "longitude": -122.4900,
        "status": "approved",
        "notes": "Engineer with growing family. Looking for good schools nearby.",
        "employment_status": "Full-time",
        "employer": "PG&E",
        "years_at_job": 9,
        "credit_score": 750,
        "preferred_move_date": "2025-07-01"
    }
]

DEMO_PROJECTS = [
    # Diverse housing projects
    {
        "name": "Sunset Heights Affordable Community",
        "developer_name": "Bay Area Affordable Housing Partners",
        "total_units": 150,
        "affordable_units": 120,
        "ami_percentage": 80,
        "location": {"lat": 37.7604, "lng": -122.5088},
        "address": "2100 Sunset Boulevard, San Francisco, CA 94116",
        "amenities": ["parking", "gym", "laundry", "community_room", "playground", "bike_storage"],
        "expected_completion": "2025-12-31",
        "application_deadline": "2025-06-30",
        "status": "active",
        "description": "Modern affordable housing complex with family-friendly amenities and easy transit access. Features energy-efficient design and solar panels.",
        "unit_types": {
            "studio": 20,
            "1br": 40,
            "2br": 40,
            "3br": 20
        },
        "nearby_transit": ["Muni L-Taraval", "Muni N-Judah"],
        "school_district": "San Francisco Unified",
        "walkability_score": 85
    },
    {
        "name": "Mission Bay Senior Living",
        "developer_name": "Golden Gate Senior Communities",
        "total_units": 100,
        "affordable_units": 100,
        "ami_percentage": 50,
        "location": {"lat": 37.7695, "lng": -122.3927},
        "address": "350 Mission Bay Boulevard, San Francisco, CA 94158",
        "amenities": ["accessible", "medical_office", "community_kitchen", "garden", "library", "shuttle_service"],
        "expected_completion": "2025-09-30",
        "application_deadline": "2025-03-31",
        "status": "active",
        "description": "Dedicated affordable housing for seniors 55+. On-site healthcare services, social programs, and proximity to UCSF Medical Center.",
        "unit_types": {
            "studio": 30,
            "1br": 60,
            "2br": 10
        },
        "special_features": ["24/7 emergency response", "Meal programs", "Social activities"],
        "accessibility_features": ["Wheelchair accessible", "Grab bars", "Emergency pull cords"]
    },
    {
        "name": "Bayview Mixed-Income Development",
        "developer_name": "Urban Renaissance Partners",
        "total_units": 250,
        "affordable_units": 100,
        "ami_percentage": 60,
        "location": {"lat": 37.7258, "lng": -122.3882},
        "address": "1500 Third Street, San Francisco, CA 94124",
        "amenities": ["parking", "gym", "rooftop_deck", "business_center", "pet_spa", "ev_charging"],
        "expected_completion": "2026-03-31",
        "application_deadline": "2025-09-30",
        "status": "active",
        "description": "Mixed-income community fostering economic diversity. Features market-rate and affordable units with shared amenities and community spaces.",
        "unit_types": {
            "studio": 50,
            "1br": 100,
            "2br": 75,
            "3br": 25
        },
        "retail_space": "15,000 sq ft ground floor retail",
        "community_benefits": ["Local hiring program", "Small business incubator"]
    },
    {
        "name": "Teachers Village at Balboa Park",
        "developer_name": "Educators Housing Initiative",
        "total_units": 80,
        "affordable_units": 80,
        "ami_percentage": 70,
        "location": {"lat": 37.7214, "lng": -122.4847},
        "address": "500 Balboa Street, San Francisco, CA 94118",
        "amenities": ["parking", "community_room", "homework_center", "playground", "teacher_lounge"],
        "expected_completion": "2025-08-31",
        "application_deadline": "2025-02-28",
        "status": "active",
        "description": "Priority housing for teachers and education professionals. Partnership with SFUSD to provide affordable homes for educators.",
        "unit_types": {
            "1br": 30,
            "2br": 35,
            "3br": 15
        },
        "eligibility": "SFUSD employees and education professionals",
        "special_programs": ["Down payment assistance", "Financial literacy workshops"]
    },
    {
        "name": "Green Living SOMA",
        "developer_name": "EcoUrban Developers",
        "total_units": 200,
        "affordable_units": 60,
        "ami_percentage": 90,
        "location": {"lat": 37.7785, "lng": -122.3948},
        "address": "888 Howard Street, San Francisco, CA 94103",
        "amenities": ["solar_panels", "green_roof", "ev_charging", "bike_workshop", "composting", "water_recycling"],
        "expected_completion": "2026-06-30",
        "application_deadline": "2025-12-31",
        "status": "active",
        "description": "LEED Platinum certified sustainable living. Net-zero energy building with urban farming spaces and comprehensive recycling programs.",
        "unit_types": {
            "studio": 40,
            "1br": 80,
            "2br": 60,
            "3br": 20
        },
        "sustainability_features": ["Solar power", "Greywater recycling", "Urban garden plots"],
        "certifications": ["LEED Platinum", "WELL Building Standard"]
    },
    {
        "name": "Veterans Housing Presidio",
        "developer_name": "Veterans Community Living",
        "total_units": 120,
        "affordable_units": 120,
        "ami_percentage": 50,
        "location": {"lat": 37.7989, "lng": -122.4662},
        "address": "1800 Presidio Avenue, San Francisco, CA 94115",
        "amenities": ["accessible", "counseling_center", "job_training", "computer_lab", "veterans_lounge"],
        "expected_completion": "2025-11-30",
        "application_deadline": "2025-05-31",
        "status": "active",
        "description": "Supportive housing for veterans with on-site services. Partnership with VA to provide comprehensive support and job training.",
        "unit_types": {
            "studio": 60,
            "1br": 50,
            "2br": 10
        },
        "support_services": ["Mental health counseling", "Job placement", "Benefits assistance"],
        "eligibility": "Veterans with honorable discharge"
    },
    {
        "name": "Artists Lofts Mission District",
        "developer_name": "Creative Spaces SF",
        "total_units": 60,
        "affordable_units": 60,
        "ami_percentage": 60,
        "location": {"lat": 37.7599, "lng": -122.4148},
        "address": "2400 Mission Street, San Francisco, CA 94110",
        "amenities": ["art_studio", "gallery_space", "workshop", "kiln_room", "performance_space", "freight_elevator"],
        "expected_completion": "2025-10-31",
        "application_deadline": "2025-04-30",
        "status": "active",
        "description": "Live/work spaces for artists and creative professionals. Large units with high ceilings and natural light. Community gallery on ground floor.",
        "unit_types": {
            "live_work_studio": 30,
            "1br_loft": 20,
            "2br_loft": 10
        },
        "special_features": ["24/7 access", "Loading dock", "Ventilation for art materials"],
        "eligibility": "Working artists and creative professionals"
    },
    {
        "name": "Family Commons Excelsior",
        "developer_name": "Family First Housing",
        "total_units": 180,
        "affordable_units": 140,
        "ami_percentage": 70,
        "location": {"lat": 37.7246, "lng": -122.4260},
        "address": "4600 Mission Street, San Francisco, CA 94112",
        "amenities": ["daycare", "playground", "study_rooms", "teen_center", "family_gym", "community_garden"],
        "expected_completion": "2026-02-28",
        "application_deadline": "2025-08-31",
        "status": "active",
        "description": "Family-focused community with on-site childcare and after-school programs. Large units suitable for families with children.",
        "unit_types": {
            "2br": 60,
            "3br": 80,
            "4br": 40
        },
        "family_services": ["On-site daycare", "After-school programs", "Parent education classes"],
        "nearby_schools": ["Excelsior Elementary", "James Denman Middle School"]
    }
]

DEMO_APPLICATIONS = [
    # Sample applications linking applicants to projects
    {
        "applicant_email": "maria.rodriguez@demo.homeverse.io",
        "project_name": "Family Commons Excelsior",
        "status": "approved",
        "application_date": "2024-11-15",
        "notes": "Strong application. Family size matches unit availability. Excellent references."
    },
    {
        "applicant_email": "james.chen@demo.homeverse.io",
        "project_name": "Green Living SOMA",
        "status": "pending",
        "application_date": "2024-12-01",
        "notes": "First-time buyers. Reviewing financial documentation."
    },
    {
        "applicant_email": "aisha.williams@demo.homeverse.io",
        "project_name": "Teachers Village at Balboa Park",
        "status": "approved",
        "application_date": "2024-10-20",
        "notes": "Verified SFUSD employment. Priority placement as teacher."
    },
    {
        "applicant_email": "robert.johnson@demo.homeverse.io",
        "project_name": "Mission Bay Senior Living",
        "status": "approved",
        "application_date": "2024-09-30",
        "notes": "Meets age requirement. VA verification complete. Needs accessible unit."
    },
    {
        "applicant_email": "ahmed.hassan@demo.homeverse.io",
        "project_name": "Sunset Heights Affordable Community",
        "status": "waitlist",
        "application_date": "2024-11-20",
        "notes": "Qualified but high demand. Position #15 on waitlist."
    },
    {
        "applicant_email": "sarah.thompson@demo.homeverse.io",
        "project_name": "Artists Lofts Mission District",
        "status": "under_review",
        "application_date": "2024-12-05",
        "notes": "Verifying artist qualification. Portfolio review scheduled."
    },
    {
        "applicant_email": "carlos.mendez@demo.homeverse.io",
        "project_name": "Bayview Mixed-Income Development",
        "status": "approved",
        "application_date": "2024-10-10",
        "notes": "Large family qualification verified. 4BR unit reserved."
    }
]

DEMO_LENDER_PORTFOLIOS = [
    {
        "lender_name": "Bay Area Community Bank",
        "total_investment": 25000000,
        "projects_funded": 12,
        "affordable_units_funded": 450,
        "cra_score": 92,
        "portfolio_summary": {
            "senior_housing": 3,
            "family_housing": 5,
            "mixed_income": 4
        }
    },
    {
        "lender_name": "Golden Gate Credit Union",
        "total_investment": 15000000,
        "projects_funded": 8,
        "affordable_units_funded": 280,
        "cra_score": 88,
        "portfolio_summary": {
            "senior_housing": 2,
            "family_housing": 4,
            "teacher_housing": 2
        }
    },
    {
        "lender_name": "Pacific Investment Partners",
        "total_investment": 40000000,
        "projects_funded": 15,
        "affordable_units_funded": 600,
        "cra_score": 95,
        "portfolio_summary": {
            "green_housing": 5,
            "mixed_income": 6,
            "veteran_housing": 4
        }
    }
]

async def seed_demo_data():
    """Seed comprehensive demo data"""
    logger.info("🚀 Starting comprehensive demo data seeding...")
    
    try:
        # Get or create demo company
        logger.info("Setting up demo company...")
        result = supabase.table('companies').select('*').eq('name', 'HomeVerse Demo Company').execute()
        
        if result.data:
            company_id = result.data[0]['id']
            logger.info(f"✅ Using existing demo company: {company_id}")
        else:
            company_data = {
                "name": "HomeVerse Demo Company",
                "key": "demo-company",
                "plan": "enterprise",
                "max_users": 200,
                "settings": {
                    "features": {
                        "ai_matching": True,
                        "document_processing": True,
                        "advanced_analytics": True,
                        "real_time_updates": True,
                        "custom_reporting": True
                    },
                    "branding": {
                        "primary_color": "#008080",
                        "logo_url": "/logo.png"
                    }
                }
            }
            result = supabase.table('companies').insert(company_data).execute()
            company_id = result.data[0]['id']
            logger.info(f"✅ Created demo company: {company_id}")
        
        # Seed applicants
        logger.info("Creating demo applicants...")
        created_applicants = {}
        for applicant in DEMO_APPLICANTS:
            try:
                # Check if applicant exists
                result = supabase.table('applicants').select('*').eq('email', applicant['email']).execute()
                
                if not result.data:
                    applicant_data = applicant.copy()
                    applicant_data['company_id'] = company_id
                    result = supabase.table('applicants').insert(applicant_data).execute()
                    created_applicants[applicant['email']] = result.data[0]['id']
                    logger.info(f"✅ Created applicant: {applicant['first_name']} {applicant['last_name']}")
                else:
                    created_applicants[applicant['email']] = result.data[0]['id']
                    logger.info(f"⚠️  Applicant already exists: {applicant['email']}")
            except Exception as e:
                logger.error(f"❌ Error creating applicant {applicant['email']}: {e}")
        
        # Seed projects
        logger.info("Creating demo projects...")
        created_projects = {}
        for project in DEMO_PROJECTS:
            try:
                # Check if project exists
                result = supabase.table('projects').select('*').eq('name', project['name']).execute()
                
                if not result.data:
                    project_data = project.copy()
                    project_data['company_id'] = company_id
                    result = supabase.table('projects').insert(project_data).execute()
                    created_projects[project['name']] = result.data[0]['id']
                    logger.info(f"✅ Created project: {project['name']}")
                else:
                    created_projects[project['name']] = result.data[0]['id']
                    logger.info(f"⚠️  Project already exists: {project['name']}")
            except Exception as e:
                logger.error(f"❌ Error creating project {project['name']}: {e}")
        
        # Create applications
        logger.info("Creating demo applications...")
        for application in DEMO_APPLICATIONS:
            try:
                applicant_id = created_applicants.get(application['applicant_email'])
                project_id = created_projects.get(application['project_name'])
                
                if applicant_id and project_id:
                    # Check if application exists
                    result = supabase.table('applications').select('*')\
                        .eq('applicant_id', applicant_id)\
                        .eq('project_id', project_id)\
                        .execute()
                    
                    if not result.data:
                        app_data = {
                            "applicant_id": applicant_id,
                            "project_id": project_id,
                            "status": application['status'],
                            "submitted_at": application['application_date'],
                            "notes": application['notes'],
                            "company_id": company_id
                        }
                        supabase.table('applications').insert(app_data).execute()
                        logger.info(f"✅ Created application: {application['applicant_email']} → {application['project_name']}")
                    else:
                        logger.info(f"⚠️  Application already exists")
            except Exception as e:
                logger.error(f"❌ Error creating application: {e}")
        
        # Create some analytics data
        logger.info("Creating demo analytics data...")
        analytics_data = {
            "company_id": company_id,
            "period": "2024-Q4",
            "metrics": {
                "total_applications": 487,
                "approved_applications": 152,
                "pending_applications": 89,
                "average_processing_time": 14.5,
                "applicant_demographics": {
                    "income_brackets": {
                        "0-30% AMI": 15,
                        "31-50% AMI": 28,
                        "51-80% AMI": 42,
                        "81-100% AMI": 15
                    },
                    "household_sizes": {
                        "1": 22,
                        "2": 35,
                        "3": 25,
                        "4+": 18
                    }
                },
                "geographic_distribution": {
                    "Mission": 18,
                    "SOMA": 15,
                    "Bayview": 12,
                    "Sunset": 20,
                    "Richmond": 10,
                    "Other": 25
                }
            }
        }
        
        try:
            supabase.table('analytics_snapshots').insert(analytics_data).execute()
            logger.info("✅ Created analytics snapshot")
        except Exception as e:
            logger.error(f"❌ Error creating analytics data: {e}")
        
        logger.info("✅ Demo data seeding completed!")
        logger.info("📊 Summary:")
        logger.info(f"   - Applicants created: {len(created_applicants)}")
        logger.info(f"   - Projects created: {len(created_projects)}")
        logger.info(f"   - Applications created: {len(DEMO_APPLICATIONS)}")
        logger.info("🔄 Please restart the backend server to see all changes")
        
    except Exception as e:
        logger.error(f"❌ Fatal error during seeding: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(seed_demo_data())