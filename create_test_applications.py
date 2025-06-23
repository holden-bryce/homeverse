#!/usr/bin/env python3
"""
Create test applications to populate the database
"""
import os
import uuid
from datetime import datetime, timedelta
from supabase import create_client
from dotenv import load_dotenv
import random

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("🏠 Creating Test Applications...")

# Get available applicants and projects
try:
    applicants_result = supabase.table('applicants').select('id, first_name, last_name').execute()
    applicants = applicants_result.data or []
    print(f"Available applicants: {len(applicants)}")
    
    projects_result = supabase.table('projects').select('id, name').execute()
    projects = projects_result.data or []
    print(f"Available projects: {len(projects)}")
    
    if not applicants:
        print("❌ No applicants found. Creating sample applicants first...")
        # Create sample applicants
        sample_applicants = [
            {
                'id': str(uuid.uuid4()),
                'company_id': '11111111-1111-1111-1111-111111111111',
                'first_name': 'John',
                'last_name': 'Smith',
                'email': 'john.smith@email.com',
                'phone': '555-0101',
                'household_size': 2,
                'income': 45000,
                'ami_percent': 60,
                'location_preference': 'San Francisco',
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'company_id': '11111111-1111-1111-1111-111111111111',
                'first_name': 'Maria',
                'last_name': 'Garcia',
                'email': 'maria.garcia@email.com',
                'phone': '555-0102',
                'household_size': 3,
                'income': 52000,
                'ami_percent': 80,
                'location_preference': 'Oakland',
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'company_id': '11111111-1111-1111-1111-111111111111',
                'first_name': 'David',
                'last_name': 'Johnson',
                'email': 'david.johnson@email.com',
                'phone': '555-0103',
                'household_size': 4,
                'income': 38000,
                'ami_percent': 50,
                'location_preference': 'San Jose',
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            },
            {
                'id': str(uuid.uuid4()),
                'company_id': '11111111-1111-1111-1111-111111111111',
                'first_name': 'Sarah',
                'last_name': 'Wilson',
                'email': 'sarah.wilson@email.com',
                'phone': '555-0104',
                'household_size': 1,
                'income': 35000,
                'ami_percent': 60,
                'location_preference': 'San Francisco',
                'status': 'active',
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
        ]
        
        supabase.table('applicants').insert(sample_applicants).execute()
        print("✅ Created sample applicants")
        applicants = sample_applicants
    
    if not projects:
        print("❌ No projects found. Cannot create applications without projects.")
        exit(1)
    
    # Create test applications
    statuses = ['submitted', 'under_review', 'approved', 'rejected']
    applications = []
    
    for i, applicant in enumerate(applicants[:10]):  # Create up to 10 applications
        for j, project in enumerate(projects[:3]):  # For first 3 projects
            if i + j < 8:  # Create 8 total applications
                app_id = str(uuid.uuid4())
                submitted_date = datetime.now() - timedelta(days=random.randint(1, 30))
                
                application = {
                    'id': app_id,
                    'company_id': '11111111-1111-1111-1111-111111111111',
                    'project_id': project['id'],
                    'applicant_id': applicant['id'],
                    'status': random.choice(statuses),
                    'preferred_move_in_date': (datetime.now() + timedelta(days=random.randint(30, 180))).date().isoformat(),
                    'additional_notes': f"Application from {applicant['first_name']} {applicant['last_name']} for {project['name']}. Looking forward to hearing back!",
                    'submitted_at': submitted_date.isoformat(),
                    'created_at': submitted_date.isoformat(),
                    'updated_at': submitted_date.isoformat()
                }
                
                # Add developer notes for reviewed applications
                if application['status'] in ['approved', 'rejected', 'under_review']:
                    reviewed_date = submitted_date + timedelta(days=random.randint(1, 7))
                    application['reviewed_at'] = reviewed_date.isoformat()
                    application['reviewed_by'] = '66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2'  # Developer user ID
                    
                    if application['status'] == 'approved':
                        application['developer_notes'] = 'Application meets all requirements. Approved for housing placement.'
                    elif application['status'] == 'rejected':
                        application['developer_notes'] = 'Application does not meet income requirements for this AMI level.'
                    else:
                        application['developer_notes'] = 'Application under review. Pending additional documentation.'
                
                applications.append(application)
    
    # Insert applications
    if applications:
        result = supabase.table('applications').insert(applications).execute()
        print(f"✅ Created {len(applications)} test applications")
        
        # Show summary
        status_count = {}
        for app in applications:
            status = app['status']
            status_count[status] = status_count.get(status, 0) + 1
        
        print("\nApplication Status Summary:")
        for status, count in status_count.items():
            print(f"  {status}: {count}")
            
        print("\nSample applications created:")
        for app in applications[:3]:
            applicant_name = f"{[a for a in applicants if a['id'] == app['applicant_id']][0]['first_name']} {[a for a in applicants if a['id'] == app['applicant_id']][0]['last_name']}"
            project_name = [p for p in projects if p['id'] == app['project_id']][0]['name']
            print(f"  - {applicant_name} → {project_name} ({app['status']})")
    
    print("\n🎉 Test applications created successfully!")
    print("You can now test the applications list page with real data.")
    
except Exception as e:
    print(f"❌ Error creating test applications: {e}")
    import traceback
    traceback.print_exc()