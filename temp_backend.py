#!/usr/bin/env python3
"""Temporary simplified HomeVerse backend to bypass RLS issues"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, List, Any
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import uvicorn
from supabase import create_client, Client
import jwt

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    logger.warning("Missing Supabase configuration - using mock mode")
    MOCK_MODE = True
else:
    MOCK_MODE = False
    # Initialize Supabase client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    logger.info("✅ Supabase client initialized")

# FastAPI app
app = FastAPI(title="HomeVerse API (Temp)", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Mock data for testing
MOCK_USERS = {
    "admin@test.com": {
        "id": "40e47137-78fd-4db6-a195-ba3aadc67eda",
        "email": "admin@test.com",
        "role": "admin",
        "full_name": "Admin User",
        "company_id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
        "companies": {
            "id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
            "name": "Default Company",
            "plan": "trial",
            "seats": 100
        }
    },
    "developer@test.com": {
        "id": "50e47137-78fd-4db6-a195-ba3aadc67edb",
        "email": "developer@test.com",
        "role": "developer",
        "full_name": "Developer User",
        "company_id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
        "companies": {
            "id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
            "name": "Default Company",
            "plan": "trial",
            "seats": 100
        }
    },
    "lender@test.com": {
        "id": "60e47137-78fd-4db6-a195-ba3aadc67edc",
        "email": "lender@test.com",
        "role": "lender",
        "full_name": "Lender User",
        "company_id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
        "companies": {
            "id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
            "name": "Default Company",
            "plan": "trial",
            "seats": 100
        }
    },
    "buyer@test.com": {
        "id": "70e47137-78fd-4db6-a195-ba3aadc67edd",
        "email": "buyer@test.com",
        "role": "buyer",
        "full_name": "Buyer User",
        "company_id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
        "companies": {
            "id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
            "name": "Default Company",
            "plan": "trial",
            "seats": 100
        }
    },
    "applicant@test.com": {
        "id": "80e47137-78fd-4db6-a195-ba3aadc67ede",
        "email": "applicant@test.com",
        "role": "applicant",
        "full_name": "Applicant User",
        "company_id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
        "companies": {
            "id": "fc81eaca-9f77-4265-b2b1-c5ff71ce43a8",
            "name": "Default Company",
            "plan": "trial",
            "seats": 100
        }
    }
}

# Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Simple auth function for testing
async def get_current_user_simple(request: Request):
    """Simple auth that returns mock user based on email"""
    # Check for Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # For testing, just extract email from a simple token
    token = auth_header.replace("Bearer ", "")
    
    # Simple mock: token is just the email
    email = token
    if email in MOCK_USERS:
        return MOCK_USERS[email]
    
    raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if MOCK_MODE:
        return {
            "status": "healthy", 
            "database": "mock_mode",
            "message": "Running in mock mode for development"
        }
    
    try:
        # Simple test query
        result = supabase.table('companies').select('id').limit(1).execute()
        return {
            "status": "healthy", 
            "database": "connected",
            "companies_found": len(result.data) if result.data else 0
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "database": "disconnected",
            "error": str(e)
        }

@app.post("/auth/login")
async def login(request: LoginRequest):
    """Simple login for testing"""
    email = str(request.email)
    password = request.password
    
    # For testing, accept password123 for any test user
    if email in MOCK_USERS and password == "password123":
        user_data = MOCK_USERS[email]
        
        # Return simple token (just email for now)
        return {
            "access_token": email,
            "token_type": "bearer",
            "user": user_data
        }
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/auth/user")
async def get_current_user_info(user: dict = Depends(get_current_user_simple)):
    """Get current user information"""
    return user

@app.get("/api/v1/users/me")
async def get_me(user: dict = Depends(get_current_user_simple)):
    """Get current user info"""
    return user

@app.get("/api/v1/applicants")
async def get_applicants(user: dict = Depends(get_current_user_simple)):
    """Get mock applicants"""
    return [
        {
            "id": "app1",
            "full_name": "John Doe",
            "email": "john@example.com",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        },
        {
            "id": "app2", 
            "full_name": "Jane Smith",
            "email": "jane@example.com",
            "status": "active",
            "created_at": "2024-01-02T00:00:00Z"
        }
    ]

@app.get("/api/v1/projects")
async def get_projects(user: dict = Depends(get_current_user_simple)):
    """Get mock projects"""
    return [
        {
            "id": "proj1",
            "name": "Sunset Gardens",
            "description": "Affordable housing development",
            "location": "Downtown",
            "total_units": 50,
            "available_units": 25,
            "status": "active"
        },
        {
            "id": "proj2",
            "name": "River View Apartments",
            "description": "Mixed-income housing",
            "location": "Riverside",
            "total_units": 100,
            "available_units": 40,
            "status": "active"
        }
    ]

@app.get("/api/v1/activities")
async def get_activities(user: dict = Depends(get_current_user_simple)):
    """Get mock activities"""
    return [
        {
            "id": "act1",
            "type": "application",
            "title": "New application submitted",
            "description": "John Doe submitted application for Sunset Gardens",
            "timestamp": "2024-01-01T12:00:00Z",
            "status": "info"
        }
    ]

if __name__ == "__main__":
    print("🚀 Starting HomeVerse Temporary Backend...")
    print("   Mode: Mock Mode" if MOCK_MODE else "   Mode: Supabase Connected")
    print("   URL: http://localhost:8000")
    print("   Docs: http://localhost:8000/docs")
    print("   Health: http://localhost:8000/health")
    print("\n📝 Test Credentials:")
    for email in MOCK_USERS.keys():
        print(f"   {email} / password123")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)