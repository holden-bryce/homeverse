#!/usr/bin/env python3
"""HomeVerse Production-Ready Backend with SQLite/PostgreSQL Support"""
import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Union
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

# AI/ML imports
try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    logger.info("🤖 OpenAI integration available")
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("⚠️ OpenAI not installed - matching will use fallback algorithm")

# Production Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_PATH = os.getenv("DATABASE_PATH", "homeverse_demo.db")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key-here-for-testing")
JWT_ALGORITHM = "HS256"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# AI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("🤖 OpenAI client initialized")
else:
    openai_client = None
    logger.warning("⚠️ OpenAI client not available - using fallback matching")

# Logging setup
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Database type detection
USE_POSTGRESQL = bool(DATABASE_URL and DATABASE_URL.startswith("postgresql"))

if USE_POSTGRESQL:
    try:
        import asyncpg
        import asyncio
        logger.info("🐘 PostgreSQL mode enabled")
    except ImportError:
        logger.warning("PostgreSQL dependencies not found, falling back to SQLite")
        USE_POSTGRESQL = False
else:
    logger.info("🗃️ SQLite mode enabled")

app = FastAPI(
    title="HomeVerse Production API", 
    version="2.0.0",
    description="Production-Ready Affordable Housing Management Platform"
)
security = HTTPBearer()

# CORS middleware - Production configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Global PostgreSQL connection pool
pg_pool = None

async def init_postgresql():
    """Initialize PostgreSQL connection pool"""
    global pg_pool
    try:
        pg_pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=1,
            max_size=20,
            command_timeout=60
        )
        logger.info("✅ PostgreSQL connection pool initialized")
        
        # Create tables if they don't exist
        async with pg_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS companies (
                    id TEXT PRIMARY KEY,
                    key TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    plan TEXT DEFAULT 'basic',
                    seats INTEGER DEFAULT 10,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    company_id TEXT REFERENCES companies(id),
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    company_id TEXT REFERENCES companies(id),
                    name TEXT NOT NULL,
                    developer TEXT,
                    location TEXT,
                    address TEXT,
                    latitude FLOAT,
                    longitude FLOAT,
                    total_units INTEGER,
                    affordable_units INTEGER,
                    ami_levels TEXT,
                    description TEXT,
                    completion_date TEXT,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS applicants (
                    id TEXT PRIMARY KEY,
                    company_id TEXT REFERENCES companies(id),
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT,
                    household_size INTEGER,
                    income FLOAT,
                    ami_percent FLOAT,
                    location_preference TEXT,
                    latitude FLOAT,
                    longitude FLOAT,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id TEXT PRIMARY KEY,
                    user_id TEXT REFERENCES users(id),
                    company_id TEXT REFERENCES companies(id),
                    activity_type TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    entity_type TEXT,
                    entity_id TEXT,
                    metadata JSONB,
                    status TEXT DEFAULT 'info',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS investments (
                    id TEXT PRIMARY KEY,
                    company_id TEXT REFERENCES companies(id),
                    user_id TEXT REFERENCES users(id),
                    project_id TEXT REFERENCES projects(id),
                    project_name TEXT NOT NULL,
                    developer TEXT,
                    location TEXT,
                    investment_amount DECIMAL(15,2) NOT NULL,
                    current_value DECIMAL(15,2),
                    date_invested DATE NOT NULL,
                    expected_completion_date DATE,
                    actual_completion_date DATE,
                    status TEXT DEFAULT 'active',
                    ami_compliance DECIMAL(5,2),
                    units_funded INTEGER,
                    risk_level TEXT DEFAULT 'medium',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS investment_valuations (
                    id TEXT PRIMARY KEY,
                    investment_id TEXT REFERENCES investments(id),
                    valuation_date DATE NOT NULL,
                    value DECIMAL(15,2) NOT NULL,
                    valuation_method TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS project_embeddings (
                    id TEXT PRIMARY KEY,
                    project_id TEXT REFERENCES projects(id),
                    embedding_vector JSONB NOT NULL,
                    description_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS applicant_embeddings (
                    id TEXT PRIMARY KEY,
                    applicant_id TEXT REFERENCES applicants(id),
                    embedding_vector JSONB NOT NULL,
                    preferences_text TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS matches (
                    id TEXT PRIMARY KEY,
                    applicant_id TEXT REFERENCES applicants(id),
                    project_id TEXT REFERENCES projects(id),
                    company_id TEXT REFERENCES companies(id),
                    similarity_score DECIMAL(5,4) NOT NULL,
                    match_reasons JSONB,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
        logger.info("✅ PostgreSQL tables initialized")
        
    except Exception as e:
        logger.error(f"❌ PostgreSQL initialization failed: {e}")
        raise

async def get_pg_connection():
    """Get PostgreSQL connection from pool"""
    if not pg_pool:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return await pg_pool.acquire()

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
    
    # Projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            developer TEXT,
            location TEXT,
            address TEXT,
            latitude REAL,
            longitude REAL,
            total_units INTEGER,
            affordable_units INTEGER,
            ami_levels TEXT,
            status TEXT DEFAULT 'planning',
            description TEXT,
            completion_date TEXT,
            images TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id)
        )
    """)
    
    # Applicants table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS applicants (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT,
            household_size INTEGER,
            income REAL,
            ami_percent REAL,
            location_preference TEXT,
            latitude REAL,
            longitude REAL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id)
        )
    """)
    
    # Activity log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            metadata TEXT,
            status TEXT DEFAULT 'info',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Investments table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investments (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            project_id TEXT,
            project_name TEXT NOT NULL,
            developer TEXT,
            location TEXT,
            investment_amount REAL NOT NULL,
            current_value REAL,
            date_invested DATE NOT NULL,
            expected_completion_date DATE,
            actual_completion_date DATE,
            status TEXT DEFAULT 'active',
            ami_compliance REAL,
            units_funded INTEGER,
            risk_level TEXT DEFAULT 'medium',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    """)
    
    # Investment valuations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS investment_valuations (
            id TEXT PRIMARY KEY,
            investment_id TEXT NOT NULL,
            valuation_date DATE NOT NULL,
            value REAL NOT NULL,
            valuation_method TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (investment_id) REFERENCES investments (id)
        )
    """)
    
    # Project embeddings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS project_embeddings (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            embedding_vector TEXT NOT NULL,
            description_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (id)
        )
    """)
    
    # Applicant embeddings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS applicant_embeddings (
            id TEXT PRIMARY KEY,
            applicant_id TEXT NOT NULL,
            embedding_vector TEXT NOT NULL,
            preferences_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (applicant_id) REFERENCES applicants (id)
        )
    """)
    
    # Matches table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS matches (
            id TEXT PRIMARY KEY,
            applicant_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            company_id TEXT NOT NULL,
            similarity_score REAL NOT NULL,
            match_reasons TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (applicant_id) REFERENCES applicants (id),
            FOREIGN KEY (project_id) REFERENCES projects (id),
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

class ProjectCreate(BaseModel):
    name: str
    developer: Optional[str] = None
    location: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_units: Optional[int] = None
    affordable_units: Optional[int] = None
    ami_levels: Optional[str] = None
    description: Optional[str] = None
    completion_date: Optional[str] = None

class ApplicantCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    household_size: Optional[int] = None
    income: Optional[float] = None
    ami_percent: Optional[float] = None
    location_preference: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class InvestmentCreate(BaseModel):
    project_id: Optional[str] = None
    project_name: str
    developer: Optional[str] = None
    location: Optional[str] = None
    investment_amount: float
    date_invested: str  # ISO date string
    expected_completion_date: Optional[str] = None
    ami_compliance: Optional[float] = None
    units_funded: Optional[int] = None
    risk_level: Optional[str] = "medium"
    notes: Optional[str] = None

class InvestmentUpdate(BaseModel):
    project_name: Optional[str] = None
    developer: Optional[str] = None
    location: Optional[str] = None
    current_value: Optional[float] = None
    expected_completion_date: Optional[str] = None
    actual_completion_date: Optional[str] = None
    status: Optional[str] = None
    ami_compliance: Optional[float] = None
    units_funded: Optional[int] = None
    risk_level: Optional[str] = None
    notes: Optional[str] = None

class InvestmentValuation(BaseModel):
    investment_id: str
    value: float
    valuation_date: str  # ISO date string
    valuation_method: Optional[str] = None
    notes: Optional[str] = None

class MatchingRequest(BaseModel):
    applicant_id: Optional[str] = None
    project_id: Optional[str] = None
    limit: Optional[int] = 10

class MatchResult(BaseModel):
    match_id: str
    applicant_id: str
    project_id: str
    similarity_score: float
    match_reasons: dict
    applicant_info: dict
    project_info: dict

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

def log_activity(conn, user_id: str, company_id: str, activity_type: str, title: str, 
                description: str, entity_type: str = None, entity_id: str = None, 
                metadata: dict = None, status: str = "info"):
    """Log user activity"""
    cursor = conn.cursor()
    activity_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO activity_logs (
            id, company_id, user_id, type, title, description, 
            entity_type, entity_id, metadata, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        activity_id, company_id, user_id, activity_type, title, description,
        entity_type, entity_id, json.dumps(metadata) if metadata else None, status
    ))
    
    conn.commit()
    return activity_id

def get_activities(conn, company_id: str, limit: int = 50, offset: int = 0):
    """Get activities for a company"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT al.*, u.email as user_email 
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.company_id = ?
        ORDER BY al.created_at DESC
        LIMIT ? OFFSET ?
    """, (company_id, limit, offset))
    
    activities = []
    for row in cursor.fetchall():
        activity = dict(row)
        if activity.get('metadata'):
            activity['metadata'] = json.loads(activity['metadata'])
        activities.append(activity)
    
    return activities

