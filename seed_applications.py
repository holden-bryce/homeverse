#!/usr/bin/env python3
"""
Seed Applications Portal with Real Data
This script creates applications that link real applicants to real projects
"""

import os
import uuid
from datetime import datetime, timedelta
import random
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    print("❌ Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
print("✅ Supabase client initialized")

def get_real_applicants():
    """Get existing applicants from the database"""
    try:
        result = supabase.table('applicants').select('id, first_name, last_name, email, company_id').execute()
        print(f"📋 Found {len(result.data)} existing applicants")
        return result.data or []
    except Exception as e:
        print(f"❌ Error fetching applicants: {e}")
        return []

def get_real_projects():
    """Get existing projects from the database"""
    try:
        result = supabase.table('projects').select('id, name, address, company_id').execute()
        print(f"🏠 Found {len(result.data)} existing projects")
        return result.data or []
    except Exception as e:
        print(f"❌ Error fetching projects: {e}")
        return []

def create_application(applicant, project):
    """Create a single application linking applicant to project"""
    
    statuses = ['submitted', 'under_review', 'approved', 'rejected']
    status = random.choice(statuses)
    
    # Generate realistic dates
    submitted_days_ago = random.randint(1, 30)
    submitted_at = datetime.now() - timedelta(days=submitted_days_ago)
    
    # If status is beyond submitted, add review dates
    reviewed_at = None
    if status in ['under_review', 'approved', 'rejected']:
        review_days_ago = random.randint(0, submitted_days_ago - 1)
        reviewed_at = datetime.now() - timedelta(days=review_days_ago)
    
    # Generate realistic move-in date (future)
    move_in_days = random.randint(30, 120)
    preferred_move_in_date = datetime.now() + timedelta(days=move_in_days)
    
    # Sample notes
    notes_options = [
        "Looking forward to moving into this community",
        "Perfect location for my family and work commute", 
        "First-time affordable housing applicant",
        "Need accessible unit for mobility requirements",
        "Excited about the community amenities",
        "Looking for long-term housing stability"
    ]
    
    developer_notes_options = {
        'under_review': "Application is being reviewed by our team",
        'approved': "Applicant meets all requirements. Moving to next phase.",
        'rejected': "Unfortunately, application doesn't meet current criteria"
    }
    
    application_data = {
        'id': str(uuid.uuid4()),
        'project_id': project['id'],
        'applicant_id': applicant['id'],
        'company_id': applicant['company_id'],  # Use applicant's company
        'status': status,
        'preferred_move_in_date': preferred_move_in_date.isoformat(),
        'additional_notes': random.choice(notes_options),
        'submitted_at': submitted_at.isoformat(),
        'created_at': submitted_at.isoformat(),
        'updated_at': (reviewed_at or submitted_at).isoformat(),
        'reviewed_at': reviewed_at.isoformat() if reviewed_at else None,
        'developer_notes': developer_notes_options.get(status)
    }
    
    return application_data

def seed_applications():
    """Main function to seed applications"""
    print("🌱 Starting application seeding...")
    
    # Get existing data
    applicants = get_real_applicants()
    projects = get_real_projects()
    
    if not applicants:
        print("❌ No applicants found. Please create some applicants first.")
        return
        
    if not projects:
        print("❌ No projects found. Please create some projects first.")
        return
    
    # Check existing applications
    try:
        existing = supabase.table('applications').select('id').execute()
        existing_count = len(existing.data or [])
        print(f"📊 Found {existing_count} existing applications")
        
        if existing_count > 0:
            print(f"ℹ️  There are already {existing_count} applications. Adding more...")
    except:
        print("📊 No existing applications found")
    
    applications_to_create = []
    
    # Create 1-3 applications per applicant
    for applicant in applicants:
        num_applications = random.randint(1, min(3, len(projects)))
        selected_projects = random.sample(projects, num_applications)
        
        for project in selected_projects:
            # Only create if they're in the same company or compatible
            if applicant['company_id'] == project['company_id']:
                application = create_application(applicant, project)
                applications_to_create.append(application)
                
                print(f"  📝 {applicant['first_name']} {applicant['last_name']} → {project['name']} ({application['status']})")
    
    if not applications_to_create:
        print("❌ No compatible applicant-project pairs found")
        return
    
    # Insert applications in batches
    batch_size = 10
    total_created = 0
    
    try:
        for i in range(0, len(applications_to_create), batch_size):
            batch = applications_to_create[i:i+batch_size]
            result = supabase.table('applications').insert(batch).execute()
            total_created += len(result.data or [])
            print(f"✅ Created batch {i//batch_size + 1}: {len(result.data or [])} applications")
        
        print(f"\n🎉 Successfully created {total_created} applications!")
        
        # Show summary by status
        status_summary = {}
        for app in applications_to_create:
            status = app['status']
            status_summary[status] = status_summary.get(status, 0) + 1
        
        print("\n📊 Summary by status:")
        for status, count in status_summary.items():
            print(f"  • {status}: {count}")
            
    except Exception as e:
        print(f"❌ Error creating applications: {e}")

def cleanup_applications():
    """Remove all applications (for testing)"""
    response = input("⚠️  This will DELETE ALL applications. Are you sure? (type 'DELETE' to confirm): ")
    if response != 'DELETE':
        print("❌ Cleanup cancelled")
        return
    
    try:
        result = supabase.table('applications').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"🗑️  Deleted all applications")
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")

if __name__ == "__main__":
    print("🏠 HomeVerse Applications Seeder")
    print("=" * 40)
    
    # Auto-run seeding without prompts
    seed_applications()