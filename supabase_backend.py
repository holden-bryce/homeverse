#!/usr/bin/env python3
"""HomeVerse Backend with Supabase Integration"""
import os
import logging
from datetime import datetime
from typing import Optional, Dict, List, Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Request, Header, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import uvicorn
from supabase import create_client, Client
import jwt
from functools import wraps

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Logging setup
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    logger.error("Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env")
    raise ValueError("Supabase configuration incomplete")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
logger.info("✅ Supabase client initialized")

# FastAPI app
app = FastAPI(title="HomeVerse API", version="2.0.0")

# CORS configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://homeverse-frontend.onrender.com",
    "https://homeverse.com",
    "https://www.homeverse.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "buyer"
    company_key: Optional[str] = "demo-company-2024"

class ApplicantCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    income: Optional[float] = None
    household_size: Optional[int] = None
    preferences: Optional[Dict] = {}

class ApplicantUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    income: Optional[float] = None
    household_size: Optional[int] = None
    preferences: Optional[Dict] = None
    status: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    coordinates: Optional[List[float]] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    ami_percentage: Optional[int] = None
    amenities: Optional[List[str]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    coordinates: Optional[List[float]] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    ami_percentage: Optional[int] = None
    amenities: Optional[List[str]] = None
    status: Optional[str] = None

class ContactSubmission(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

# Authentication Helpers
async def get_current_user(authorization: str = Header(None)):
    """Get current user from JWT token with automatic profile creation"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        
        if not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user profile with company info
        profile = supabase.table('profiles').select('*, companies(*)').eq('id', user.user.id).single().execute()
        
        if not profile.data or not profile.data.get('company_id'):
            # Profile missing or incomplete - fix it
            logger.warning(f"Incomplete profile for user {user.user.email}, attempting to fix...")
            
            # Get default company
            default_company = supabase.table('companies').select('*').eq('key', 'default-company').single().execute()
            if not default_company.data:
                # Create default company
                default_company = supabase.table('companies').insert({
                    "name": "Default Company",
                    "key": "default-company",
                    "plan": "trial",
                    "seats": 100
                }).execute()
                company_id = default_company.data[0]['id']
            else:
                company_id = default_company.data['id']
            
            if not profile.data:
                # Create new profile
                new_profile = supabase.table('profiles').insert({
                    "id": user.user.id,
                    "company_id": company_id,
                    "role": user.user.user_metadata.get('role', 'buyer'),
                    "full_name": user.user.user_metadata.get('full_name', user.user.email)
                }).execute()
            else:
                # Update existing profile with company_id
                supabase.table('profiles').update({
                    "company_id": company_id
                }).eq('id', user.user.id).execute()
            
            # Re-fetch profile
            profile = supabase.table('profiles').select('*, companies(*)').eq('id', user.user.id).single().execute()
        
        return {
            "id": user.user.id,
            "email": user.user.email,
            "role": profile.data.get('role', 'buyer'),
            "company_id": profile.data.get('company_id'),
            "company": profile.data.get('companies'),
            "full_name": profile.data.get('full_name')
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# Role-based access decorator
def require_role(allowed_roles: List[str]):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user=None, **kwargs):
            if not user:
                raise HTTPException(status_code=401, detail="Not authenticated")
            if user.get('role') not in allowed_roles:
                raise HTTPException(status_code=403, detail=f"Requires one of roles: {allowed_roles}")
            return await func(*args, user=user, **kwargs)
        return wrapper
    return decorator

@app.get("/")
async def root():
    return {"message": "HomeVerse API v2.0 - Powered by Supabase"}

@app.get("/health")
async def health_check():
    try:
        # Test Supabase connection
        result = supabase.table('companies').select('count').limit(1).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

# Authentication Endpoints
@app.post("/api/v1/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    try:
        # Check if company exists
        company = supabase.table('companies').select('*').eq('key', request.company_key).single().execute()
        
        if not company.data:
            # Create new company if it doesn't exist
            company = supabase.table('companies').insert({
                "name": f"Company {request.company_key}",
                "key": request.company_key
            }).execute()
            company_id = company.data[0]['id']
        else:
            company_id = company.data['id']
        
        # Register user with Supabase Auth
        # Use admin API to create user (bypasses email confirmation)
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": request.email,
                "password": request.password,
                "email_confirm": True,  # Auto-confirm email
                "user_metadata": {
                    "full_name": request.full_name,
                    "role": request.role,
                    "company_id": company_id
                }
            })
            
            if not auth_response.user:
                raise HTTPException(status_code=400, detail="Registration failed")
        except Exception as e:
            # Fallback to regular signup if admin method fails
            logger.warning(f"Admin create failed, trying regular signup: {str(e)}")
            auth_response = supabase.auth.sign_up({
                "email": request.email,
                "password": request.password,
                "options": {
                    "data": {
                        "full_name": request.full_name,
                        "role": request.role,
                        "company_id": company_id
                    }
                }
            })
            
            if not auth_response.user:
                raise HTTPException(status_code=400, detail="Registration failed")
        
        # Update profile with company_id and role
        profile_update = supabase.table('profiles').update({
            "company_id": company_id,
            "role": request.role,
            "full_name": request.full_name
        }).eq('id', auth_response.user.id).execute()
        
        return {
            "message": "Registration successful",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": request.role
            }
        }
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/admin/users", dependencies=[Depends(get_current_user)])
async def create_user_admin(request: RegisterRequest, user=Depends(get_current_user)):
    """Admin endpoint to create users - requires admin role"""
    # Check if user is admin
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Only admins can create users")
    
    try:
        # Get company
        company = supabase.table('companies').select('*').eq('key', request.company_key).single().execute()
        
        if not company.data:
            company = supabase.table('companies').insert({
                "name": f"Company {request.company_key}",
                "key": request.company_key
            }).execute()
            company_id = company.data[0]['id']
        else:
            company_id = company.data['id']
        
        # Create user with admin API (always confirms email)
        auth_response = supabase.auth.admin.create_user({
            "email": request.email,
            "password": request.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": request.full_name,
                "role": request.role,
                "company_id": company_id
            }
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="User creation failed")
        
        # Create profile
        profile = supabase.table('profiles').insert({
            "id": auth_response.user.id,
            "company_id": company_id,
            "role": request.role,
            "full_name": request.full_name
        }).execute()
        
        return {
            "message": "User created successfully",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": request.role,
                "company": company.data.get('name', 'Unknown')
            }
        }
    except Exception as e:
        logger.error(f"Admin user creation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get user profile
        profile = supabase.table('profiles').select('*, companies(*)').eq('id', auth_response.user.id).single().execute()
        
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": profile.data.get('role', 'buyer'),
                "full_name": profile.data.get('full_name'),
                "company": profile.data.get('companies')
            }
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/v1/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout user"""
    try:
        # Supabase handles token revocation
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return {"message": "Logout completed"}


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

@app.post("/api/v1/users/complete-profile")
async def complete_profile(user=Depends(get_current_user)):
    """Complete user profile by ensuring company assignment"""
    try:
        if user.get('company_id'):
            return {
                "message": "Profile already complete",
                "profile": user
            }
        
        # This shouldn't happen with the new get_current_user, but just in case
        return {
            "message": "Profile auto-completed",
            "profile": user
        }
    except Exception as e:
        logger.error(f"Profile completion error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/users/profile-status")
async def get_profile_status(user=Depends(get_current_user)):
    """Get current user's profile status"""
    return {
        "profile_complete": bool(user.get('company_id')),
        "user": user
    }

# User Endpoints
@app.get("/api/v1/users/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info"""
    return user

@app.put("/api/v1/users/me")
async def update_me(
    updates: Dict[str, Any],
    user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        allowed_fields = ['full_name', 'phone', 'timezone', 'language', 'notification_preferences']
        filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
        
        result = supabase.table('profiles').update(filtered_updates).eq('id', user['id']).execute()
        
        return {"message": "Profile updated", "data": result.data}
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Applicant Endpoints
@app.get("/api/v1/applicants")
async def get_applicants(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Get all applicants for user's company"""
    try:
        query = supabase.table('applicants').select('*').eq('company_id', user['company_id'])
        
        if search:
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
        
        query = query.range(skip, skip + limit - 1)
        result = query.execute()
        
        return {
            "data": result.data,
            "count": len(result.data),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Get applicants error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/applicants")
async def create_applicant(
    applicant: ApplicantCreate,
    user: dict = Depends(get_current_user)
):
    """Create new applicant"""
    try:
        # Add company_id to applicant data
        applicant_data = applicant.dict()
        applicant_data['company_id'] = user['company_id']
        
        result = supabase.table('applicants').insert(applicant_data).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'created_applicant',
            'resource_type': 'applicant',
            'resource_id': result.data[0]['id'],
            'details': {'applicant_name': applicant.full_name}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Create applicant error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/applicants/{applicant_id}")
async def get_applicant(
    applicant_id: str,
    user: dict = Depends(get_current_user)
):
    """Get specific applicant"""
    try:
        result = supabase.table('applicants').select('*').eq('id', applicant_id).eq('company_id', user['company_id']).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        return result.data
    except Exception as e:
        logger.error(f"Get applicant error: {str(e)}")
        raise HTTPException(status_code=404, detail="Applicant not found")

@app.put("/api/v1/applicants/{applicant_id}")
async def update_applicant(
    applicant_id: str,
    updates: ApplicantUpdate,
    user: dict = Depends(get_current_user)
):
    """Update applicant"""
    try:
        # Check applicant exists and belongs to company
        existing = supabase.table('applicants').select('id').eq('id', applicant_id).eq('company_id', user['company_id']).single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        # Update applicant
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        result = supabase.table('applicants').update(update_data).eq('id', applicant_id).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'updated_applicant',
            'resource_type': 'applicant',
            'resource_id': applicant_id,
            'details': {'updates': update_data}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Update applicant error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/v1/applicants/{applicant_id}")
async def delete_applicant(
    applicant_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete applicant"""
    try:
        # Check applicant exists and belongs to company
        existing = supabase.table('applicants').select('full_name').eq('id', applicant_id).eq('company_id', user['company_id']).single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        # Delete applicant
        supabase.table('applicants').delete().eq('id', applicant_id).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'deleted_applicant',
            'resource_type': 'applicant',
            'resource_id': applicant_id,
            'details': {'applicant_name': existing.data.get('full_name')}
        }).execute()
        
        return {"message": "Applicant deleted successfully"}
    except Exception as e:
        logger.error(f"Delete applicant error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Project Endpoints
@app.get("/api/v1/projects")
async def get_projects(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    """Get all projects (public endpoint)"""
    try:
        query = supabase.table('projects').select('*, companies(*)')
        
        if search:
            query = query.or_(f"name.ilike.%{search}%,description.ilike.%{search}%,location.ilike.%{search}%")
        
        if status:
            query = query.eq('status', status)
        
        query = query.range(skip, skip + limit - 1)
        result = query.execute()
        
        return {
            "data": result.data,
            "count": len(result.data),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Get projects error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/v1/projects")
@require_role(['developer', 'admin'])
async def create_project(
    project: ProjectCreate,
    user: dict = Depends(get_current_user)
):
    """Create new project (developers only)"""
    try:
        project_data = project.dict()
        project_data['company_id'] = user['company_id']
        
        result = supabase.table('projects').insert(project_data).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'created_project',
            'resource_type': 'project',
            'resource_id': result.data[0]['id'],
            'details': {'project_name': project.name}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Create project error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str):
    """Get specific project (public)"""
    try:
        result = supabase.table('projects').select('*, companies(*)').eq('id', project_id).single().execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return result.data
    except Exception as e:
        logger.error(f"Get project error: {str(e)}")
        raise HTTPException(status_code=404, detail="Project not found")

@app.put("/api/v1/projects/{project_id}")
async def update_project(
    project_id: str,
    updates: ProjectUpdate,
    user: dict = Depends(get_current_user)
):
    """Update project"""
    try:
        # Check project exists and belongs to company
        existing = supabase.table('projects').select('id').eq('id', project_id).eq('company_id', user['company_id']).single().execute()
        
        if not existing.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update project
        update_data = {k: v for k, v in updates.dict().items() if v is not None}
        result = supabase.table('projects').update(update_data).eq('id', project_id).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'updated_project',
            'resource_type': 'project',
            'resource_id': project_id,
            'details': {'updates': update_data}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Update project error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Contact Form Endpoint
@app.post("/api/v1/contact")
async def submit_contact(contact: ContactSubmission):
    """Submit contact form (public)"""
    try:
        # Save to database
        result = supabase.table('contact_submissions').insert(contact.dict()).execute()
        
        # TODO: Send email notification
        # For now, just log it
        logger.info(f"Contact form submission from {contact.email}: {contact.subject}")
        
        return {"message": "Contact form submitted successfully"}
    except Exception as e:
        logger.error(f"Contact submission error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Activities Endpoint
@app.get("/api/v1/activities")
async def get_activities(
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get company activities"""
    try:
        result = supabase.table('activities').select('*, profiles(full_name)').eq('company_id', user['company_id']).order('created_at', desc=True).range(skip, skip + limit - 1).execute()
        
        return {
            "data": result.data,
            "count": len(result.data),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Get activities error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# File Upload Endpoints
@app.post("/api/v1/upload/document")
async def upload_document(
    file: UploadFile = File(...),
    resource_type: str = Form(...),
    resource_id: str = Form(...),
    user: dict = Depends(get_current_user)
):
    """Upload document to Supabase Storage"""
    try:
        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS['documents']:
            raise HTTPException(status_code=400, detail=f"File type {file_ext} not allowed")
        
        # Generate unique filename
        unique_filename = f"{user['company_id']}/{resource_type}/{resource_id}/{datetime.now().isoformat()}_{file.filename}"
        
        # Upload to Supabase Storage
        file_content = await file.read()
        storage_response = supabase.storage.from_('applicant-documents').upload(unique_filename, file_content)
        
        if storage_response.error:
            raise HTTPException(status_code=400, detail="Upload failed")
        
        # Get public URL
        url = supabase.storage.from_('applicant-documents').get_public_url(unique_filename)
        
        return {
            "filename": file.filename,
            "url": url,
            "size": len(file_content),
            "uploaded_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Health check for debugging
@app.get("/api/v1/debug/tables")
async def debug_tables(user: dict = Depends(get_current_user)):
    """Debug endpoint to check table structure"""
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    try:
        tables = ['companies', 'profiles', 'applicants', 'projects', 'activities']
        table_info = {}
        
        for table in tables:
            result = supabase.table(table).select('*').limit(1).execute()
            table_info[table] = {
                "exists": True,
                "sample": result.data[0] if result.data else None
            }
        
        return table_info
    except Exception as e:
        return {"error": str(e)}

# Run the server
if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"🚀 Starting HomeVerse Supabase Backend on port {port}")
    logger.info(f"📍 Supabase URL: {SUPABASE_URL}")
    logger.info(f"🔐 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    uvicorn.run(
        "supabase_backend:app",
        host="0.0.0.0",
        port=port,
        reload=(os.getenv("ENVIRONMENT") == "development")
    )