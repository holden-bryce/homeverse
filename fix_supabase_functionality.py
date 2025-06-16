#!/usr/bin/env python3
"""
Fix Supabase backend functionality by adding missing endpoints and creating profile records
"""

import os
import sys
import asyncio
from supabase import create_client, Client
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vzxadsifonqklotzhdpl.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNDkwMTAsImV4cCI6MjA0ODkyNTAxMH0.gN2ipHewH5TkQjOy7RlKF0h5qd_VQMEqPsWqD9Fvi2I")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eGFkc2lmb25xa2xvdHpoZHBsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzM0OTAxMCwiZXhwIjoyMDQ4OTI1MDEwfQ.wETEq0xmYU0K0rOVGGqCMlxOXWnez1hQrV6Vg0cJNJA")

# Test users to create profiles for
TEST_USERS = [
    {"email": "developer@test.com", "role": "developer", "full_name": "Test Developer", "user_id": "66b5e28d-8ffc-4b21-8b46-c51aa29d5dd2"},
    {"email": "lender@test.com", "role": "lender", "full_name": "Test Lender", "user_id": "d1c01378-e3d8-48f6-9c8e-6da8487d13e6"},
    {"email": "buyer@test.com", "role": "buyer", "full_name": "Test Buyer", "user_id": "eab1619c-d2bd-4efa-a8ef-1c87a8ecd027"},
    {"email": "applicant@test.com", "role": "applicant", "full_name": "Test Applicant", "user_id": "55c8c24e-05eb-4a1b-b820-02e8b664cfc6"},
    {"email": "admin@test.com", "role": "admin", "full_name": "Test Admin", "user_id": "40e47137-78fd-4db6-a195-ba3aadc67eda"}
]