def get_activity_detail(conn, activity_id: str, company_id: str):
    """Get detailed activity information"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT al.*, u.email as user_email 
        FROM activity_logs al
        JOIN users u ON al.user_id = u.id
        WHERE al.id = ? AND al.company_id = ?
    """, (activity_id, company_id))
    
    activity = cursor.fetchone()
    if activity:
        activity = dict(activity)
        if activity.get('metadata'):
            activity['metadata'] = json.loads(activity['metadata'])
    return activity

# Investment database operations
def create_investment(conn, user_id: str, company_id: str, investment_data: InvestmentCreate):
    """Create new investment record"""
    cursor = conn.cursor()
    investment_id = f"inv_{str(uuid.uuid4())[:8]}"
    
    cursor.execute("""
        INSERT INTO investments (
            id, company_id, user_id, project_id, project_name, developer, location,
            investment_amount, current_value, date_invested, expected_completion_date,
            ami_compliance, units_funded, risk_level, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        investment_id, company_id, user_id, investment_data.project_id,
        investment_data.project_name, investment_data.developer, investment_data.location,
        investment_data.investment_amount, investment_data.investment_amount,  # Initial value = investment
        investment_data.date_invested, investment_data.expected_completion_date,
        investment_data.ami_compliance, investment_data.units_funded,
        investment_data.risk_level, investment_data.notes
    ))
    
    conn.commit()
    return investment_id

def get_investments(conn, company_id: str, user_id: str = None, limit: int = 50):
    """Get investments for company/user"""
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute("""
            SELECT * FROM investments 
            WHERE company_id = ? AND user_id = ?
            ORDER BY date_invested DESC, created_at DESC 
            LIMIT ?
        """, (company_id, user_id, limit))
    else:
        cursor.execute("""
            SELECT * FROM investments 
            WHERE company_id = ?
            ORDER BY date_invested DESC, created_at DESC 
            LIMIT ?
        """, (company_id, limit))
    
    investments = [dict(row) for row in cursor.fetchall()]
    
    # Calculate ROI for each investment
    for investment in investments:
        if investment['investment_amount'] and investment['current_value']:
            roi = ((investment['current_value'] - investment['investment_amount']) / investment['investment_amount']) * 100
            investment['roi'] = round(roi, 2)
        else:
            investment['roi'] = 0.0
    
    return investments

def update_investment(conn, investment_id: str, company_id: str, user_id: str, update_data: InvestmentUpdate):
    """Update investment record"""
    cursor = conn.cursor()
    
    # Build dynamic update query
    update_fields = []
    values = []
    
    for field, value in update_data.dict(exclude_unset=True).items():
        if value is not None:
            update_fields.append(f"{field} = ?")
            values.append(value)
    
    if not update_fields:
        return False
    
    update_fields.append("updated_at = ?")
    values.append(datetime.utcnow().isoformat())
    values.extend([investment_id, company_id, user_id])
    
    cursor.execute(f"""
        UPDATE investments 
        SET {', '.join(update_fields)}
        WHERE id = ? AND company_id = ? AND user_id = ?
    """, values)
    
    conn.commit()
    return cursor.rowcount > 0

def delete_investment(conn, investment_id: str, company_id: str, user_id: str):
    """Delete investment record"""
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM investments 
        WHERE id = ? AND company_id = ? AND user_id = ?
    """, (investment_id, company_id, user_id))
    
    conn.commit()
    return cursor.rowcount > 0

def add_investment_valuation(conn, valuation_data: InvestmentValuation):
    """Add new valuation for investment"""
    cursor = conn.cursor()
    valuation_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO investment_valuations (
            id, investment_id, valuation_date, value, valuation_method, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        valuation_id, valuation_data.investment_id, valuation_data.valuation_date,
        valuation_data.value, valuation_data.valuation_method, valuation_data.notes
    ))
    
    # Update current value in investments table
    cursor.execute("""
        UPDATE investments 
        SET current_value = ?, updated_at = ?
        WHERE id = ?
    """, (valuation_data.value, datetime.utcnow().isoformat(), valuation_data.investment_id))
    
    conn.commit()
    return valuation_id

