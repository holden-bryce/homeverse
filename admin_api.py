#!/usr/bin/env python3
"""Admin API for AI Agent Integration"""
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, List
import os
from supabase_admin_agent import SupabaseAdminAgent
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HomeVerse Admin API", version="1.0.0")

# Simple API key authentication
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "your-secret-admin-key")

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return x_api_key

# Request models
class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    role: str = "buyer"
    full_name: Optional[str] = None
    company_key: str = "demo-company-2024"

class CreateApplicantRequest(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    income: Optional[float] = None
    household_size: Optional[int] = None
    company_key: str = "demo-company-2024"

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    total_units: Optional[int] = None
    available_units: Optional[int] = None
    ami_percentage: Optional[int] = None
    company_key: str = "demo-company-2024"

class CreateCompanyRequest(BaseModel):
    key: str
    name: str
    plan: str = "trial"
    seats: int = 10

# Initialize agent
agent = SupabaseAdminAgent()

@app.get("/")
async def root():
    return {"message": "HomeVerse Admin API", "status": "ready"}

@app.get("/health")
async def health_check():
    return agent.check_health()

@app.post("/users", dependencies=[Depends(verify_api_key)])
async def create_user(request: CreateUserRequest):
    """Create a new user with authentication and profile"""
    result = agent.create_user(
        email=request.email,
        password=request.password,
        role=request.role,
        full_name=request.full_name,
        company_key=request.company_key
    )
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error'))
    
    return result

@app.post("/users/batch", dependencies=[Depends(verify_api_key)])
async def create_multiple_users(users: List[CreateUserRequest]):
    """Create multiple users at once"""
    results = []
    for user in users:
        result = agent.create_user(
            email=user.email,
            password=user.password,
            role=user.role,
            full_name=user.full_name,
            company_key=user.company_key
        )
        results.append(result)
    
    return {
        "total": len(users),
        "successful": sum(1 for r in results if r['success']),
        "failed": sum(1 for r in results if not r['success']),
        "results": results
    }

@app.get("/users", dependencies=[Depends(verify_api_key)])
async def list_users():
    """List all users with profiles"""
    return agent.list_users()

@app.post("/applicants", dependencies=[Depends(verify_api_key)])
async def create_applicant(request: CreateApplicantRequest):
    """Create a new applicant"""
    result = agent.create_applicant(
        full_name=request.full_name,
        email=request.email,
        phone=request.phone,
        income=request.income,
        household_size=request.household_size,
        company_key=request.company_key
    )
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error'))
    
    return result

@app.post("/projects", dependencies=[Depends(verify_api_key)])
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    result = agent.create_project(
        name=request.name,
        description=request.description,
        location=request.location,
        total_units=request.total_units,
        available_units=request.available_units,
        ami_percentage=request.ami_percentage,
        company_key=request.company_key
    )
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error'))
    
    return result

@app.post("/companies", dependencies=[Depends(verify_api_key)])
async def create_company(request: CreateCompanyRequest):
    """Create a new company"""
    try:
        result = agent.ensure_company_exists(
            company_key=request.key,
            name=request.name
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/setup/test-users", dependencies=[Depends(verify_api_key)])
async def setup_test_users():
    """Create all test users"""
    results = agent.create_test_users()
    return {
        "message": "Test users creation completed",
        "results": results
    }

# AI Agent friendly endpoints
@app.post("/ai/onboard-user")
async def ai_onboard_user(
    email: EmailStr,
    role: str = "buyer",
    company_name: Optional[str] = None,
    api_key: str = Header(None, alias="X-API-Key")
):
    """Simplified endpoint for AI agents to onboard new users"""
    if api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    
    # Generate temporary password
    import secrets
    temp_password = f"Welcome{secrets.randbelow(9999):04d}!"
    
    # Create company if needed
    company_key = company_name.lower().replace(' ', '-') if company_name else "demo-company-2024"
    if company_name:
        agent.ensure_company_exists(company_key, company_name)
    
    # Create user
    result = agent.create_user(
        email=email,
        password=temp_password,
        role=role,
        company_key=company_key
    )
    
    if not result['success']:
        raise HTTPException(status_code=400, detail=result.get('error'))
    
    return {
        "success": True,
        "email": email,
        "temporary_password": temp_password,
        "role": role,
        "company": company_name or "Demo Company",
        "login_url": "https://homeverse-frontend.onrender.com/auth/login",
        "message": f"User created successfully. They can login with email: {email} and password: {temp_password}"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("ADMIN_PORT", "8001"))
    print(f"🚀 Starting Admin API on port {port}")
    print(f"📍 API Key required: X-API-Key header")
    uvicorn.run("admin_api:app", host="0.0.0.0", port=port, reload=True)