def create_supabase_client() -> Client:
    """Create Supabase client with service role key for admin operations"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def fix_backend_code():
    """Add missing endpoints to supabase_backend.py"""
    logger.info("Adding missing endpoints to supabase_backend.py...")
    
    # Read the current backend file
    with open("supabase_backend.py", "r") as f:
        content = f.read()
    
    # Check if endpoints already exist
    if "/api/v1/auth/me" in content:
        logger.info("Endpoints already exist, skipping...")
        return
    
    # Find where to insert the new endpoints (after the logout endpoint)
    insert_pos = content.find('@app.post("/api/v1/auth/logout")')
    if insert_pos == -1:
        logger.error("Could not find logout endpoint")
        return
    
    # Find the end of the logout function
    next_decorator = content.find('\n@app.', insert_pos + 1)
    if next_decorator == -1:
        next_decorator = len(content)
    
    # New endpoints to add
    new_endpoints = '''

@app.get("/api/v1/auth/me")
async def get_current_user_profile(user=Depends(get_current_user)):
    """Get current user profile with company info"""
    return {
        "id": user["id"],
        "email": user["email"],
        "role": user.get("role", "buyer"),
        "full_name": user.get("full_name", ""),
        "company": user.get("company", {})
    }

@app.get("/api/v1/users/settings")
async def get_user_settings(user=Depends(get_current_user)):
    """Get user settings and preferences"""
    try:
        # Get user preferences from profiles table
        result = supabase.table('profiles').select('preferences').eq('id', user['id']).single().execute()
        preferences = result.data.get('preferences', {}) if result.data else {}
        
        return {
            "notifications": {
                "email_new_applications": preferences.get("email_new_applications", True),
                "email_status_updates": preferences.get("email_status_updates", True),
                "email_weekly_report": preferences.get("email_weekly_report", False),
                "sms_urgent_updates": preferences.get("sms_urgent_updates", False)
            },
            "privacy": {
                "show_profile": preferences.get("show_profile", True),
                "allow_messages": preferences.get("allow_messages", True)
            },
            "display": {
                "theme": preferences.get("theme", "light"),
                "language": preferences.get("language", "en"),
                "timezone": preferences.get("timezone", "UTC")
            }
        }
    except Exception as e:
        logger.error(f"Error getting user settings: {e}")
        return {
            "notifications": {
                "email_new_applications": True,
                "email_status_updates": True,
                "email_weekly_report": False,
                "sms_urgent_updates": False
            },
            "privacy": {
                "show_profile": True,
                "allow_messages": True
            },
            "display": {
                "theme": "light",
                "language": "en",
                "timezone": "UTC"
            }
        }

@app.patch("/api/v1/users/settings")
async def update_user_settings(settings: dict, user=Depends(get_current_user)):
    """Update user settings and preferences"""
    try:
        # Get current preferences
        result = supabase.table('profiles').select('preferences').eq('id', user['id']).single().execute()
        current_prefs = result.data.get('preferences', {}) if result.data else {}
        
        # Merge with new settings
        if 'notifications' in settings:
            current_prefs.update(settings['notifications'])
        
        # Update in database
        supabase.table('profiles').update({
            'preferences': current_prefs
        }).eq('id', user['id']).execute()
        
        return {"message": "Settings updated successfully"}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

@app.get("/api/v1/analytics/heatmap")
async def get_heatmap_data(user=Depends(get_current_user)):
    """Get heatmap data for analytics"""
    if user.get('role') not in ['lender', 'admin', 'developer']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get all projects with their locations
        projects = supabase.table('projects').select('*').execute()
        
        # Get all applicants with their desired locations
        applicants = supabase.table('applicants').select('*').execute()
        
        # Format data for heatmap
        heatmap_data = {
            "projects": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "lat": p["location"]["lat"],
                    "lng": p["location"]["lng"],
                    "units": p["total_units"],
                    "affordable_units": p["affordable_units"],
                    "ami_percentage": p["ami_percentage"]
                }
                for p in projects.data or []
                if p.get("location")
            ],
            "demand_zones": [
                {
                    "lat": a["desired_location"]["lat"],
                    "lng": a["desired_location"]["lng"],
                    "intensity": 1  # Could be calculated based on household size, income, etc.
                }
                for a in applicants.data or []
                if a.get("desired_location")
            ],
            "statistics": {
                "total_projects": len(projects.data) if projects.data else 0,
                "total_applicants": len(applicants.data) if applicants.data else 0,
                "total_units": sum(p["total_units"] for p in projects.data or []),
                "total_affordable_units": sum(p["affordable_units"] for p in projects.data or [])
            }
        }
        
        return heatmap_data
    except Exception as e:
        logger.error(f"Error getting heatmap data: {e}")
        return {
            "projects": [],
            "demand_zones": [],
            "statistics": {
                "total_projects": 0,
                "total_applicants": 0,
                "total_units": 0,
                "total_affordable_units": 0
            }
        }

@app.post("/api/v1/contact")
async def submit_contact_form(
    name: str = Form(...),
    email: str = Form(...),
    company: str = Form(None),
    role: str = Form(None),
    message: str = Form(...)
):
    """Submit contact form"""
    try:
        # Save to database
        result = supabase.table('contact_submissions').insert({
            "name": name,
            "email": email,
            "company": company,
            "role": role,
            "message": message
        }).execute()
        
        # Send email notification if configured
        if SENDGRID_API_KEY:
            try:
                from_email = From("noreply@homeverse.io")
                to_email = To("holdenbryce06@gmail.com")
                subject = f"New HomeVerse Contact Form Submission from {name}"
                
                html_content = f"""
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> {name}</p>
                <p><strong>Email:</strong> {email}</p>
                <p><strong>Company:</strong> {company or 'Not provided'}</p>
                <p><strong>Role:</strong> {role or 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <p>{message}</p>
                """
                
                mail = Mail(from_email, to_email, subject, html_content)
                sg = SendGridAPIClient(SENDGRID_API_KEY)
                sg.send(mail)
                
                # Send auto-reply
                auto_reply = Mail(
                    from_email,
                    To(email),
                    "Thank you for contacting HomeVerse",
                    f"""
                    <h2>Thank you for reaching out!</h2>
                    <p>Hi {name},</p>
                    <p>We've received your message and will get back to you within 24-48 hours.</p>
                    <p>Best regards,<br>The HomeVerse Team</p>
                    """
                )
                sg.send(auto_reply)
            except Exception as e:
                logger.error(f"Error sending email: {e}")
        
        return {"message": "Contact form submitted successfully", "id": result.data[0]["id"]}
    except Exception as e:
        logger.error(f"Error submitting contact form: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit contact form")
'''
    
    # Insert the new endpoints
    new_content = content[:next_decorator] + new_endpoints + content[next_decorator:]
    
    # Add necessary imports at the top if not present
    imports_to_add = []
    if "from fastapi import Form" not in new_content:
        imports_to_add.append("from fastapi import Form")
    if "from sendgrid import SendGridAPIClient" not in new_content and "SENDGRID_API_KEY" in new_content:
        imports_to_add.append("from sendgrid import SendGridAPIClient\nfrom sendgrid.helpers.mail import Mail, From, To")
    
    if imports_to_add:
        import_pos = new_content.find("from fastapi import")
        if import_pos != -1:
            line_end = new_content.find("\n", import_pos)
            new_content = new_content[:line_end] + ", Form" + new_content[line_end:]
    
    # Write back the updated file
    with open("supabase_backend.py", "w") as f:
        f.write(new_content)
    
    logger.info("✅ Added missing endpoints to supabase_backend.py")

async def create_test_profiles():
    """Create profile records for test users"""
    logger.info("Creating profile records for test users...")
    
    supabase = create_supabase_client()
    
    # First, ensure we have a test company
    try:
        # Check if test company exists
        company_result = supabase.table('companies').select('*').eq('name', 'Test Company').execute()
        
        if not company_result.data:
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
            company_result = supabase.table('companies').insert(company_data).execute()
            company_id = company_result.data[0]['id']
            logger.info(f"✅ Created test company with ID: {company_id}")
        else:
            company_id = company_result.data[0]['id']
            logger.info(f"✅ Using existing test company with ID: {company_id}")
    except Exception as e:
        logger.error(f"Error creating company: {e}")
        company_id = None
    
    # Create profiles for each test user
    for user in TEST_USERS:
        try:
            # Check if profile already exists
            existing = supabase.table('profiles').select('*').eq('id', user['user_id']).execute()
            
            if not existing.data:
                # Create profile
                profile_data = {
                    "id": user["user_id"],
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "company_id": company_id,
                    "preferences": {
                        "email_new_applications": True,
                        "email_status_updates": True,
                        "theme": "light",
                        "language": "en"
                    }
                }
                
                result = supabase.table('profiles').insert(profile_data).execute()
                logger.info(f"✅ Created profile for {user['email']}")
            else:
                # Update existing profile to ensure it has company_id
                supabase.table('profiles').update({
                    "company_id": company_id,
                    "role": user["role"],
                    "full_name": user["full_name"]
                }).eq('id', user['user_id']).execute()
                logger.info(f"✅ Updated profile for {user['email']}")
                
        except Exception as e:
            logger.error(f"❌ Error creating profile for {user['email']}: {e}")

async def create_sample_data():
    """Create some sample projects and applicants"""
    logger.info("Creating sample data...")
    
    supabase = create_supabase_client()
    
    # Get company ID
    company_result = supabase.table('companies').select('*').eq('name', 'Test Company').execute()
    if not company_result.data:
        logger.error("Test company not found")
        return
    
    company_id = company_result.data[0]['id']
    
    # Sample projects
    sample_projects = [
        {
            "name": "Affordable Housing Downtown",
            "developer_name": "Test Developer LLC",
            "total_units": 100,
            "affordable_units": 30,
            "ami_percentage": 80,
            "location": {"lat": 40.7128, "lng": -74.0060},
            "amenities": ["parking", "gym", "laundry"],
            "expected_completion": "2025-12-31",
            "application_deadline": "2025-06-30",
            "company_id": company_id
        },
        {
            "name": "Green Living Complex",
            "developer_name": "Test Developer LLC",
            "total_units": 150,
            "affordable_units": 45,
            "ami_percentage": 60,
            "location": {"lat": 40.7589, "lng": -73.9851},
            "amenities": ["solar", "ev_charging", "community_garden"],
            "expected_completion": "2026-03-31",
            "application_deadline": "2025-09-30",
            "company_id": company_id
        }
    ]
    
    # Sample applicants
    sample_applicants = [
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com",
            "phone": "+12125551234",
            "household_size": 3,
            "household_income": 55000,
            "desired_location": {"lat": 40.7200, "lng": -74.0100},
            "max_rent": 2000,
            "min_bedrooms": 2,
            "preferences": {"pet_friendly": True, "parking": True},
            "company_id": company_id
        },
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com",
            "phone": "+12125555678",
            "household_size": 2,
            "household_income": 45000,
            "desired_location": {"lat": 40.7500, "lng": -73.9900},
            "max_rent": 1800,
            "min_bedrooms": 1,
            "preferences": {"accessible": True, "near_transit": True},
            "company_id": company_id
        }
    ]
    
    # Create projects
    for project in sample_projects:
        try:
            existing = supabase.table('projects').select('*').eq('name', project['name']).eq('company_id', company_id).execute()
            if not existing.data:
                supabase.table('projects').insert(project).execute()
                logger.info(f"✅ Created project: {project['name']}")
        except Exception as e:
            logger.error(f"Error creating project: {e}")
    
    # Create applicants
    for applicant in sample_applicants:
        try:
            existing = supabase.table('applicants').select('*').eq('email', applicant['email']).eq('company_id', company_id).execute()
            if not existing.data:
                supabase.table('applicants').insert(applicant).execute()
                logger.info(f"✅ Created applicant: {applicant['first_name']} {applicant['last_name']}")
        except Exception as e:
            logger.error(f"Error creating applicant: {e}")

async def main():
    """Main function to fix all functionality issues"""
    logger.info("🚀 Starting Supabase functionality fixes...")
    
    # Fix backend code
    fix_backend_code()
    
    # Create test profiles
    await create_test_profiles()
    
    # Create sample data
    await create_sample_data()
    
    logger.info("✅ All fixes applied successfully!")
    logger.info("🔄 Please restart the backend server for changes to take effect")

if __name__ == "__main__":
    asyncio.run(main())