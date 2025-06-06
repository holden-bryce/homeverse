#!/usr/bin/env python3
"""Simplified HomeVerse API for testing"""

from fastapi import FastAPI, HTTPException, Depends
from sqlmodel import SQLModel, create_engine, Session, select
import uvicorn
import os
from typing import List

# Import simplified models
from app.db.simple_models import SimpleCompany, SimpleUser, SimpleApplicant, SimpleProject

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./homeverse_demo.db")
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session

# Create FastAPI app
app = FastAPI(
    title="HomeVerse API",
    description="Affordable Housing Analytics Platform - Simplified Demo",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
def on_startup():
    """Initialize database on startup"""
    create_db_and_tables()
    print("🗄️  Database initialized")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "HomeVerse API is running!",
        "version": "1.0.0",
        "description": "Affordable Housing Analytics Platform",
        "docs": "/docs",
        "features": [
            "Multi-tenant architecture",
            "Company and user management", 
            "Applicant tracking",
            "Project management",
            "RESTful API design"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "homeverse-api",
        "database": "connected" if engine else "disconnected"
    }

# Company endpoints
@app.post("/v1/companies/", response_model=SimpleCompany)
async def create_company(company: SimpleCompany, session: Session = Depends(get_session)):
    """Create a new company"""
    session.add(company)
    session.commit()
    session.refresh(company)
    return company

@app.get("/v1/companies/", response_model=List[SimpleCompany])
async def list_companies(session: Session = Depends(get_session)):
    """List all companies"""
    companies = session.exec(select(SimpleCompany)).all()
    return companies

@app.get("/v1/companies/{company_id}", response_model=SimpleCompany)
async def get_company(company_id: int, session: Session = Depends(get_session)):
    """Get company by ID"""
    company = session.get(SimpleCompany, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

# User endpoints
@app.post("/v1/users/", response_model=SimpleUser)
async def create_user(user: SimpleUser, session: Session = Depends(get_session)):
    """Create a new user"""
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@app.get("/v1/users/", response_model=List[SimpleUser])
async def list_users(session: Session = Depends(get_session)):
    """List all users"""
    users = session.exec(select(SimpleUser)).all()
    return users

# Applicant endpoints
@app.post("/v1/applicants/", response_model=SimpleApplicant)
async def create_applicant(applicant: SimpleApplicant, session: Session = Depends(get_session)):
    """Create a new applicant"""
    session.add(applicant)
    session.commit()
    session.refresh(applicant)
    return applicant

@app.get("/v1/applicants/", response_model=List[SimpleApplicant])
async def list_applicants(session: Session = Depends(get_session)):
    """List all applicants"""
    applicants = session.exec(select(SimpleApplicant)).all()
    return applicants

@app.get("/v1/applicants/{applicant_id}", response_model=SimpleApplicant)
async def get_applicant(applicant_id: int, session: Session = Depends(get_session)):
    """Get applicant by ID"""
    applicant = session.get(SimpleApplicant, applicant_id)
    if not applicant:
        raise HTTPException(status_code=404, detail="Applicant not found")
    return applicant

# Project endpoints
@app.post("/v1/projects/", response_model=SimpleProject)
async def create_project(project: SimpleProject, session: Session = Depends(get_session)):
    """Create a new project"""
    session.add(project)
    session.commit()
    session.refresh(project)
    return project

@app.get("/v1/projects/", response_model=List[SimpleProject])
async def list_projects(session: Session = Depends(get_session)):
    """List all projects"""
    projects = session.exec(select(SimpleProject)).all()
    return projects

@app.get("/v1/projects/{project_id}", response_model=SimpleProject)
async def get_project(project_id: int, session: Session = Depends(get_session)):
    """Get project by ID"""
    project = session.get(SimpleProject, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/v1/demo/seed")
async def seed_demo_data(session: Session = Depends(get_session)):
    """Seed database with demo data"""
    # Create demo company
    demo_company = SimpleCompany(
        key="demo-company",
        name="Demo Housing Authority",
        plan="enterprise",
        seats=50
    )
    session.add(demo_company)
    session.commit()
    session.refresh(demo_company)
    
    # Create demo user
    demo_user = SimpleUser(
        company_id=demo_company.id,
        email="demo@homeverse.com",
        role="admin"
    )
    session.add(demo_user)
    
    # Create demo applicant
    demo_applicant = SimpleApplicant(
        company_id=demo_company.id,
        name="Jane Doe",
        email="jane.doe@example.com",
        household_size=3,
        ami_band="80%"
    )
    session.add(demo_applicant)
    
    # Create demo project
    demo_project = SimpleProject(
        company_id=demo_company.id,
        name="Sunset Gardens Affordable Housing",
        developer_name="Urban Development LLC",
        unit_count=120,
        ami_min=30,
        ami_max=80
    )
    session.add(demo_project)
    
    session.commit()
    
    return {
        "message": "Demo data created successfully!",
        "company_id": demo_company.id,
        "data_created": {
            "companies": 1,
            "users": 1,
            "applicants": 1,
            "projects": 1
        }
    }

if __name__ == "__main__":
    print("🚀 Starting HomeVerse API (Simplified Demo)...")
    print("📊 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    print("🌱 Seed Demo Data: http://localhost:8000/v1/demo/seed")
    
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )