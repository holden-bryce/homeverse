"""
HomeVerse Production FastAPI Application with PostgreSQL
Simplified version for Render deployment with built-in endpoints
"""

import os
import asyncio
import logging
import json
import uuid
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import uvicorn
import jwt
import asyncpg

# Database imports
try:
    from app.db.postgresql_database import postgresql_db, get_db
except ImportError:
    from app.db.simple_postgresql import postgresql_db, get_db

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
JWT_ALGORITHM = "HS256"

# Logging setup
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Application lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    logger.info("🚀 Starting HomeVerse Production Application...")
    
    try:
        # Initialize PostgreSQL database
        await postgresql_db.initialize()
        logger.info("✅ Database initialized")
        
        logger.info("🎉 Application startup completed")
        
    except Exception as e:
        logger.error(f"❌ Application startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down HomeVerse application...")
    await postgresql_db.close()
    logger.info("✅ Application shutdown completed")

# Create FastAPI application
app = FastAPI(
    title="HomeVerse API",
    description="Affordable Housing Management Platform - Production",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    subject: str
    message: str

class ProjectCreate(BaseModel):
    name: str
    developer: Optional[str] = None
    location: Optional[str] = None
    total_units: Optional[int] = None
    affordable_units: Optional[int] = None
    description: Optional[str] = None

class ApplicantCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    household_size: Optional[int] = None
    annual_income: Optional[float] = None

# Helper functions
def create_jwt_token(user_id: str, email: str, role: str, company_id: str) -> str:
    """Create JWT token"""
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "company_id": company_id,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "HomeVerse Production API v2.0 - PostgreSQL Edition",
        "documentation": "/api/docs",
        "health": "/health",
        "version": "2.0.0"
    }

# Health check endpoints
@app.get("/health")
async def health_check():
    """Application health check"""
    try:
        db_healthy = await postgresql_db.health_check()
        
        return {
            "status": "healthy" if db_healthy else "degraded",
            "database": "connected" if db_healthy else "disconnected",
            "version": "2.0.0",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )

