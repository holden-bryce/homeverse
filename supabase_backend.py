#!/usr/bin/env python3
"""HomeVerse Backend with Supabase Integration"""
import os
import logging
import math
import uuid
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
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    income: Optional[float] = None
    household_size: Optional[int] = None
    ami_percent: Optional[float] = None
    location_preference: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ApplicantUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    income: Optional[float] = None
    household_size: Optional[int] = None
    ami_percent: Optional[float] = None
    location_preference: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = None

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    city: str
    state: Optional[str] = "CA"
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_units: int
    affordable_units: Optional[int] = None
    ami_levels: Optional[List[str]] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_units: Optional[int] = None
    affordable_units: Optional[int] = None
    ami_levels: Optional[List[str]] = None
    status: Optional[str] = None

class ContactSubmission(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ApplicationCreate(BaseModel):
    project_id: str
    applicant_id: str
    preferred_move_in_date: Optional[str] = None
    additional_notes: Optional[str] = None
    documents: Optional[List[str]] = []

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    developer_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None

class InvestmentCreate(BaseModel):
    project_id: str
    amount: float
    investment_type: str = "equity"  # equity, debt, grant
    expected_return: Optional[float] = None
    term_months: Optional[int] = None
    notes: Optional[str] = None

class InvestmentUpdate(BaseModel):
    amount: Optional[float] = None
    status: Optional[str] = None
    actual_return: Optional[float] = None
    notes: Optional[str] = None

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

# Matching Algorithm Functions
def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    R = 3961  # Earth radius in miles
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = (math.sin(dlat/2) * math.sin(dlat/2) + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(dlng/2) * math.sin(dlng/2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def calculate_match_score(applicant: Dict, project: Dict) -> Dict:
    """Calculate match score between applicant and project"""
    score = 0
    breakdown = {}
    
    # Income qualification (40% weight)
    applicant_income = applicant.get('income', 0)
    project_max_income = project.get('ami_percentage', 100) * 50000 / 100  # Rough AMI calculation
    
    if applicant_income <= project_max_income:
        income_score = 40
        breakdown['income'] = {'score': 40, 'qualified': True}
    else:
        # Partial score if close
        ratio = project_max_income / applicant_income if applicant_income > 0 else 0
        income_score = min(40, 40 * ratio)
        breakdown['income'] = {'score': income_score, 'qualified': False}
    
    score += income_score
    
    # Location proximity (30% weight)
    applicant_lat = applicant.get('latitude', 0)
    applicant_lng = applicant.get('longitude', 0)
    project_lat = project.get('latitude', 0)
    project_lng = project.get('longitude', 0)
    
    if all([applicant_lat, applicant_lng, project_lat, project_lng]):
        distance = calculate_distance(applicant_lat, applicant_lng, project_lat, project_lng)
        
        if distance <= 5:  # Within 5 miles
            location_score = 30
        elif distance <= 10:  # Within 10 miles
            location_score = 20
        elif distance <= 20:  # Within 20 miles
            location_score = 10
        else:
            location_score = 0
            
        breakdown['location'] = {'score': location_score, 'distance': distance}
    else:
        location_score = 15  # Neutral score if no location data
        breakdown['location'] = {'score': location_score, 'distance': None}
    
    score += location_score
    
    # Household size fit (20% weight)
    household_size = applicant.get('household_size', 1)
    total_units = project.get('total_units', 0)
    
    if total_units > 0:
        # Prefer projects with multiple units for larger households
        if household_size <= 2:
            household_score = 20  # Any project works
        elif household_size <= 4:
            household_score = 20 if total_units >= 50 else 15  # Prefer larger developments
        else:
            household_score = 20 if total_units >= 100 else 10  # Need large developments
    else:
        household_score = 10
    
    breakdown['household'] = {'score': household_score, 'size': household_size}
    score += household_score
    
    # Availability (10% weight)
    available_units = project.get('affordable_units', 0)
    project_status = project.get('status', 'planning')
    
    if project_status == 'active' and available_units > 0:
        availability_score = 10
    elif project_status == 'active':
        availability_score = 5
    else:
        availability_score = 0
    
    breakdown['availability'] = {'score': availability_score, 'status': project_status, 'units': available_units}
    score += availability_score
    
    return {
        'total_score': round(score, 1),
        'match_percentage': round(score, 1),  # Score is already out of 100
        'breakdown': breakdown,
        'recommendation': 'excellent' if score >= 80 else 'good' if score >= 60 else 'fair' if score >= 40 else 'poor'
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
                    "lat": p.get("latitude", 37.7749),
                    "lng": p.get("longitude", -122.4194),
                    "units": p.get("total_units", 0),
                    "affordable_units": p.get("affordable_units", 0),
                    "ami_percentage": 80  # Default AMI percentage
                }
                for p in projects.data or []
            ],
            "demand_zones": [
                {
                    "lat": a.get("latitude", 37.7749),
                    "lng": a.get("longitude", -122.4194),
                    "intensity": 1  # Could be calculated based on household size, income, etc.
                }
                for a in applicants.data or []
                if a.get("latitude") and a.get("longitude")
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
            'details': {'applicant_name': f"{applicant.first_name} {applicant.last_name}"}
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
        project_data = project.dict(exclude_none=True)
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

@app.post("/api/v1/projects/{project_id}/images")
@require_role(['developer', 'admin'])
async def upload_project_image(
    project_id: str,
    file: UploadFile = File(...),
    caption: Optional[str] = Form(None),
    is_primary: Optional[bool] = Form(False),
    user: dict = Depends(get_current_user)
):
    """Upload image for a project"""
    # Verify project exists and belongs to user's company
    project = supabase.table('projects').select('*').eq('id', project_id).eq('company_id', user['company_id']).execute()
    if not project.data:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if file.size > 5 * 1024 * 1024:  # 5MB limit for images
        raise HTTPException(status_code=400, detail="Image too large (max 5MB)")
    
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images allowed")
    
    try:
        # Generate unique filename
        file_extension = file.filename.split('.')[-1]
        unique_filename = f"projects/{project_id}/{uuid.uuid4()}.{file_extension}"
        
        # Upload to Supabase storage
        file_content = await file.read()
        
        # Create bucket if it doesn't exist
        try:
            supabase.storage.create_bucket('project-images', public=True)
        except:
            pass  # Bucket might already exist
        
        result = supabase.storage.from_('project-images').upload(
            unique_filename,
            file_content,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        image_url = supabase.storage.from_('project-images').get_public_url(unique_filename)
        
        # For now, store in the images array in the project record
        # Update project with new image
        project_data = project.data[0]
        images = project_data.get('images', []) or []
        new_image = {
            "id": str(uuid.uuid4()),
            "url": image_url,
            "caption": caption,
            "is_primary": is_primary,
            "uploaded_at": datetime.now().isoformat()
        }
        
        # If this is primary, unset other primary images
        if is_primary:
            for img in images:
                img['is_primary'] = False
        
        images.append(new_image)
        
        # Update project
        supabase.table('projects').update({"images": images}).eq('id', project_id).execute()
        
        return {
            "id": new_image['id'],
            "url": image_url,
            "caption": caption,
            "is_primary": is_primary,
            "filename": file.filename
        }
    except Exception as e:
        logger.error(f"Image upload error: {str(e)}")
        raise HTTPException(status_code=500, detail="Image upload failed")

@app.get("/api/v1/projects/{project_id}/images")
async def get_project_images(project_id: str):
    """Get all images for a project (public)"""
    try:
        project = supabase.table('projects').select('images').eq('id', project_id).execute()
        if project.data:
            return project.data[0].get('images', [])
        return []
    except Exception as e:
        logger.error(f"Error fetching project images: {e}")
        return []

@app.delete("/api/v1/projects/{project_id}/images/{image_id}")
@require_role(['developer', 'admin'])
async def delete_project_image(
    project_id: str,
    image_id: str,
    user: dict = Depends(get_current_user)
):
    """Delete a project image"""
    try:
        # Verify project belongs to user's company
        project = supabase.table('projects').select('*').eq('id', project_id).eq('company_id', user['company_id']).execute()
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Remove image from array
        images = project.data[0].get('images', []) or []
        images = [img for img in images if img.get('id') != image_id]
        
        # Update project
        supabase.table('projects').update({"images": images}).eq('id', project_id).execute()
        
        return {"message": "Image deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting image: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete image")

# Matching and Application Endpoints

@app.get("/api/v1/applicants/{applicant_id}/matches")
async def get_applicant_matches(applicant_id: str, user: dict = Depends(get_current_user)):
    """Get matched projects for an applicant"""
    try:
        # Get applicant data
        applicant = supabase.table('applicants').select('*').eq('id', applicant_id).single().execute()
        if not applicant.data:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        # Get all active projects
        projects = supabase.table('projects').select('*').eq('status', 'active').execute()
        
        # Calculate matches
        matches = []
        for project in projects.data or []:
            match_info = calculate_match_score(applicant.data, project)
            matches.append({
                'project': project,
                'match_score': match_info['match_percentage'],
                'recommendation': match_info['recommendation'],
                'breakdown': match_info['breakdown']
            })
        
        # Sort by match score
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return {
            'applicant_id': applicant_id,
            'total_matches': len(matches),
            'matches': matches[:20]  # Return top 20 matches
        }
    except Exception as e:
        logger.error(f"Error getting matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get matches")

@app.get("/api/v1/projects/{project_id}/matches")
async def get_project_matches(project_id: str, user: dict = Depends(get_current_user)):
    """Get matched applicants for a project"""
    if user.get('role') not in ['developer', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Get project data
        project = supabase.table('projects').select('*').eq('id', project_id).single().execute()
        if not project.data:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all applicants
        applicants = supabase.table('applicants').select('*').execute()
        
        # Calculate matches
        matches = []
        for applicant in applicants.data or []:
            match_info = calculate_match_score(applicant, project.data)
            matches.append({
                'applicant': applicant,
                'match_score': match_info['match_percentage'],
                'recommendation': match_info['recommendation'],
                'breakdown': match_info['breakdown']
            })
        
        # Sort by match score and filter for good matches
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        good_matches = [m for m in matches if m['match_score'] >= 50]  # Only show decent matches
        
        return {
            'project_id': project_id,
            'total_matches': len(good_matches),
            'matches': good_matches[:50]  # Return top 50 matches
        }
    except Exception as e:
        logger.error(f"Error getting project matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get project matches")

# Application Management Endpoints

@app.post("/api/v1/applications")
async def create_application(application: ApplicationCreate, user: dict = Depends(get_current_user)):
    """Create a new application"""
    try:
        application_data = application.dict()
        application_data.update({
            'id': str(uuid.uuid4()),
            'company_id': user['company_id'],
            'status': 'submitted',
            'submitted_at': datetime.now().isoformat(),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
        
        result = supabase.table('applications').insert(application_data).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'created_application',
            'resource_type': 'application',
            'resource_id': result.data[0]['id'],
            'details': {'project_id': application.project_id, 'applicant_id': application.applicant_id}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Create application error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/applications")
async def get_applications(
    user: dict = Depends(get_current_user),
    status: Optional[str] = None,
    project_id: Optional[str] = None,
    applicant_id: Optional[str] = None
):
    """Get applications with optional filtering"""
    try:
        query = supabase.table('applications').select('*, projects(name), applicants(first_name, last_name)')
        
        if status:
            query = query.eq('status', status)
        if project_id:
            query = query.eq('project_id', project_id)
        if applicant_id:
            query = query.eq('applicant_id', applicant_id)
        
        # Role-based filtering
        if user.get('role') == 'applicant':
            # Applicants can only see their own applications
            query = query.eq('applicant_id', user['id'])
        elif user.get('role') == 'developer':
            # Developers can see applications for their company's projects
            query = query.eq('company_id', user['company_id'])
        elif user.get('role') not in ['admin', 'lender']:
            query = query.eq('company_id', user['company_id'])
        
        result = query.order('created_at', desc=True).execute()
        return {"data": result.data or [], "count": len(result.data or [])}
    except Exception as e:
        logger.error(f"Get applications error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get applications")

@app.patch("/api/v1/applications/{application_id}")
@require_role(['developer', 'admin'])
async def update_application(
    application_id: str,
    update_data: ApplicationUpdate,
    user: dict = Depends(get_current_user)
):
    """Update application status (developers only)"""
    try:
        # Verify application exists
        app = supabase.table('applications').select('*').eq('id', application_id).single().execute()
        if not app.data:
            raise HTTPException(status_code=404, detail="Application not found")
        
        update_dict = update_data.dict(exclude_none=True)
        update_dict.update({
            'updated_at': datetime.now().isoformat(),
            'reviewed_by': user['id'],
            'reviewed_at': datetime.now().isoformat()
        })
        
        result = supabase.table('applications').update(update_dict).eq('id', application_id).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'updated_application',
            'resource_type': 'application',
            'resource_id': application_id,
            'details': {'status': update_data.status, 'notes': update_data.developer_notes}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Update application error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Investment Management Endpoints

@app.post("/api/v1/investments")
@require_role(['lender', 'admin'])
async def create_investment(investment: InvestmentCreate, user: dict = Depends(get_current_user)):
    """Create a new investment (lenders only)"""
    try:
        investment_data = investment.dict()
        investment_data.update({
            'id': str(uuid.uuid4()),
            'lender_id': user['id'],
            'company_id': user['company_id'],
            'status': 'active',
            'invested_at': datetime.now().isoformat(),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        })
        
        result = supabase.table('investments').insert(investment_data).execute()
        
        # Log activity
        supabase.table('activities').insert({
            'company_id': user['company_id'],
            'user_id': user['id'],
            'action': 'created_investment',
            'resource_type': 'investment',
            'resource_id': result.data[0]['id'],
            'details': {'project_id': investment.project_id, 'amount': investment.amount}
        }).execute()
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Create investment error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/investments")
async def get_investments(
    user: dict = Depends(get_current_user),
    project_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get investments with optional filtering"""
    try:
        query = supabase.table('investments').select('*, projects(name, total_units), profiles(full_name)')
        
        if project_id:
            query = query.eq('project_id', project_id)
        if status:
            query = query.eq('status', status)
        
        # Role-based filtering
        if user.get('role') == 'lender':
            query = query.eq('lender_id', user['id'])
        elif user.get('role') == 'developer':
            # Developers can see investments in their projects
            query = query.eq('company_id', user['company_id'])
        elif user.get('role') not in ['admin']:
            query = query.eq('company_id', user['company_id'])
        
        result = query.order('created_at', desc=True).execute()
        return {"data": result.data or [], "count": len(result.data or [])}
    except Exception as e:
        logger.error(f"Get investments error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get investments")

@app.get("/api/v1/lenders/portfolio")
@require_role(['lender', 'admin'])
async def get_lender_portfolio(user: dict = Depends(get_current_user)):
    """Get lender's investment portfolio with analytics"""
    try:
        # Get all investments for this lender
        investments = supabase.table('investments').select('*, projects(*)').eq('lender_id', user['id']).execute()
        
        portfolio_data = {
            'total_investments': len(investments.data or []),
            'total_amount': sum(inv['amount'] for inv in investments.data or []),
            'active_investments': len([inv for inv in investments.data or [] if inv['status'] == 'active']),
            'total_units': sum(inv['projects']['total_units'] for inv in investments.data or [] if inv.get('projects')),
            'total_affordable_units': sum(inv['projects']['affordable_units'] for inv in investments.data or [] if inv.get('projects')),
            'investments': investments.data or []
        }
        
        # Calculate portfolio performance
        total_expected_return = sum(
            inv['amount'] * (inv.get('expected_return', 0) / 100) 
            for inv in investments.data or []
        )
        
        portfolio_data['expected_annual_return'] = total_expected_return
        portfolio_data['expected_roi'] = (
            total_expected_return / portfolio_data['total_amount'] * 100 
            if portfolio_data['total_amount'] > 0 else 0
        )
        
        return portfolio_data
    except Exception as e:
        logger.error(f"Get portfolio error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get portfolio")

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