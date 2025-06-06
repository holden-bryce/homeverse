#!/usr/bin/env python3
"""Simplified backend for testing the frontend"""
import os
from datetime import datetime, timedelta
from typing import Optional
import sqlite3
import hashlib
import json
import uuid

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
import uvicorn
import jwt

# Configuration
DATABASE_PATH = "homeverse_demo.db"
JWT_SECRET = "your-secret-key-here-for-testing"
JWT_ALGORITHM = "HS256"

app = FastAPI(title="Homeverse API", version="1.0.0")
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Database setup
def init_db():
    """Initialize SQLite database with tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Companies table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            plan TEXT DEFAULT 'basic',
            seats INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id)
        )
    """)
    
    conn.commit()
    conn.close()

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    company_key: str
    role: str = "user"

class UserCreate(BaseModel):
    email: str
    password: str
    role: str
    company_id: str

# Utility functions
def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == hashed

def create_access_token(data: dict) -> str:
    """Create JWT token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Database operations
def get_or_create_company(conn, company_key: str):
    """Get or create company by key"""
    cursor = conn.cursor()
    
    # Try to get existing company
    cursor.execute("SELECT * FROM companies WHERE key = ?", (company_key,))
    company = cursor.fetchone()
    
    if not company:
        # Create new company
        company_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO companies (id, key, name, plan, seats) 
            VALUES (?, ?, ?, ?, ?)
        """, (company_id, company_key, f"Company {company_key}", "basic", 10))
        conn.commit()
        
        cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
        company = cursor.fetchone()
    
    return dict(company)

def create_user(conn, email: str, password: str, company_id: str, role: str = "user"):
    """Create new user"""
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="User already exists")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    
    cursor.execute("""
        INSERT INTO users (id, company_id, email, hashed_password, role)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, company_id, email, hashed_pw, role))
    
    conn.commit()
    return {"id": user_id, "email": email, "role": role, "company_id": company_id}

def get_user_by_email(conn, email: str):
    """Get user by email"""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    return dict(user) if user else None

def verify_user_credentials(conn, email: str, password: str):
    """Verify user login credentials"""
    user = get_user_by_email(conn, email)
    if not user:
        return None
    
    if verify_password(password, user['hashed_password']):
        return user
    return None

# API Routes
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.options("/api/v1/{path:path}")
async def handle_options():
    """Handle CORS preflight for all API routes"""
    return {"message": "OK"}

@app.post("/api/v1/auth/register")
async def register(request: RegisterRequest, conn=Depends(get_db)):
    """Register new user"""
    # Get or create company
    company = get_or_create_company(conn, request.company_key)
    
    # Create user
    user = create_user(conn, request.email, request.password, company['id'], request.role)
    
    return {"message": "User created successfully", "user_id": user['id']}

@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, conn=Depends(get_db)):
    """Login user"""
    user = verify_user_credentials(conn, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    token_data = {"sub": user['id'], "email": user['email'], "role": user['role']}
    access_token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user['id'],
            "email": user['email'],
            "role": user['role'],
            "company_id": user['company_id']
        }
    )

@app.get("/api/v1/auth/me")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), conn=Depends(get_db)):
    """Get current user info"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_by_email(conn, payload.get("email"))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return {
        "id": user['id'],
        "email": user['email'],
        "role": user['role'],
        "company_id": user['company_id']
    }

@app.get("/api/v1/auth/company")
async def get_current_company(credentials: HTTPAuthorizationCredentials = Depends(security), conn=Depends(get_db)):
    """Get current user's company info"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("email") is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = get_user_by_email(conn, payload.get("email"))
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Get company info
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM companies WHERE id = ?", (user['company_id'],))
    company = cursor.fetchone()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company['id'],
        "key": company['key'],
        "name": company['name'],
        "plan": company['plan'],
        "seats": company['seats']
    }

# Lender Portal Endpoints
@app.get("/api/v1/lenders/portfolio/stats")
async def get_portfolio_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get lender portfolio statistics"""
    return {
        "total_invested": 2500000,
        "current_portfolio_value": 2680000,
        "average_roi": 7.2,
        "active_investments": 12,
        "total_return": 180000,
        "annualized_return": 8.1,
        "compliance_rate": 85.6
    }