# Authentication endpoints
@app.post("/api/v1/auth/login")
async def login(login_data: LoginRequest, db = Depends(get_db)):
    """User login endpoint"""
    try:
        # Query user from database
        user = await db.fetchrow(
            "SELECT id, email, role, company_id, password_hash FROM users WHERE email = $1",
            login_data.email
        )
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Simple password check (in production, use proper bcrypt)
        if user['password_hash'] != f"hashed_{login_data.password}":
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create token
        token = create_jwt_token(user['id'], user['email'], user['role'], user['company_id'])
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user['id'],
                "email": user['email'],
                "role": user['role'],
                "company_id": user['company_id']
            }
        }
        
    except Exception as e:
        logger.error(f"Login failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# Contact form endpoint
@app.post("/api/v1/contact")
async def submit_contact_form(contact_data: ContactRequest, db = Depends(get_db)):
    """Submit contact form"""
    try:
        # Store in database
        submission_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO contact_submissions (id, name, email, company, phone, subject, message, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            submission_id,
            contact_data.name,
            contact_data.email,
            contact_data.company,
            contact_data.phone,
            contact_data.subject,
            contact_data.message,
            datetime.utcnow()
        )
        
        logger.info(f"Contact form submitted: {contact_data.email}")
        
        return {"message": "Contact form submitted successfully"}
        
    except Exception as e:
        logger.error(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process contact form")

# Projects endpoints
@app.get("/api/v1/projects")
async def get_projects(
    limit: int = 10,
    user_data: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get projects for authenticated user"""
    try:
        company_id = user_data["company_id"]
        
        result = await db.execute(
            text("""
            SELECT * FROM projects 
            WHERE company_id = :company_id 
            ORDER BY created_at DESC 
            LIMIT :limit
            """),
            {"company_id": company_id, "limit": limit}
        )
        
        projects = [dict(row._mapping) for row in result.fetchall()]
        
        # Add demo data for presentation
        demo_projects = [
            {
                "id": "demo_proj_001",
                "name": "Sunset Gardens Phase II",
                "developer": "Urban Housing LLC",
                "location": "San Francisco, CA",
                "total_units": 48,
                "affordable_units": 38,
                "status": "active",
                "completion_date": "2026-06-15",
                "created_at": "2024-01-10T09:00:00Z"
            },
            {
                "id": "demo_proj_002",
                "name": "Mission Bay Affordable Housing",
                "developer": "Bay Area Development",
                "location": "San Francisco, CA",
                "total_units": 65,
                "affordable_units": 52,
                "status": "construction",
                "completion_date": "2025-09-30",
                "created_at": "2024-01-15T10:30:00Z"
            }
        ]
        
        return {"projects": projects + demo_projects}
        
    except Exception as e:
        logger.error(f"Get projects failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch projects")

@app.post("/api/v1/projects")
async def create_project(
    project_data: ProjectCreate,
    user_data: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new project"""
    try:
        project_id = str(uuid.uuid4())
        company_id = user_data["company_id"]
        
        await db.execute(
            text("""
            INSERT INTO projects (id, company_id, name, developer, location, total_units, affordable_units, description, created_at)
            VALUES (:id, :company_id, :name, :developer, :location, :total_units, :affordable_units, :description, :created_at)
            """),
            {
                "id": project_id,
                "company_id": company_id,
                "name": project_data.name,
                "developer": project_data.developer,
                "location": project_data.location,
                "total_units": project_data.total_units,
                "affordable_units": project_data.affordable_units,
                "description": project_data.description,
                "created_at": datetime.utcnow()
            }
        )
        await db.commit()
        
        return {"id": project_id, "message": "Project created successfully"}
        
    except Exception as e:
        logger.error(f"Create project failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create project")

# Applicants endpoints
@app.get("/api/v1/applicants")
async def get_applicants(
    limit: int = 50,
    user_data: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get applicants for authenticated user"""
    try:
        company_id = user_data["company_id"]
        
        result = await db.execute(
            text("""
            SELECT * FROM applicants 
            WHERE company_id = :company_id 
            ORDER BY created_at DESC 
            LIMIT :limit
            """),
            {"company_id": company_id, "limit": limit}
        )
        
        applicants = [dict(row._mapping) for row in result.fetchall()]
        
        return {"applicants": applicants}
        
    except Exception as e:
        logger.error(f"Get applicants failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch applicants")

@app.post("/api/v1/applicants")
async def create_applicant(
    applicant_data: ApplicantCreate,
    user_data: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new applicant"""
    try:
        applicant_id = str(uuid.uuid4())
        company_id = user_data["company_id"]
        
        await db.execute(
            text("""
            INSERT INTO applicants (id, company_id, first_name, last_name, email, phone, household_size, annual_income, created_at)
            VALUES (:id, :company_id, :first_name, :last_name, :email, :phone, :household_size, :annual_income, :created_at)
            """),
            {
                "id": applicant_id,
                "company_id": company_id,
                "first_name": applicant_data.first_name,
                "last_name": applicant_data.last_name,
                "email": applicant_data.email,
                "phone": applicant_data.phone,
                "household_size": applicant_data.household_size,
                "annual_income": applicant_data.annual_income,
                "created_at": datetime.utcnow()
            }
        )
        await db.commit()
        
        return {"id": applicant_id, "message": "Applicant created successfully"}
        
    except Exception as e:
        logger.error(f"Create applicant failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create applicant")

# Analytics endpoints
@app.get("/api/v1/analytics/heatmap")
async def get_heatmap_data(
    user_data: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get heatmap data"""
    # Return demo heatmap data
    return {
        "heatmap_data": {
            "san_francisco": {"demand": 95, "supply": 45, "affordability": 25},
            "oakland": {"demand": 85, "supply": 65, "affordability": 45},
            "san_jose": {"demand": 90, "supply": 40, "affordability": 30},
            "berkeley": {"demand": 80, "supply": 55, "affordability": 40},
            "richmond": {"demand": 70, "supply": 75, "affordability": 60}
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": "An unexpected error occurred. Please try again later."
        }
    )

if __name__ == "__main__":
    # Configuration for direct run
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(
        "app.main_production:app",
        host=host,
        port=port,
        reload=False,
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )