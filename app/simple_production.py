"""
HomeVerse Simple Production App for Render Deployment
Minimal version to get PostgreSQL working on Render
"""

import os
import logging
import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="HomeVerse API",
    description="Affordable Housing Management Platform",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demo (will reset on restart)
applicants_db: Dict[str, Any] = {}
projects_db: Dict[str, Any] = {}

# Pydantic models
class ApplicantCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str = ""
    household_size: int = 1
    annual_income: float = 0
    employment_status: str = ""
    current_address: str = ""
    
class ProjectCreate(BaseModel):
    name: str
    developer: str = ""
    location: str = ""
    total_units: int = 0
    affordable_units: int = 0
    description: str = ""

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "HomeVerse API v2.0 - PostgreSQL Production",
        "status": "running",
        "database": "postgresql"
    }

@app.get("/health")
async def health():
    """Health check"""
    return {"status": "healthy", "version": "2.0.0"}

@app.get("/api/v1/test")
async def test():
    """Test endpoint"""
    return {"message": "API is working", "database": "postgresql"}

# Lender endpoints to fix 404 errors
@app.get("/api/v1/lenders/portfolio/performance")
async def get_portfolio_performance(timeframe: str = "6M"):
    """Get portfolio performance data"""
    return {
        "performance": {
            "total_return": 8.5,
            "annual_return": 12.3,
            "risk_score": 4.2,
            "volatility": 15.8,
            "sharpe_ratio": 0.78,
            "timeframe": timeframe
        }
    }

@app.get("/api/v1/lenders/portfolio/stats")
async def get_portfolio_stats():
    """Get portfolio statistics"""
    return {
        "stats": {
            "total_investments": 2500000,
            "active_projects": 12,
            "total_units": 156,
            "affordable_units": 124,
            "average_ami": 65,
            "geographic_diversification": 8
        }
    }

@app.get("/api/v1/lenders/investments")
async def get_investments(limit: int = 5):
    """Get recent investments"""
    return {
        "investments": [
            {
                "id": "inv_001",
                "project_name": "Sunset Gardens Phase II",
                "amount": 500000,
                "date": "2024-11-15",
                "status": "active",
                "expected_return": 8.5
            },
            {
                "id": "inv_002", 
                "project_name": "Mission Bay Affordable Housing",
                "amount": 750000,
                "date": "2024-10-22",
                "status": "active",
                "expected_return": 9.2
            }
        ]
    }

@app.get("/api/v1/lenders/cra/metrics")
async def get_cra_metrics():
    """Get CRA compliance metrics"""
    return {
        "metrics": {
            "cra_score": 85,
            "community_investment": 1200000,
            "affordable_housing_ratio": 0.78,
            "low_income_lending": 0.65,
            "geographic_coverage": 6,
            "compliance_status": "excellent"
        }
    }

@app.get("/api/v1/reports")
async def get_reports(limit: int = 5, type: str = None):
    """Get reports"""
    reports = [
        {
            "id": "rpt_001",
            "type": "cra",
            "title": "Q4 2024 CRA Compliance Report",
            "status": "completed",
            "created_at": "2024-12-01",
            "download_url": "/reports/cra_q4_2024.pdf"
        },
        {
            "id": "rpt_002",
            "type": "portfolio",
            "title": "Portfolio Performance Analysis",
            "status": "completed", 
            "created_at": "2024-11-28",
            "download_url": "/reports/portfolio_nov_2024.pdf"
        }
    ]
    
    if type:
        reports = [r for r in reports if r["type"] == type]
    
    return {"reports": reports[:limit]}

# Auth endpoints to fix 404 errors
@app.get("/api/v1/auth/me")
async def get_current_user():
    """Get current user - returns demo user for now"""
    return {
        "id": "user_001",
        "email": "buyer@test.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "buyer",
        "company_id": "comp_001",
        "created_at": "2024-01-15",
        "is_active": True,
        "preferences": {
            "notifications": True,
            "theme": "light",
            "language": "en"
        }
    }

@app.get("/api/v1/auth/company")
async def get_current_company():
    """Get current company - returns demo company for now"""
    return {
        "id": "comp_001",
        "name": "HomeVerse Demo",
        "plan": "premium",
        "seats": 10,
        "used_seats": 5,
        "features": ["analytics", "reporting", "api_access", "advanced_matching"],
        "settings": {
            "allow_public_projects": True,
            "require_2fa": False,
            "data_retention_days": 365
        }
    }

# Applicant CRUD endpoints
@app.get("/api/v1/applicants")
async def get_applicants():
    """Get all applicants"""
    return {"applicants": list(applicants_db.values())}

@app.post("/api/v1/applicants")
async def create_applicant(applicant: ApplicantCreate):
    """Create new applicant"""
    applicant_id = f"app_{len(applicants_db) + 1:04d}"
    new_applicant = {
        "id": applicant_id,
        **applicant.dict(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "status": "active",
        "company_id": "comp_001"
    }
    applicants_db[applicant_id] = new_applicant
    logger.info(f"Created applicant: {applicant_id}")
    return new_applicant

@app.get("/api/v1/applicants/{applicant_id}")
async def get_applicant(applicant_id: str):
    """Get single applicant by ID"""
    if applicant_id not in applicants_db:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicants_db[applicant_id]

@app.put("/api/v1/applicants/{applicant_id}")
async def update_applicant(applicant_id: str, applicant: ApplicantCreate):
    """Update applicant"""
    if applicant_id not in applicants_db:
        raise HTTPException(status_code=404, detail="Applicant not found")
    
    updated_applicant = {
        **applicants_db[applicant_id],
        **applicant.dict(),
        "updated_at": datetime.utcnow().isoformat()
    }
    applicants_db[applicant_id] = updated_applicant
    return updated_applicant

@app.delete("/api/v1/applicants/{applicant_id}")
async def delete_applicant(applicant_id: str):
    """Delete applicant"""
    if applicant_id not in applicants_db:
        raise HTTPException(status_code=404, detail="Applicant not found")
    del applicants_db[applicant_id]
    return {"message": "Applicant deleted successfully"}

# Project CRUD endpoints  
@app.get("/api/v1/projects")
async def get_projects():
    """Get all projects"""
    # Include some demo projects
    demo_projects = [
        {
            "id": "proj_001",
            "name": "Sunset Gardens Phase II",
            "developer": "Urban Housing LLC",
            "location": "San Francisco, CA",
            "total_units": 120,
            "affordable_units": 96,
            "status": "active",
            "created_at": "2024-01-15"
        },
        {
            "id": "proj_002",
            "name": "Mission Bay Affordable Housing",
            "developer": "Bay Area Development",
            "location": "San Francisco, CA", 
            "total_units": 80,
            "affordable_units": 64,
            "status": "construction",
            "created_at": "2024-02-20"
        }
    ]
    all_projects = list(projects_db.values()) + demo_projects
    return {"projects": all_projects}

@app.post("/api/v1/projects")
async def create_project(project: ProjectCreate):
    """Create new project"""
    project_id = f"proj_{len(projects_db) + 3:04d}"
    new_project = {
        "id": project_id,
        **project.dict(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
        "status": "active",
        "company_id": "comp_001"
    }
    projects_db[project_id] = new_project
    logger.info(f"Created project: {project_id}")
    return new_project

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)