@app.get("/api/v1/lenders/investments")
async def get_investments(limit: int = 10, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get recent investments"""
    return [
        {
            "id": "inv_001",
            "project_name": "Sunset Gardens Phase II",
            "developer": "Urban Housing LLC",
            "location": "San Francisco, CA",
            "investment_amount": 750000,
            "date_invested": "2024-11-15",
            "current_value": 810000,
            "roi": 8.0,
            "status": "active",
            "ami_compliance": 94.2,
            "units_funded": 48,
            "completion_date": "2025-08-30",
            "risk_level": "low"
        },
        {
            "id": "inv_002", 
            "project_name": "Mission Bay Affordable",
            "developer": "Bay Area Development",
            "location": "San Francisco, CA",
            "investment_amount": 1200000,
            "date_invested": "2024-10-22",
            "current_value": 1290000,
            "roi": 7.5,
            "status": "active",
            "ami_compliance": 91.8,
            "units_funded": 65,
            "completion_date": "2025-12-15",
            "risk_level": "medium"
        },
        {
            "id": "inv_003",
            "project_name": "Richmond Commons",
            "developer": "Community Builders Inc",
            "location": "Richmond, CA",
            "investment_amount": 550000,
            "date_invested": "2024-09-30",
            "current_value": 584000,
            "roi": 6.2,
            "status": "completed",
            "ami_compliance": 96.5,
            "units_funded": 32,
            "completion_date": "2024-11-30",
            "risk_level": "low"
        },
        {
            "id": "inv_004",
            "project_name": "Oakland Family Housing",
            "developer": "East Bay Housing Corp",
            "location": "Oakland, CA",
            "investment_amount": 920000,
            "date_invested": "2024-08-12",
            "current_value": 975000,
            "roi": 6.0,
            "status": "active",
            "ami_compliance": 88.3,
            "units_funded": 42,
            "completion_date": "2025-06-30",
            "risk_level": "medium"
        },
        {
            "id": "inv_005",
            "project_name": "Daly City Seniors",
            "developer": "Senior Living Partners",
            "location": "Daly City, CA",
            "investment_amount": 680000,
            "date_invested": "2024-07-18",
            "current_value": 715000,
            "roi": 5.1,
            "status": "active",
            "ami_compliance": 92.7,
            "units_funded": 28,
            "completion_date": "2025-04-15",
            "risk_level": "low"
        }
    ][:limit]

@app.get("/api/v1/lenders/portfolio/performance")
async def get_portfolio_performance(timeframe: str = "1Y", credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get portfolio performance data"""
    if timeframe == "6M":
        return [
            {"date": "2024-06-01", "current_value": 2100000, "invested": 2000000, "roi": 6.1},
            {"date": "2024-07-01", "current_value": 2250000, "invested": 2100000, "roi": 6.4},
            {"date": "2024-08-01", "current_value": 2180000, "invested": 2050000, "roi": 6.2},
            {"date": "2024-09-01", "current_value": 2320000, "invested": 2170000, "roi": 6.8},
            {"date": "2024-10-01", "current_value": 2410000, "invested": 2250000, "roi": 7.0},
            {"date": "2024-11-01", "current_value": 2500000, "invested": 2330000, "roi": 7.2}
        ]
    else:  # 1Y default
        return [
            {"date": "2024-01-01", "current_value": 1800000, "invested": 1710000, "roi": 5.2},
            {"date": "2024-02-01", "current_value": 1850000, "invested": 1750000, "roi": 5.4},
            {"date": "2024-03-01", "current_value": 1920000, "invested": 1810000, "roi": 5.8},
            {"date": "2024-04-01", "current_value": 1980000, "invested": 1870000, "roi": 5.9},
            {"date": "2024-05-01", "current_value": 2050000, "invested": 1930000, "roi": 6.0},
            {"date": "2024-06-01", "current_value": 2100000, "invested": 2000000, "roi": 6.1},
            {"date": "2024-07-01", "current_value": 2250000, "invested": 2100000, "roi": 6.4},
            {"date": "2024-08-01", "current_value": 2180000, "invested": 2050000, "roi": 6.2},
            {"date": "2024-09-01", "current_value": 2320000, "invested": 2170000, "roi": 6.8},
            {"date": "2024-10-01", "current_value": 2410000, "invested": 2250000, "roi": 7.0},
            {"date": "2024-11-01", "current_value": 2500000, "invested": 2330000, "roi": 7.2},
            {"date": "2024-12-01", "current_value": 2500000, "invested": 2330000, "roi": 7.2}
        ]

@app.get("/api/v1/lenders/cra/metrics")
async def get_cra_metrics(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get CRA compliance metrics"""
    return [
        {
            "category": "Low Income Areas",
            "target": 40.0,
            "current": 45.2,
            "status": "exceeds"
        },
        {
            "category": "Moderate Income Areas", 
            "target": 30.0,
            "current": 32.8,
            "status": "exceeds"
        },
        {
            "category": "Assessment Area Coverage",
            "target": 75.0,
            "current": 78.5,
            "status": "meets"
        },
        {
            "category": "Community Development",
            "target": 15.0,
            "current": 20.0,
            "status": "exceeds"
        },
        {
            "category": "Small Business Lending",
            "target": 25.0,
            "current": 22.1,
            "status": "approaching"
        }
    ]

# Reports Endpoints
@app.get("/api/v1/reports")
async def get_reports(
    skip: int = 0,
    limit: int = 10,
    type: str = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get reports list"""
    reports = [
        {
            "id": "rpt_001",
            "report_type": "cra_compliance",
            "name": "CRA Compliance Report Q1 2024",
            "status": "completed",
            "created_at": "2024-03-31T23:59:59Z",
            "completed_at": "2024-04-01T00:15:30Z",
            "file_url": "/api/v1/reports/rpt_001/download",
            "parameters": {
                "quarter": "Q1",
                "year": 2024
            }
        },
        {
            "id": "rpt_002",
            "report_type": "investment_summary",
            "name": "Investment Portfolio Summary - March 2024",
            "status": "completed",
            "created_at": "2024-03-30T18:00:00Z",
            "completed_at": "2024-03-30T18:05:00Z",
            "file_url": "/api/v1/reports/rpt_002/download",
            "parameters": {
                "month": "March",
                "year": 2024
            }
        },
        {
            "id": "rpt_003",
            "report_type": "affordable_housing",
            "name": "Affordable Housing Impact Report 2024",
            "status": "in_progress",
            "created_at": "2024-04-01T10:00:00Z",
            "progress": 65,
            "parameters": {
                "include_projections": True
            }
        }
    ]
    
    # Filter by type if specified
    if type:
        reports = [r for r in reports if r.get("report_type") == type]
    
    return reports[skip:skip + limit]

@app.post("/api/v1/reports")
async def create_report(report_data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Generate new report"""
    import uuid
    report_id = f"rpt_{str(uuid.uuid4())[:8]}"
    
    return {
        "id": report_id,
        "report_type": report_data.get("report_type", "custom"),
        "name": f"{report_data.get('report_type', 'Custom Report')} - {datetime.utcnow().strftime('%B %Y')}",
        "status": "pending",
        "created_at": datetime.utcnow().isoformat() + "Z",
        "parameters": report_data.get("parameters", {})
    }

@app.get("/api/v1/reports/{report_id}")
async def get_report(
    report_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get specific report details"""
    return {
        "id": report_id,
        "report_type": "cra_compliance",
        "name": "CRA Compliance Report Q1 2024",
        "status": "completed",
        "created_at": "2024-03-31T23:59:59Z",
        "completed_at": "2024-04-01T00:15:30Z",
        "file_url": f"/api/v1/reports/{report_id}/download",
        "parameters": {
            "quarter": "Q1",
            "year": 2024
        },
        "metrics": {
            "total_investments": 45,
            "lmi_percentage": 68,
            "geographic_distribution": {
                "urban": 60,
                "suburban": 30,
                "rural": 10
            }
        }
    }

# Developer Portal Endpoints  
@app.get("/api/v1/projects")
async def get_projects(limit: int = 10, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get projects list"""
    return [
        {
            "id": "proj_001",
            "name": "Sunset Gardens Phase II",
            "developer": "Urban Housing LLC",
            "location": "San Francisco, CA",
            "coordinates": [37.7749, -122.4194],
            "units": 48,
            "affordable_units": 38,
            "ami_range": "30-80%",
            "status": "active",
            "funding_needed": 750000,
            "funding_secured": 600000,
            "timeline": "18 months",
            "completion_date": "2026-06-15"
        },
        {
            "id": "proj_002",
            "name": "Mission Bay Affordable Housing",
            "developer": "Bay Area Development",
            "location": "San Francisco, CA", 
            "coordinates": [37.7707, -122.3920],
            "units": 65,
            "affordable_units": 52,
            "ami_range": "50-80%",
            "status": "planning",
            "funding_needed": 1200000,
            "funding_secured": 800000,
            "timeline": "24 months",
            "completion_date": "2026-12-31"
        },
        {
            "id": "proj_003",
            "name": "Richmond Commons",
            "developer": "Community Builders Inc",
            "location": "Richmond, CA",
            "coordinates": [37.9358, -122.3477],
            "units": 32,
            "affordable_units": 32,
            "ami_range": "30-60%", 
            "status": "completed",
            "funding_needed": 550000,
            "funding_secured": 550000,
            "timeline": "12 months",
            "completion_date": "2024-08-30"
        }
    ][:limit]

@app.post("/api/v1/projects") 
async def create_project(project_data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new project"""
    import uuid
    project_id = f"proj_{str(uuid.uuid4())[:8]}"
    
    return {
        "id": project_id,
        "name": project_data.get("name", "New Project"),
        "developer": project_data.get("developer", "TBD"),
        "status": "planning",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

# Map/Heatmap Endpoints
@app.get("/api/v1/lenders/heatmap")
async def get_heatmap_data(bounds: str = None, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get heatmap data for map visualization"""
    # Return array format expected by frontend with enhanced intensity distribution
    return [
        {
            "lat": 37.7749,
            "lng": -122.4194,
            "intensity": 0.8,
            "value": "$750K",
            "description": "Downtown SF - 3 projects"
        },
        {
            "lat": 37.7707,
            "lng": -122.3920,
            "intensity": 0.6,
            "value": "$1.2M",
            "description": "Mission Bay - 2 projects"
        },
        {
            "lat": 37.9358,
            "lng": -122.3477,
            "intensity": 0.3,
            "value": "$550K",
            "description": "Richmond - 1 project"
        },
        {
            "lat": 37.7849,
            "lng": -122.4094,
            "intensity": 1.0,
            "value": "$950K",
            "description": "SOMA - 4 projects"
        },
        {
            "lat": 37.7849,
            "lng": -122.4594,
            "intensity": 0.2,
            "value": "$325K",
            "description": "Sunset - 1 project"
        },
        {
            "lat": 37.8049,
            "lng": -122.2694,
            "intensity": 0.5,
            "value": "$680K",
            "description": "Oakland - 2 projects"
        },
        {
            "lat": 37.7249,
            "lng": -122.4794,
            "intensity": 0.4,
            "value": "$420K",
            "description": "Daly City - 2 projects"
        },
        {
            "lat": 37.7649,
            "lng": -122.4294,
            "intensity": 0.7,
            "value": "$880K",
            "description": "Financial District - 5 projects"
        },
        {
            "lat": 37.7549,
            "lng": -122.4494,
            "intensity": 0.9,
            "value": "$1.1M",
            "description": "Hayes Valley - 6 projects"
        },
        {
            "lat": 37.7949,
            "lng": -122.3994,
            "intensity": 0.6,
            "value": "$620K",
            "description": "Potrero Hill - 3 projects"
        },
        {
            "lat": 37.7349,
            "lng": -122.4594,
            "intensity": 0.4,
            "value": "$390K",
            "description": "Outer Sunset - 2 projects"
        },
        {
            "lat": 37.8149,
            "lng": -122.2794,
            "intensity": 0.5,
            "value": "$540K",
            "description": "West Oakland - 3 projects"
        }
    ]


# Contact form endpoint
class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    subject: str
    message: str

@app.post("/api/v1/contact")
async def submit_contact_form(contact_data: ContactRequest):
    """Submit contact form (simplified version - just logs the message)"""
    try:
        print(f"Contact form submission:")
        print(f"  Name: {contact_data.name}")
        print(f"  Email: {contact_data.email}")
        print(f"  Company: {contact_data.company}")
        print(f"  Phone: {contact_data.phone}")
        print(f"  Subject: {contact_data.subject}")
        print(f"  Message: {contact_data.message}")
        
        # In a real implementation, you would:
        # 1. Store in database
        # 2. Send email notifications
        # 3. Send auto-reply to customer
        
        return {"message": "Contact form submitted successfully"}
        
    except Exception as e:
        print(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process contact form")


# Create test users on startup
@app.on_event("startup")
async def create_test_users():
    """Create test users for demo"""
    init_db()
    
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    
    try:
        # Create test company
        company = get_or_create_company(conn, "test-company")
        
        # Test users
        test_users = [
            {"email": "developer@test.com", "password": "password123", "role": "developer"},
            {"email": "lender@test.com", "password": "password123", "role": "lender"},
            {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
            {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
            {"email": "admin@test.com", "password": "password123", "role": "admin"},
        ]
        
        for user_data in test_users:
            try:
                create_user(conn, user_data["email"], user_data["password"], 
                           company['id'], user_data["role"])
                print(f"Created test user: {user_data['email']} ({user_data['role']})")
            except:
                print(f"Test user already exists: {user_data['email']}")
                
    finally:
        conn.close()

if __name__ == "__main__":
    uvicorn.run("simple_backend:app", host="0.0.0.0", port=8000, reload=True)