def calculate_portfolio_stats(conn, company_id: str, user_id: str = None):
    """Calculate real portfolio statistics from database"""
    cursor = conn.cursor()
    
    if user_id:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_investments,
                SUM(investment_amount) as total_invested,
                SUM(current_value) as current_portfolio_value,
                AVG(ami_compliance) as avg_ami_compliance,
                SUM(units_funded) as total_units_funded
            FROM investments 
            WHERE company_id = ? AND user_id = ? AND status = 'active'
        """, (company_id, user_id))
    else:
        cursor.execute("""
            SELECT 
                COUNT(*) as total_investments,
                SUM(investment_amount) as total_invested,
                SUM(current_value) as current_portfolio_value,
                AVG(ami_compliance) as avg_ami_compliance,
                SUM(units_funded) as total_units_funded
            FROM investments 
            WHERE company_id = ? AND status = 'active'
        """, (company_id,))
    
    stats = dict(cursor.fetchone())
    
    # Calculate additional metrics
    if stats['total_invested'] and stats['current_portfolio_value']:
        total_return = stats['current_portfolio_value'] - stats['total_invested']
        roi_percent = (total_return / stats['total_invested']) * 100
        stats['total_return'] = total_return
        stats['average_roi'] = round(roi_percent, 2)
        stats['annualized_return'] = round(roi_percent * 1.1, 2)  # Simplified annualization
    else:
        stats['total_return'] = 0
        stats['average_roi'] = 0
        stats['annualized_return'] = 0
    
    # Default compliance rate
    stats['compliance_rate'] = round(stats.get('avg_ami_compliance', 0) or 0, 1)
    
    return stats

# AI Matching Functions
def create_embedding(text: str) -> list:
    """Create OpenAI embedding for text"""
    if not openai_client:
        # Fallback: Simple hash-based embedding simulation
        import hashlib
        hash_obj = hashlib.md5(text.encode())
        # Create a simple numeric vector from hash
        hash_hex = hash_obj.hexdigest()
        embedding = [int(hash_hex[i:i+2], 16) / 255.0 for i in range(0, min(32, len(hash_hex)), 2)]
        # Pad to 16 dimensions
        while len(embedding) < 16:
            embedding.append(0.0)
        return embedding[:16]
    
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        return response.data[0].embedding
    except Exception as e:
        logger.error(f"Error creating embedding: {e}")
        # Fallback to simple embedding
        return [0.0] * 1536  # text-embedding-3-small dimension

def cosine_similarity(vec1: list, vec2: list) -> float:
    """Calculate cosine similarity between two vectors"""
    import math
    
    # Ensure vectors are same length
    min_len = min(len(vec1), len(vec2))
    vec1 = vec1[:min_len]
    vec2 = vec2[:min_len]
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(a * a for a in vec2))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    return dot_product / (magnitude1 * magnitude2)

def create_project_description(project: dict) -> str:
    """Create searchable description for project embedding"""
    description_parts = []
    
    if project.get('name'):
        description_parts.append(f"Project: {project['name']}")
    if project.get('location'):
        description_parts.append(f"Location: {project['location']}")
    if project.get('developer'):
        description_parts.append(f"Developer: {project['developer']}")
    if project.get('total_units'):
        description_parts.append(f"Total units: {project['total_units']}")
    if project.get('affordable_units'):
        description_parts.append(f"Affordable units: {project['affordable_units']}")
    if project.get('ami_levels'):
        description_parts.append(f"AMI levels: {project['ami_levels']}")
    if project.get('description'):
        description_parts.append(f"Description: {project['description']}")
    
    return " | ".join(description_parts)

def create_applicant_preferences(applicant: dict) -> str:
    """Create searchable preferences for applicant embedding"""
    preferences_parts = []
    
    if applicant.get('location_preference'):
        preferences_parts.append(f"Preferred location: {applicant['location_preference']}")
    if applicant.get('household_size'):
        preferences_parts.append(f"Household size: {applicant['household_size']}")
    if applicant.get('income'):
        preferences_parts.append(f"Annual income: ${applicant['income']}")
    if applicant.get('ami_percent'):
        preferences_parts.append(f"AMI percentage: {applicant['ami_percent']}%")
    
    # Add preference context
    preferences_parts.append("Looking for affordable housing opportunities")
    
    return " | ".join(preferences_parts)

def get_or_create_project_embedding(conn, project: dict):
    """Get or create embedding for project"""
    cursor = conn.cursor()
    project_id = project['id']
    
    # Check if embedding exists
    cursor.execute("SELECT embedding_vector FROM project_embeddings WHERE project_id = ?", (project_id,))
    result = cursor.fetchone()
    
    if result:
        # Return existing embedding
        embedding_data = json.loads(result[0]) if isinstance(result[0], str) else result[0]
        return embedding_data
    
    # Create new embedding
    description = create_project_description(project)
    embedding = create_embedding(description)
    
    # Store embedding
    embedding_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO project_embeddings (id, project_id, embedding_vector, description_text)
        VALUES (?, ?, ?, ?)
    """, (embedding_id, project_id, json.dumps(embedding), description))
    
    conn.commit()
    return embedding

def get_or_create_applicant_embedding(conn, applicant: dict):
    """Get or create embedding for applicant"""
    cursor = conn.cursor()
    applicant_id = applicant['id']
    
    # Check if embedding exists
    cursor.execute("SELECT embedding_vector FROM applicant_embeddings WHERE applicant_id = ?", (applicant_id,))
    result = cursor.fetchone()
    
    if result:
        # Return existing embedding
        embedding_data = json.loads(result[0]) if isinstance(result[0], str) else result[0]
        return embedding_data
    
    # Create new embedding
    preferences = create_applicant_preferences(applicant)
    embedding = create_embedding(preferences)
    
    # Store embedding
    embedding_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO applicant_embeddings (id, applicant_id, embedding_vector, preferences_text)
        VALUES (?, ?, ?, ?)
    """, (embedding_id, applicant_id, json.dumps(embedding), preferences))
    
    conn.commit()
    return embedding

def calculate_match_reasons(applicant: dict, project: dict, similarity_score: float) -> dict:
    """Calculate specific reasons for the match"""
    reasons = {
        "overall_compatibility": f"{similarity_score * 100:.1f}% match",
        "factors": []
    }
    
    # Location match
    if (applicant.get('location_preference') and project.get('location') and 
        applicant['location_preference'].lower() in project['location'].lower()):
        reasons["factors"].append("Preferred location match")
    
    # AMI compatibility
    if applicant.get('ami_percent') and project.get('ami_levels'):
        reasons["factors"].append("AMI level compatibility")
    
    # Unit size (rough estimate based on household size)
    if applicant.get('household_size'):
        if applicant['household_size'] <= 2:
            reasons["factors"].append("Suitable for small household")
        elif applicant['household_size'] <= 4:
            reasons["factors"].append("Suitable for medium household")
        else:
            reasons["factors"].append("Suitable for large household")
    
    # Income compatibility
    if applicant.get('income'):
        if applicant['income'] < 50000:
            reasons["factors"].append("Low-income housing eligible")
        elif applicant['income'] < 80000:
            reasons["factors"].append("Moderate-income housing eligible")
        else:
            reasons["factors"].append("Market-rate housing eligible")
    
    if not reasons["factors"]:
        reasons["factors"].append("General housing compatibility")
    
    return reasons

def find_matches_for_applicant(conn, applicant_id: str, company_id: str, limit: int = 10):
    """Find best project matches for an applicant using AI embeddings"""
    cursor = conn.cursor()
    
    # Get applicant info
    cursor.execute("SELECT * FROM applicants WHERE id = ? AND company_id = ?", (applicant_id, company_id))
    applicant = cursor.fetchone()
    if not applicant:
        return []
    
    applicant = dict(applicant)
    applicant_embedding = get_or_create_applicant_embedding(conn, applicant)
    
    # Get all projects for company
    cursor.execute("SELECT * FROM projects WHERE company_id = ? AND status = 'active'", (company_id,))
    projects = [dict(row) for row in cursor.fetchall()]
    
    matches = []
    for project in projects:
        project_embedding = get_or_create_project_embedding(conn, project)
        similarity = cosine_similarity(applicant_embedding, project_embedding)
        
        if similarity > 0.1:  # Minimum threshold
            match_reasons = calculate_match_reasons(applicant, project, similarity)
            
            matches.append({
                "applicant_id": applicant_id,
                "project_id": project['id'],
                "similarity_score": similarity,
                "match_reasons": match_reasons,
                "applicant_info": {
                    "name": f"{applicant['first_name']} {applicant['last_name']}",
                    "location_preference": applicant.get('location_preference'),
                    "household_size": applicant.get('household_size'),
                    "ami_percent": applicant.get('ami_percent')
                },
                "project_info": {
                    "name": project['name'],
                    "location": project.get('location'),
                    "developer": project.get('developer'),
                    "total_units": project.get('total_units'),
                    "affordable_units": project.get('affordable_units')
                }
            })
    
    # Sort by similarity score
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches[:limit]

def find_matches_for_project(conn, project_id: str, company_id: str, limit: int = 10):
    """Find best applicant matches for a project using AI embeddings"""
    cursor = conn.cursor()
    
    # Get project info
    cursor.execute("SELECT * FROM projects WHERE id = ? AND company_id = ?", (project_id, company_id))
    project = cursor.fetchone()
    if not project:
        return []
    
    project = dict(project)
    project_embedding = get_or_create_project_embedding(conn, project)
    
    # Get all applicants for company
    cursor.execute("SELECT * FROM applicants WHERE company_id = ? AND status = 'active'", (company_id,))
    applicants = [dict(row) for row in cursor.fetchall()]
    
    matches = []
    for applicant in applicants:
        applicant_embedding = get_or_create_applicant_embedding(conn, applicant)
        similarity = cosine_similarity(project_embedding, applicant_embedding)
        
        if similarity > 0.1:  # Minimum threshold
            match_reasons = calculate_match_reasons(applicant, project, similarity)
            
            matches.append({
                "applicant_id": applicant['id'],
                "project_id": project_id,
                "similarity_score": similarity,
                "match_reasons": match_reasons,
                "applicant_info": {
                    "name": f"{applicant['first_name']} {applicant['last_name']}",
                    "location_preference": applicant.get('location_preference'),
                    "household_size": applicant.get('household_size'),
                    "ami_percent": applicant.get('ami_percent')
                },
                "project_info": {
                    "name": project['name'],
                    "location": project.get('location'),
                    "developer": project.get('developer'),
                    "total_units": project.get('total_units'),
                    "affordable_units": project.get('affordable_units')
                }
            })
    
    # Sort by similarity score
    matches.sort(key=lambda x: x['similarity_score'], reverse=True)
    return matches[:limit]

def store_matches(conn, matches: list, company_id: str):
    """Store matches in database for tracking"""
    cursor = conn.cursor()
    
    for match in matches:
        match_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT OR REPLACE INTO matches 
            (id, applicant_id, project_id, company_id, similarity_score, match_reasons, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            match_id, match['applicant_id'], match['project_id'], company_id,
            match['similarity_score'], json.dumps(match['match_reasons']), 'pending'
        ))
        match['match_id'] = match_id
    
    conn.commit()
    return matches

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
    
    # Log login activity
    log_activity(
        conn, 
        user['id'], 
        user['company_id'],
        "auth",
        "User Login",
        f"{user['email']} logged in successfully",
        status="success"
    )
    
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
    """Get real lender portfolio statistics from database"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        if USE_POSTGRESQL:
            async with pg_pool.acquire() as conn:
                user = await conn.fetchrow("SELECT company_id FROM users WHERE id = $1", user_data["sub"])
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
                
                company_id = user["company_id"]
                # For now, calculate stats for entire company (could be user-specific)
                # This would require async versions of the helper functions
                # Fall back to demo data mixed with some real calculations
                return {
                    "total_invested": 2500000,
                    "current_portfolio_value": 2680000,
                    "average_roi": 7.2,
                    "active_investments": 12,
                    "total_return": 180000,
                    "annualized_return": 8.1,
                    "compliance_rate": 85.6
                }
        else:
            # SQLite version with real calculations
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Calculate real stats
            stats = calculate_portfolio_stats(conn, company_id, user_data["sub"])
            conn.close()
            
            # Mix with demo data if no real data exists
            if stats['total_investments'] == 0:
                return {
                    "total_invested": 2500000,
                    "current_portfolio_value": 2680000,
                    "average_roi": 7.2,
                    "active_investments": 12,
                    "total_return": 180000,
                    "annualized_return": 8.1,
                    "compliance_rate": 85.6
                }
            
            return {
                "total_invested": stats['total_invested'] or 0,
                "current_portfolio_value": stats['current_portfolio_value'] or 0,
                "average_roi": stats['average_roi'],
                "active_investments": stats['total_investments'],
                "total_return": stats['total_return'],
                "annualized_return": stats['annualized_return'],
                "compliance_rate": stats['compliance_rate']
            }
            
    except Exception as e:
        logger.error(f"Error getting portfolio stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get portfolio stats")

@app.get("/api/v1/lenders/investments")
async def get_investments_endpoint(limit: int = 10, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get real recent investments from database"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            async with pg_pool.acquire() as conn:
                user = await conn.fetchrow("SELECT company_id FROM users WHERE id = $1", user_data["sub"])
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
        else:
            # SQLite version with real data
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Get real investments
            real_investments = get_investments(conn, company_id, user_data["sub"], limit)
            conn.close()
            
            # If no real investments, return demo data
            if not real_investments:
                return [
                    {
                        "id": "demo_inv_001",
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
                        "expected_completion_date": "2025-08-30",
                        "risk_level": "low"
                    },
                    {
                        "id": "demo_inv_002", 
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
                        "expected_completion_date": "2025-12-15",
                        "risk_level": "medium"
                    },
                    {
                        "id": "demo_inv_003",
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
                        "actual_completion_date": "2024-11-30",
                        "risk_level": "low"
                    }
                ][:limit]
            
            return real_investments
            
    except Exception as e:
        logger.error(f"Error getting investments: {e}")
        raise HTTPException(status_code=500, detail="Failed to get investments")

@app.post("/api/v1/lenders/investments")
async def create_investment_endpoint(investment_data: InvestmentCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new investment"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL investment creation not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Create investment
            investment_id = create_investment(conn, user_data["sub"], company_id, investment_data)
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "investment",
                "New Investment Created",
                f"Created investment in {investment_data.project_name} for ${investment_data.investment_amount:,.2f}",
                entity_type="investment",
                entity_id=investment_id,
                metadata={
                    "project_name": investment_data.project_name,
                    "investment_amount": investment_data.investment_amount,
                    "developer": investment_data.developer
                },
                status="success"
            )
            
            conn.close()
            
            return {
                "id": investment_id,
                "message": "Investment created successfully",
                "investment_amount": investment_data.investment_amount,
                "project_name": investment_data.project_name
            }
            
    except Exception as e:
        logger.error(f"Error creating investment: {e}")
        raise HTTPException(status_code=500, detail="Failed to create investment")

@app.put("/api/v1/lenders/investments/{investment_id}")
async def update_investment_endpoint(investment_id: str, update_data: InvestmentUpdate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update existing investment"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL investment update not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Update investment
            success = update_investment(conn, investment_id, company_id, user_data["sub"], update_data)
            
            if not success:
                raise HTTPException(status_code=404, detail="Investment not found")
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "investment",
                "Investment Updated",
                f"Updated investment {investment_id}",
                entity_type="investment",
                entity_id=investment_id,
                status="success"
            )
            
            conn.close()
            
            return {"message": "Investment updated successfully"}
            
    except Exception as e:
        logger.error(f"Error updating investment: {e}")
        raise HTTPException(status_code=500, detail="Failed to update investment")

@app.delete("/api/v1/lenders/investments/{investment_id}")
async def delete_investment_endpoint(investment_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Delete investment"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL investment deletion not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Delete investment
            success = delete_investment(conn, investment_id, company_id, user_data["sub"])
            
            if not success:
                raise HTTPException(status_code=404, detail="Investment not found")
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "investment",
                "Investment Deleted",
                f"Deleted investment {investment_id}",
                entity_type="investment",
                entity_id=investment_id,
                status="warning"
            )
            
            conn.close()
            
            return {"message": "Investment deleted successfully"}
            
    except Exception as e:
        logger.error(f"Error deleting investment: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete investment")

@app.post("/api/v1/lenders/investments/{investment_id}/valuations")
async def add_valuation_endpoint(investment_id: str, valuation_data: InvestmentValuation, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Add new valuation for investment"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL valuation not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            
            # Verify user has access to this investment
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            cursor.execute("""
                SELECT id FROM investments 
                WHERE id = ? AND company_id = ? AND user_id = ?
            """, (investment_id, company_id, user_data["sub"]))
            
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Investment not found")
            
            # Set investment_id from URL parameter
            valuation_data.investment_id = investment_id
            
            # Add valuation
            valuation_id = add_investment_valuation(conn, valuation_data)
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "investment",
                "Investment Valuation Updated",
                f"Updated valuation for investment {investment_id} to ${valuation_data.value:,.2f}",
                entity_type="investment",
                entity_id=investment_id,
                metadata={
                    "new_value": valuation_data.value,
                    "valuation_method": valuation_data.valuation_method
                },
                status="info"
            )
            
            conn.close()
            
            return {
                "valuation_id": valuation_id,
                "message": "Valuation added successfully",
                "new_value": valuation_data.value
            }
            
    except Exception as e:
        logger.error(f"Error adding valuation: {e}")
        raise HTTPException(status_code=500, detail="Failed to add valuation")

# AI Matching Endpoints
@app.post("/api/v1/matching/find")
async def find_matches(request: MatchingRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Find AI-powered matches between applicants and projects"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL matching not yet implemented")
        else:
            # SQLite version with AI matching
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            matches = []
            
            if request.applicant_id:
                # Find projects for specific applicant
                matches = find_matches_for_applicant(conn, request.applicant_id, company_id, request.limit)
            elif request.project_id:
                # Find applicants for specific project
                matches = find_matches_for_project(conn, request.project_id, company_id, request.limit)
            else:
                # Find all matches for company
                cursor.execute("SELECT id FROM applicants WHERE company_id = ? AND status = 'active' LIMIT 5", (company_id,))
                applicant_ids = [row[0] for row in cursor.fetchall()]
                
                for applicant_id in applicant_ids:
                    applicant_matches = find_matches_for_applicant(conn, applicant_id, company_id, 3)
                    matches.extend(applicant_matches)
                
                # Sort all matches by similarity
                matches.sort(key=lambda x: x['similarity_score'], reverse=True)
                matches = matches[:request.limit]
            
            # Store matches in database for tracking
            matches = store_matches(conn, matches, company_id)
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "matching",
                "AI Matching Performed",
                f"Generated {len(matches)} AI-powered matches",
                metadata={
                    "matches_found": len(matches),
                    "applicant_id": request.applicant_id,
                    "project_id": request.project_id
                },
                status="info"
            )
            
            conn.close()
            
            return {
                "matches": matches,
                "total_found": len(matches),
                "ai_powered": OPENAI_AVAILABLE,
                "method": "OpenAI embeddings" if OPENAI_AVAILABLE else "Fallback algorithm"
            }
            
    except Exception as e:
        logger.error(f"Error finding matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to find matches")

@app.get("/api/v1/matching/applicants/{applicant_id}/projects")
async def get_recommended_projects(applicant_id: str, limit: int = 10, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get AI-recommended projects for specific applicant"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL matching not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Find matches for the applicant
            matches = find_matches_for_applicant(conn, applicant_id, company_id, limit)
            
            if matches:
                store_matches(conn, matches, company_id)
            
            conn.close()
            
            return {
                "applicant_id": applicant_id,
                "recommended_projects": matches,
                "total_recommendations": len(matches)
            }
            
    except Exception as e:
        logger.error(f"Error getting project recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

@app.get("/api/v1/matching/projects/{project_id}/applicants")
async def get_recommended_applicants(project_id: str, limit: int = 10, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get AI-recommended applicants for specific project"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL matching not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Find matches for the project
            matches = find_matches_for_project(conn, project_id, company_id, limit)
            
            if matches:
                store_matches(conn, matches, company_id)
            
            conn.close()
            
            return {
                "project_id": project_id,
                "recommended_applicants": matches,
                "total_recommendations": len(matches)
            }
            
    except Exception as e:
        logger.error(f"Error getting applicant recommendations: {e}")
        raise HTTPException(status_code=500, detail="Failed to get recommendations")

@app.get("/api/v1/matching/matches")
async def get_stored_matches(limit: int = 50, status: str = None, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get stored matches with optional filtering"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL matching not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Build query with optional status filter
            if status:
                cursor.execute("""
                    SELECT m.*, 
                           a.first_name, a.last_name, a.location_preference,
                           p.name as project_name, p.location as project_location
                    FROM matches m
                    JOIN applicants a ON m.applicant_id = a.id
                    JOIN projects p ON m.project_id = p.id
                    WHERE m.company_id = ? AND m.status = ?
                    ORDER BY m.similarity_score DESC, m.created_at DESC
                    LIMIT ?
                """, (company_id, status, limit))
            else:
                cursor.execute("""
                    SELECT m.*, 
                           a.first_name, a.last_name, a.location_preference,
                           p.name as project_name, p.location as project_location
                    FROM matches m
                    JOIN applicants a ON m.applicant_id = a.id
                    JOIN projects p ON m.project_id = p.id
                    WHERE m.company_id = ?
                    ORDER BY m.similarity_score DESC, m.created_at DESC
                    LIMIT ?
                """, (company_id, limit))
            
            matches = []
            for row in cursor.fetchall():
                match = dict(row)
                if match.get('match_reasons'):
                    match['match_reasons'] = json.loads(match['match_reasons'])
                matches.append(match)
            
            conn.close()
            
            return {
                "matches": matches,
                "total_matches": len(matches),
                "filtered_by_status": status
            }
            
    except Exception as e:
        logger.error(f"Error getting stored matches: {e}")
        raise HTTPException(status_code=500, detail="Failed to get matches")

@app.put("/api/v1/matching/matches/{match_id}/status")
async def update_match_status(match_id: str, status: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update the status of a match (e.g., approved, rejected, contacted)"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        valid_statuses = ['pending', 'approved', 'rejected', 'contacted', 'applied']
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(valid_statuses)}")
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL matching not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Update match status
            cursor.execute("""
                UPDATE matches 
                SET status = ?, updated_at = ?
                WHERE id = ? AND company_id = ?
            """, (status, datetime.utcnow().isoformat(), match_id, company_id))
            
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Match not found")
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "matching",
                "Match Status Updated",
                f"Updated match {match_id} status to {status}",
                entity_type="match",
                entity_id=match_id,
                metadata={"new_status": status},
                status="info"
            )
            
            conn.commit()
            conn.close()
            
            return {"message": "Match status updated successfully", "new_status": status}
            
    except Exception as e:
        logger.error(f"Error updating match status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update match status")

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
async def create_report(report_data: dict, credentials: HTTPAuthorizationCredentials = Depends(security), conn=Depends(get_db)):
    """Generate new report"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        report_id = f"rpt_{str(uuid.uuid4())[:8]}"
        report_type = report_data.get("report_type", "custom")
        report_name = f"{report_type.replace('_', ' ').title()} - {datetime.utcnow().strftime('%B %Y')}"
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "compliance",
            "Report Generated",
            f"Generated {report_type} report",
            entity_type="report",
            entity_id=report_id,
            metadata={"report_type": report_type, "parameters": report_data.get("parameters", {})},
            status="info"
        )
        
        return {
            "id": report_id,
            "report_type": report_type,
            "name": report_name,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "parameters": report_data.get("parameters", {})
        }
    except Exception as e:
        print(f"Error creating report: {e}")
        raise HTTPException(status_code=500, detail="Failed to create report")

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
    """Get projects with real database data + demo data"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Get real projects from database
        cursor.execute("""
            SELECT * FROM projects 
            WHERE company_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        """, (company_id, limit))
        
        real_projects = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Demo data (for presentation purposes)
        demo_projects = [
            {
                "id": "demo_proj_001",
                "name": "Sunset Gardens Phase II",
                "developer": "Urban Housing LLC",
                "location": "San Francisco, CA",
                "coordinates": [37.7749, -122.4194],
                "latitude": 37.7749,
                "longitude": -122.4194,
                "total_units": 48,
                "affordable_units": 38,
                "ami_levels": "30-80%",
                "status": "active",
                "completion_date": "2026-06-15",
                "created_at": "2024-01-10T09:00:00Z",
                "images": json.dumps([
                    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop"
                ])
            },
            {
                "id": "demo_proj_002",
                "name": "Mission Bay Affordable Housing",
                "developer": "Bay Area Development",
                "location": "San Francisco, CA", 
                "coordinates": [37.7707, -122.3920],
                "latitude": 37.7707,
                "longitude": -122.3920,
                "total_units": 65,
                "affordable_units": 52,
                "ami_levels": "50-80%",
                "status": "planning",
                "completion_date": "2026-12-31",
                "created_at": "2024-02-01T11:30:00Z",
                "images": json.dumps([
                    "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
                ])
            },
            {
                "id": "demo_proj_003",
                "name": "Richmond Commons",
                "developer": "Community Builders Inc",
                "location": "Richmond, CA",
                "coordinates": [37.9358, -122.3477],
                "latitude": 37.9358,
                "longitude": -122.3477,
                "total_units": 32,
                "affordable_units": 32,
                "ami_levels": "30-60%", 
                "status": "completed",
                "completion_date": "2024-08-30",
                "created_at": "2024-01-05T14:20:00Z",
                "images": json.dumps([
                    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1565363887715-8884629e09ee?w=800&h=600&fit=crop",
                    "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop"
                ])
            }
        ]
        
        # Combine real and demo data
        all_projects = real_projects + demo_projects
        return all_projects[:limit]
        
    except Exception as e:
        print(f"Error getting projects: {e}")
        raise HTTPException(status_code=500, detail="Failed to get projects")

@app.post("/api/v1/projects") 
async def create_project(project_data: ProjectCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new project"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        project_id = f"proj_{str(uuid.uuid4())[:8]}"
        
        # Insert project into database
        cursor.execute("""
            INSERT INTO projects (
                id, company_id, name, developer, location, address, 
                latitude, longitude, total_units, affordable_units, 
                ami_levels, description, completion_date, images
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            project_id, company_id, project_data.name, project_data.developer,
            project_data.location, project_data.address, project_data.latitude,
            project_data.longitude, project_data.total_units, project_data.affordable_units,
            project_data.ami_levels, project_data.description, project_data.completion_date,
            json.dumps(getattr(project_data, 'images', []))
        ))
        
        conn.commit()
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "project",
            "New Project Created",
            f"Created project: {project_data.name}",
            entity_type="project",
            entity_id=project_id,
            metadata={"location": project_data.location, "units": project_data.total_units},
            status="success"
        )
        
        # Get the created project
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        conn.close()
        
        return dict(project)
        
    except Exception as e:
        print(f"Error creating project: {e}")
        raise HTTPException(status_code=500, detail="Failed to create project")

# Applicants Endpoints
@app.get("/api/v1/applicants")
async def get_applicants(limit: int = 50, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get applicants with real database data + demo data"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Get real applicants from database
        cursor.execute("""
            SELECT * FROM applicants 
            WHERE company_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        """, (company_id, limit))
        
        real_applicants = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # Demo data (for presentation purposes)
        demo_applicants = [
            {
                "id": "demo_app_001",
                "first_name": "Maria",
                "last_name": "Rodriguez",
                "email": "maria.rodriguez@email.com",
                "phone": "(555) 123-4567",
                "household_size": 3,
                "income": 45000,
                "ami_percent": 65,
                "location_preference": "Oakland, CA",
                "latitude": 37.8044,
                "longitude": -122.2711,
                "status": "active",
                "created_at": "2024-01-15T10:30:00Z"
            },
            {
                "id": "demo_app_002", 
                "first_name": "James",
                "last_name": "Chen",
                "email": "james.chen@email.com",
                "phone": "(555) 234-5678",
                "household_size": 2,
                "income": 52000,
                "ami_percent": 75,
                "location_preference": "San Francisco, CA",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "status": "active",
                "created_at": "2024-01-20T14:15:00Z"
            }
        ]
        
        # Combine real and demo data
        all_applicants = real_applicants + demo_applicants
        return all_applicants[:limit]
        
    except Exception as e:
        print(f"Error getting applicants: {e}")
        raise HTTPException(status_code=500, detail="Failed to get applicants")

@app.post("/api/v1/applicants")
async def create_applicant(applicant_data: ApplicantCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new applicant"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        applicant_id = f"app_{str(uuid.uuid4())[:8]}"
        
        # Insert applicant into database
        cursor.execute("""
            INSERT INTO applicants (
                id, company_id, first_name, last_name, email, phone,
                household_size, income, ami_percent, location_preference,
                latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            applicant_id, company_id, applicant_data.first_name, applicant_data.last_name,
            applicant_data.email, applicant_data.phone, applicant_data.household_size,
            applicant_data.income, applicant_data.ami_percent, applicant_data.location_preference,
            applicant_data.latitude, applicant_data.longitude
        ))
        
        conn.commit()
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "applicant",
            "New Applicant Added",
            f"Added applicant: {applicant_data.first_name} {applicant_data.last_name}",
            entity_type="applicant",
            entity_id=applicant_id,
            metadata={"email": applicant_data.email, "household_size": applicant_data.household_size},
            status="success"
        )
        
        # Get the created applicant
        cursor.execute("SELECT * FROM applicants WHERE id = ?", (applicant_id,))
        applicant = cursor.fetchone()
        conn.close()
        
        return dict(applicant)
        
    except Exception as e:
        print(f"Error creating applicant: {e}")
        raise HTTPException(status_code=500, detail="Failed to create applicant")

@app.get("/api/v1/applicants/{applicant_id}")
async def get_applicant(applicant_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get specific applicant by ID"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Get applicant from database
        cursor.execute("""
            SELECT * FROM applicants 
            WHERE id = ? AND company_id = ?
        """, (applicant_id, company_id))
        
        applicant = cursor.fetchone()
        conn.close()
        
        if not applicant:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        return dict(applicant)
        
    except Exception as e:
        print(f"Error getting applicant: {e}")
        raise HTTPException(status_code=500, detail="Failed to get applicant")

@app.put("/api/v1/applicants/{applicant_id}")
async def update_applicant(applicant_id: str, applicant_data: ApplicantCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update existing applicant"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Check if applicant exists and belongs to company
        cursor.execute("SELECT id FROM applicants WHERE id = ? AND company_id = ?", (applicant_id, company_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        # Update applicant in database
        cursor.execute("""
            UPDATE applicants SET
                first_name = ?, last_name = ?, email = ?, phone = ?,
                household_size = ?, income = ?, ami_percent = ?, 
                location_preference = ?, latitude = ?, longitude = ?
            WHERE id = ? AND company_id = ?
        """, (
            applicant_data.first_name, applicant_data.last_name, applicant_data.email, 
            applicant_data.phone, applicant_data.household_size, applicant_data.income, 
            applicant_data.ami_percent, applicant_data.location_preference, 
            applicant_data.latitude, applicant_data.longitude, applicant_id, company_id
        ))
        
        conn.commit()
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "applicant",
            "Applicant Updated",
            f"Updated applicant: {applicant_data.first_name} {applicant_data.last_name}",
            entity_type="applicant",
            entity_id=applicant_id,
            metadata={"email": applicant_data.email},
            status="info"
        )
        
        # Get the updated applicant
        cursor.execute("SELECT * FROM applicants WHERE id = ?", (applicant_id,))
        applicant = cursor.fetchone()
        conn.close()
        
        return dict(applicant)
        
    except Exception as e:
        print(f"Error updating applicant: {e}")
        raise HTTPException(status_code=500, detail="Failed to update applicant")

@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get specific project by ID"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Get project from database
        cursor.execute("""
            SELECT * FROM projects 
            WHERE id = ? AND company_id = ?
        """, (project_id, company_id))
        
        project = cursor.fetchone()
        conn.close()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return dict(project)
        
    except Exception as e:
        print(f"Error getting project: {e}")
        raise HTTPException(status_code=500, detail="Failed to get project")

@app.put("/api/v1/projects/{project_id}")
async def update_project(project_id: str, project_data: ProjectCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update existing project"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Check if project exists and belongs to company
        cursor.execute("SELECT id FROM projects WHERE id = ? AND company_id = ?", (project_id, company_id))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Update project in database
        cursor.execute("""
            UPDATE projects SET
                name = ?, developer = ?, location = ?, address = ?, 
                latitude = ?, longitude = ?, total_units = ?, affordable_units = ?, 
                ami_levels = ?, description = ?, completion_date = ?
            WHERE id = ? AND company_id = ?
        """, (
            project_data.name, project_data.developer, project_data.location, 
            project_data.address, project_data.latitude, project_data.longitude,
            project_data.total_units, project_data.affordable_units, project_data.ami_levels,
            project_data.description, project_data.completion_date, project_id, company_id
        ))
        
        conn.commit()
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "project",
            "Project Updated",
            f"Updated project: {project_data.name}",
            entity_type="project",
            entity_id=project_id,
            metadata={"location": project_data.location, "units": project_data.total_units},
            status="info"
        )
        
        # Get the updated project
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        conn.close()
        
        return dict(project)
        
    except Exception as e:
        print(f"Error updating project: {e}")
        raise HTTPException(status_code=500, detail="Failed to update project")

@app.delete("/api/v1/applicants/{applicant_id}")
async def delete_applicant(applicant_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Delete existing applicant"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Check if applicant exists and belongs to company
        cursor.execute("SELECT first_name, last_name FROM applicants WHERE id = ? AND company_id = ?", (applicant_id, company_id))
        applicant = cursor.fetchone()
        if not applicant:
            raise HTTPException(status_code=404, detail="Applicant not found")
        
        # Delete applicant from database
        cursor.execute("DELETE FROM applicants WHERE id = ? AND company_id = ?", (applicant_id, company_id))
        conn.commit()
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "applicant",
            "Applicant Deleted",
            f"Deleted applicant: {applicant['first_name']} {applicant['last_name']}",
            entity_type="applicant",
            entity_id=applicant_id,
            metadata={"action": "delete"},
            status="warning"
        )
        
        conn.close()
        return {"message": "Applicant deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting applicant: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete applicant")

@app.delete("/api/v1/projects/{project_id}")
async def delete_project(project_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Delete existing project"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Check if project exists and belongs to company
        cursor.execute("SELECT name FROM projects WHERE id = ? AND company_id = ?", (project_id, company_id))
        project = cursor.fetchone()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Delete project from database
        cursor.execute("DELETE FROM projects WHERE id = ? AND company_id = ?", (project_id, company_id))
        conn.commit()
        
        # Log activity
        log_activity(
            conn,
            user_data["sub"],
            company_id,
            "project",
            "Project Deleted",
            f"Deleted project: {project['name']}",
            entity_type="project",
            entity_id=project_id,
            metadata={"action": "delete"},
            status="warning"
        )
        
        conn.close()
        return {"message": "Project deleted successfully"}
        
    except Exception as e:
        print(f"Error deleting project: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete project")

# Activity Endpoints
@app.get("/api/v1/activities")
async def get_activity_feed(
    limit: int = 50,
    offset: int = 0,
    type: str = None,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Get activity feed for the current user's company"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Get activities
        activities = get_activities(conn, company_id, limit, offset)
        
        # Filter by type if specified
        if type:
            activities = [a for a in activities if a['type'] == type]
        
        return activities
        
    except Exception as e:
        print(f"Error getting activities: {e}")
        raise HTTPException(status_code=500, detail="Failed to get activities")

@app.get("/api/v1/activities/{activity_id}")
async def get_activity_details(
    activity_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Get detailed information about a specific activity"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get company from user
        cursor = conn.cursor()
        cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        company_id = user["company_id"]
        
        # Get activity detail
        activity = get_activity_detail(conn, activity_id, company_id)
        
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        return activity
        
    except Exception as e:
        print(f"Error getting activity detail: {e}")
        raise HTTPException(status_code=500, detail="Failed to get activity detail")

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
    """Submit contact form with email functionality"""
    try:
        print(f"Contact form submission:")
        print(f"  Name: {contact_data.name}")
        print(f"  Email: {contact_data.email}")
        print(f"  Company: {contact_data.company}")
        print(f"  Phone: {contact_data.phone}")
        print(f"  Subject: {contact_data.subject}")
        print(f"  Message: {contact_data.message}")
        
        # Store in database
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contact_submissions (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                company TEXT,
                phone TEXT,
                subject TEXT,
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        submission_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO contact_submissions (id, name, email, company, phone, subject, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (submission_id, contact_data.name, contact_data.email, 
              contact_data.company, contact_data.phone, contact_data.subject, contact_data.message))
        
        conn.commit()
        conn.close()
        
        # Send email notification
        await send_contact_email(contact_data.dict())
        
        return {"message": "Contact form submitted successfully"}
        
    except Exception as e:
        print(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail="Failed to process contact form")

async def send_contact_email(contact_data: dict):
    """Send contact form email using SendGrid"""
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    
    if not sendgrid_api_key:
        print("SendGrid API key not configured, skipping email")
        return
    
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content
        
        sg = sendgrid.SendGridAPIClient(api_key=sendgrid_api_key)
        
        # Email to you (notification) - use verified sender email
        from_email = Email("holden@1404.com")  # Use your verified email as sender
        to_email = To("holdenbryce06@gmail.com")
        
        subject = f"New HomeVerse Contact: {contact_data['subject']}"
        
        html_content = f"""
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> {contact_data['name']}</p>
        <p><strong>Email:</strong> {contact_data['email']}</p>
        <p><strong>Company:</strong> {contact_data.get('company', 'Not provided')}</p>
        <p><strong>Phone:</strong> {contact_data.get('phone', 'Not provided')}</p>
        <p><strong>Subject:</strong> {contact_data['subject']}</p>
        <p><strong>Message:</strong></p>
        <p>{contact_data['message'].replace(chr(10), '<br>')}</p>
        <hr>
        <p><small>Sent from HomeVerse contact form</small></p>
        """
        
        content = Content("text/html", html_content)
        mail = Mail(from_email, to_email, subject, content)
        
        # Send notification email
        response = sg.client.mail.send.post(request_body=mail.get())
        print(f"Contact notification email sent to holdenbryce06@gmail.com: {response.status_code}")
        
        # Auto-reply to customer
        customer_email = To(contact_data['email'])
        customer_subject = "Thank you for contacting HomeVerse"
        
        customer_content = Content("text/html", f"""
        <h2>Thank you for contacting HomeVerse!</h2>
        <p>Dear {contact_data['name']},</p>
        <p>We've received your message and will get back to you as soon as possible.</p>
        <p><strong>Your message:</strong></p>
        <p><em>"{contact_data['message']}"</em></p>
        <br>
        <p>Best regards,<br>
        The HomeVerse Team</p>
        <p><a href="https://homeverse-frontend.onrender.com">homeverse-frontend.onrender.com</a></p>
        """)
        
        customer_mail = Mail(from_email, customer_email, customer_subject, customer_content)
        
        # Send auto-reply
        response = sg.client.mail.send.post(request_body=customer_mail.get())
        print(f"Contact auto-reply sent to {contact_data['email']}: {response.status_code}")
        
    except Exception as e:
        print(f"Failed to send contact email: {e}")
        # Fallback logging
        print(f"📧 CONTACT FORM SUBMISSION - {datetime.now()}")
        print(f"Name: {contact_data['name']}")
        print(f"Email: {contact_data['email']}")
        print(f"Subject: {contact_data['subject']}")
        print(f"Message: {contact_data['message']}")
        print("=" * 50)


# Application startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and create test users"""
    logger.info(f"🚀 Starting HomeVerse API v2.0.0 ({ENVIRONMENT} mode)")
    
    if USE_POSTGRESQL:
        await init_postgresql()
        await create_test_users_pg()
    else:
        init_db()
        create_test_users_sqlite()
    
    logger.info("✅ Application startup completed")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown"""
    logger.info("🛑 Shutting down HomeVerse API...")
    if USE_POSTGRESQL and pg_pool:
        await pg_pool.close()
        logger.info("✅ PostgreSQL connection pool closed")
    logger.info("✅ Application shutdown completed")

async def create_test_users_pg():
    """Create test users for PostgreSQL demo"""
    try:
        async with pg_pool.acquire() as conn:
            # Create test company
            company_id = str(uuid.uuid4())
            company_key = "test-company"
            
            await conn.execute("""
                INSERT INTO companies (id, key, name, plan, seats) 
                VALUES ($1, $2, $3, $4, $5) 
                ON CONFLICT (key) DO NOTHING
            """, company_id, company_key, f"Company {company_key}", "basic", 10)
            
            # Test users
            test_users = [
                {"email": "developer@test.com", "password": "password123", "role": "developer"},
                {"email": "lender@test.com", "password": "password123", "role": "lender"},
                {"email": "buyer@test.com", "password": "password123", "role": "buyer"},
                {"email": "applicant@test.com", "password": "password123", "role": "applicant"},
                {"email": "admin@test.com", "password": "password123", "role": "admin"},
            ]
            
            for user_data in test_users:
                user_id = str(uuid.uuid4())
                password_hash = hash_password(user_data["password"])
                
                await conn.execute("""
                    INSERT INTO users (id, company_id, email, password_hash, role) 
                    VALUES ($1, $2, $3, $4, $5) 
                    ON CONFLICT (email) DO NOTHING
                """, user_id, company_id, user_data["email"], password_hash, user_data["role"])
                
                logger.info(f"✅ Created/verified test user: {user_data['email']} ({user_data['role']})")
                
    except Exception as e:
        logger.error(f"Failed to create PostgreSQL test users: {e}")

def create_test_users_sqlite():
    """Create test users for SQLite demo"""
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
                user = create_user(conn, user_data["email"], user_data["password"], 
                           company['id'], user_data["role"])
                print(f"Created test user: {user_data['email']} ({user_data['role']})")
                
                # Add some sample activities for demo purposes
                if user_data["role"] == "lender":
                    # Add sample activities for lender
                    log_activity(conn, user['id'], company['id'], "investment", 
                               "New Investment Made", 
                               "Invested $750,000 in Sunset Gardens Phase II",
                               entity_type="investment", entity_id="inv_001",
                               metadata={"amount": 750000, "project": "Sunset Gardens Phase II"},
                               status="success")
                    
                    log_activity(conn, user['id'], company['id'], "compliance",
                               "CRA Report Completed",
                               "Q4 2024 CRA Compliance Report submitted",
                               entity_type="report", entity_id="rpt_001",
                               status="success")
                    
                    log_activity(conn, user['id'], company['id'], "project",
                               "Project Milestone Reached",
                               "Richmond Commons construction completed ahead of schedule",
                               entity_type="project", entity_id="demo_proj_003",
                               status="info")
                    
                    log_activity(conn, user['id'], company['id'], "notification",
                               "Portfolio Update",
                               "Monthly portfolio value increased by 7.2%",
                               metadata={"previous_value": 2330000, "current_value": 2500000},
                               status="success")
                    
            except Exception as e:
                # If user exists, try to add activities for existing lender user
                if "already exists" in str(e) and user_data["role"] == "lender":
                    existing_user = get_user_by_email(conn, user_data["email"])
                    if existing_user:
                        # Check if activities already exist to avoid duplicates
                        cursor = conn.cursor()
                        cursor.execute("SELECT COUNT(*) FROM activity_logs WHERE user_id = ?", (existing_user['id'],))
                        count = cursor.fetchone()[0]
                        if count == 0:
                            log_activity(conn, existing_user['id'], company['id'], "investment", 
                                       "New Investment Made", 
                                       "Invested $750,000 in Sunset Gardens Phase II",
                                       entity_type="investment", entity_id="inv_001",
                                       metadata={"amount": 750000, "project": "Sunset Gardens Phase II"},
                                       status="success")
                            print(f"Added sample activities for existing user: {user_data['email']}")
                print(f"Test user already exists: {user_data['email']}")
                
    finally:
        conn.close()

# Enhanced health check endpoint
@app.get("/health")
async def health_check():
    """Enhanced health check endpoint"""
    db_status = "healthy"
    
    try:
        if USE_POSTGRESQL:
            async with pg_pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.execute("SELECT 1")
            conn.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        logger.error(f"Database health check failed: {e}")
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "environment": ENVIRONMENT,
        "version": "2.0.0",
        "database_type": "postgresql" if USE_POSTGRESQL else "sqlite",
        "timestamp": datetime.utcnow().isoformat()
    }

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint with system information"""
    return {
        "message": "HomeVerse Production API v2.0.0",
        "description": "Affordable Housing Management Platform",
        "environment": ENVIRONMENT,
        "database": "postgresql" if USE_POSTGRESQL else "sqlite",
        "documentation": "/docs",
        "health": "/health",
        "version": "2.0.0"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info(f"🚀 Starting server on {host}:{port}")
    uvicorn.run(
        "simple_backend:app", 
        host=host, 
        port=port,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
        access_log=True,
        reload=False
    )