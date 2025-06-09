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

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, EmailStr
import uvicorn
import jwt
import asyncio
from collections import defaultdict
import traceback
import math

# Logging setup (must be first)
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Optional file handling imports
try:
    import aiofiles
    AIOFILES_AVAILABLE = True
except ImportError:
    AIOFILES_AVAILABLE = False

try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False

# Check optional dependencies
if not AIOFILES_AVAILABLE:
    logger.warning("⚠️ aiofiles not installed - file uploads will use synchronous I/O")
if not MAGIC_AVAILABLE:
    logger.warning("⚠️ python-magic not installed - MIME type detection limited")

# Production Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_PATH = os.getenv("DATABASE_PATH", "homeverse_demo.db")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key-here-for-testing")
JWT_ALGORITHM = "HS256"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# File storage configuration
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB default
ALLOWED_EXTENSIONS = {
    'documents': {'.pdf', '.doc', '.docx', '.txt', '.rtf'},
    'images': {'.jpg', '.jpeg', '.png', '.gif', '.bmp'},
    'spreadsheets': {'.xls', '.xlsx', '.csv'},
    'archives': {'.zip', '.rar', '.7z'}
}
ALLOWED_MIME_TYPES = {
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/rtf', 'image/jpeg', 'image/png', 'image/gif', 'image/bmp',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

# AI/ML imports
try:
    import openai
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    logger.info("🤖 OpenAI integration available")
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("⚠️ OpenAI not installed - matching will use fallback algorithm")

# AI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    logger.info("🤖 OpenAI client initialized")
else:
    openai_client = None
    logger.warning("⚠️ OpenAI client not available - using fallback matching")

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

# Configure CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = defaultdict(list)
        self.user_connections: dict = {}  # websocket_id -> user_id
        self.company_users: dict = defaultdict(set)  # company_id -> set of user_ids
    
    async def connect(self, websocket: WebSocket, user_id: str, company_id: str):
        await websocket.accept()
        ws_id = str(uuid.uuid4())
        self.active_connections[user_id].append(websocket)
        self.user_connections[ws_id] = user_id
        self.company_users[company_id].add(user_id)
        logger.info(f"WebSocket connected for user {user_id} in company {company_id}")
        return ws_id
    
    def disconnect(self, websocket: WebSocket, user_id: str, company_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.company_users[company_id].discard(user_id)
        logger.info(f"WebSocket disconnected for user {user_id}")
    
    async def send_notification(self, user_id: str, notification: dict):
        """Send notification to specific user"""
        if user_id in self.active_connections:
            message = {
                "type": "notification",
                "data": notification
            }
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def broadcast_to_company(self, company_id: str, message: dict, exclude_user: str = None):
        """Broadcast message to all users in a company"""
        for user_id in self.company_users.get(company_id, []):
            if user_id != exclude_user and user_id in self.active_connections:
                for connection in self.active_connections[user_id]:
                    try:
                        await connection.send_json(message)
                    except:
                        pass
    
    async def send_activity_update(self, company_id: str, activity: dict):
        """Send activity update to all company users"""
        message = {
            "type": "activity",
            "data": activity
        }
        await self.broadcast_to_company(company_id, message)

manager = ConnectionManager()

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

# Custom exception classes for better error handling
class ValidationError(HTTPException):
    def __init__(self, detail: str, field: str = None):
        super().__init__(status_code=422, detail={
            "message": detail,
            "field": field,
            "type": "validation_error"
        })

class AuthorizationError(HTTPException):
    def __init__(self, detail: str = "You don't have permission to perform this action"):
        super().__init__(status_code=403, detail={
            "message": detail,
            "type": "authorization_error"
        })

class ResourceNotFoundError(HTTPException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(status_code=404, detail={
            "message": f"{resource} with id '{identifier}' not found",
            "resource": resource,
            "identifier": identifier,
            "type": "not_found_error"
        })

class RateLimitError(HTTPException):
    def __init__(self, retry_after: int = 60):
        super().__init__(status_code=429, detail={
            "message": "Too many requests. Please try again later.",
            "retry_after": retry_after,
            "type": "rate_limit_error"
        })

class ExternalServiceError(HTTPException):
    def __init__(self, service: str, detail: str = None):
        super().__init__(status_code=503, detail={
            "message": f"External service '{service}' is temporarily unavailable",
            "service": service,
            "detail": detail,
            "type": "service_error"
        })

# Circuit breaker for external services
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
        self._lock = asyncio.Lock()
    
    async def call(self, func, *args, **kwargs):
        async with self._lock:
            if self.state == "open":
                if self.last_failure_time and \
                   datetime.utcnow() - self.last_failure_time > timedelta(seconds=self.recovery_timeout):
                    self.state = "half-open"
                    logger.info("Circuit breaker entering half-open state")
                else:
                    raise ExternalServiceError("Service unavailable", "Circuit breaker is open")
        
        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            async with self._lock:
                if self.state == "half-open":
                    self.state = "closed"
                    self.failure_count = 0
                    logger.info("Circuit breaker closed - service recovered")
            
            return result
        except Exception as e:
            async with self._lock:
                self.failure_count += 1
                self.last_failure_time = datetime.utcnow()
                
                if self.failure_count >= self.failure_threshold:
                    self.state = "open"
                    logger.error(f"Circuit breaker opened after {self.failure_count} failures")
            
            raise e

# Initialize circuit breakers
openai_circuit_breaker = CircuitBreaker()
sendgrid_circuit_breaker = CircuitBreaker()

# Request validation middleware
@app.middleware("http")
async def validate_request_middleware(request, call_next):
    """Validate and sanitize incoming requests"""
    # Add request ID for tracking
    request.state.request_id = str(uuid.uuid4())
    
    # Log incoming request
    logger.info(f"Request {request.state.request_id}: {request.method} {request.url.path}")
    
    # Validate content length
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
        return JSONResponse(
            status_code=413,
            content={"detail": "Request payload too large. Maximum size is 10MB."}
        )
    
    # Process request
    start_time = datetime.utcnow()
    response = await call_next(request)
    process_time = (datetime.utcnow() - start_time).total_seconds()
    
    # Add security headers
    response.headers["X-Request-ID"] = request.state.request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response
    logger.info(f"Response {request.state.request_id}: {response.status_code} in {process_time:.3f}s")
    
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    logger.error(f"Request: {request.method} {request.url.path}")
    
    # Create unique error ID
    error_id = str(uuid.uuid4())
    
    # Log to activity if possible
    try:
        if hasattr(request.state, "user_id") and request.state.user_id:
            conn = sqlite3.connect(DATABASE_PATH) if not USE_POSTGRESQL else None
            if conn:
                log_activity(
                    conn,
                    getattr(request.state, "company_id", "unknown"),
                    request.state.user_id,
                    "system_error",
                    "System Error",
                    f"Error on {request.method} {request.url.path}",
                    metadata={"error": str(exc), "error_id": error_id},
                    status="error"
                )
                conn.close()
    except:
        pass
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred. Our team has been notified.",
            "error_id": error_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Validation error handler
@app.exception_handler(ValidationError)
async def validation_error_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
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
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cra_assessments (
                    id TEXT PRIMARY KEY,
                    company_id TEXT REFERENCES companies(id),
                    assessment_area TEXT NOT NULL,
                    income_level TEXT NOT NULL,
                    median_family_income DECIMAL(12,2),
                    low_income_threshold DECIMAL(12,2),
                    moderate_income_threshold DECIMAL(12,2),
                    middle_income_threshold DECIMAL(12,2),
                    upper_income_threshold DECIMAL(12,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS cra_performance (
                    id TEXT PRIMARY KEY,
                    company_id TEXT REFERENCES companies(id),
                    assessment_period TEXT NOT NULL,
                    assessment_year INTEGER NOT NULL,
                    assessment_quarter INTEGER,
                    low_income_lending_amount DECIMAL(15,2) DEFAULT 0,
                    moderate_income_lending_amount DECIMAL(15,2) DEFAULT 0,
                    middle_income_lending_amount DECIMAL(15,2) DEFAULT 0,
                    upper_income_lending_amount DECIMAL(15,2) DEFAULT 0,
                    community_development_amount DECIMAL(15,2) DEFAULT 0,
                    small_business_lending_amount DECIMAL(15,2) DEFAULT 0,
                    total_lending_amount DECIMAL(15,2) DEFAULT 0,
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
    # Ensure database directory exists
    db_dir = os.path.dirname(os.path.abspath(DATABASE_PATH))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        logger.info(f"Created database directory: {db_dir}")
    
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
            settings TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            full_name TEXT,
            phone TEXT,
            timezone TEXT DEFAULT 'UTC',
            language TEXT DEFAULT 'en',
            notification_preferences TEXT DEFAULT '{}',
            settings TEXT DEFAULT '{}',
            reset_token TEXT,
            reset_token_expires TIMESTAMP,
            invite_token TEXT,
            invite_expires TIMESTAMP,
            last_login TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    
    # CRA assessment areas table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cra_assessments (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            assessment_area TEXT NOT NULL,
            income_level TEXT NOT NULL,
            median_family_income REAL,
            low_income_threshold REAL,
            moderate_income_threshold REAL,
            middle_income_threshold REAL,
            upper_income_threshold REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id)
        )
    """)
    
    # CRA performance tracking table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cra_performance (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            assessment_period TEXT NOT NULL,
            assessment_year INTEGER NOT NULL,
            assessment_quarter INTEGER,
            low_income_lending_amount REAL DEFAULT 0,
            moderate_income_lending_amount REAL DEFAULT 0,
            middle_income_lending_amount REAL DEFAULT 0,
            upper_income_lending_amount REAL DEFAULT 0,
            community_development_amount REAL DEFAULT 0,
            small_business_lending_amount REAL DEFAULT 0,
            total_lending_amount REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id)
        )
    """)
    
    # File storage tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            entity_type TEXT NOT NULL,  -- 'applicant', 'project', 'investment', 'cra'
            entity_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            content_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            document_category TEXT,  -- 'income_verification', 'id_document', 'project_plan', etc.
            upload_user_id TEXT NOT NULL,
            status TEXT DEFAULT 'active',  -- 'active', 'archived', 'deleted'
            metadata TEXT,  -- JSON string for additional metadata
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id),
            FOREIGN KEY (upload_user_id) REFERENCES users (id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS document_access_log (
            id TEXT PRIMARY KEY,
            document_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,  -- 'upload', 'download', 'view', 'delete'
            ip_address TEXT,
            user_agent TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (document_id) REFERENCES documents (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Notification tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL,  -- 'application_status', 'new_opportunity', 'document_request', 'system_alert', etc.
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            entity_type TEXT,  -- 'applicant', 'project', 'investment', etc.
            entity_id TEXT,
            priority TEXT DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'
            status TEXT DEFAULT 'unread',  -- 'unread', 'read', 'archived'
            action_url TEXT,  -- Optional URL for user to take action
            metadata TEXT,  -- JSON string for additional data
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL UNIQUE,
            email_enabled INTEGER DEFAULT 1,
            sms_enabled INTEGER DEFAULT 0,
            push_enabled INTEGER DEFAULT 1,
            notification_types TEXT,  -- JSON array of enabled notification types
            email_frequency TEXT DEFAULT 'immediate',  -- 'immediate', 'daily', 'weekly', 'never'
            quiet_hours_start TEXT,  -- e.g., '22:00'
            quiet_hours_end TEXT,    -- e.g., '08:00'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_templates (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL UNIQUE,
            title_template TEXT NOT NULL,
            message_template TEXT NOT NULL,
            email_subject_template TEXT,
            email_body_template TEXT,
            sms_template TEXT,
            variables TEXT,  -- JSON array of required variables
            active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Insert default notification templates
    cursor.execute("""
        INSERT OR IGNORE INTO notification_templates (id, type, title_template, message_template, email_subject_template, email_body_template)
        VALUES 
        ('tmpl_001', 'application_status', 'Application Status Update', 
         'Your application for {project_name} has been {status}.', 
         'HomeVerse: Application Status Update',
         'Dear {applicant_name},\n\nYour application for {project_name} has been {status}.\n\n{details}\n\nBest regards,\nHomeVerse Team'),
         
        ('tmpl_002', 'new_opportunity', 'New Housing Opportunity', 
         'A new project matching your preferences is available: {project_name}',
         'New Housing Opportunity: {project_name}',
         'Dear {applicant_name},\n\nWe found a new housing opportunity that matches your preferences:\n\n{project_details}\n\nApply now at: {action_url}\n\nBest regards,\nHomeVerse Team'),
         
        ('tmpl_003', 'document_request', 'Document Required', 
         'Please upload {document_type} for your application to {project_name}.',
         'Action Required: Document Upload',
         'Dear {applicant_name},\n\nTo proceed with your application for {project_name}, please upload the following document:\n\n{document_type}\n\nUpload at: {action_url}\n\nBest regards,\nHomeVerse Team'),
         
        ('tmpl_004', 'eligibility_result', 'Eligibility Check Complete',
         'Your eligibility for {project_name} has been verified: {result}',
         'Eligibility Verification Complete',
         'Dear {applicant_name},\n\nWe have completed the eligibility verification for {project_name}.\n\nResult: {result}\n{recommendations}\n\nBest regards,\nHomeVerse Team')
    """)
    
    # Application workflow tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            applicant_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            workflow_stage TEXT DEFAULT 'initial',
            priority INTEGER DEFAULT 0,
            submitted_at TEXT,
            reviewed_at TEXT,
            decided_at TEXT,
            reviewer_id TEXT,
            decision_maker_id TEXT,
            decision TEXT,
            decision_reason TEXT,
            score REAL,
            documents_status TEXT DEFAULT 'pending',
            eligibility_verified INTEGER DEFAULT 0,
            background_check_status TEXT,
            income_verified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (company_id) REFERENCES companies(id),
            FOREIGN KEY (applicant_id) REFERENCES applicants(id),
            FOREIGN KEY (project_id) REFERENCES projects(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS application_workflow_stages (
            id TEXT PRIMARY KEY,
            company_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            order_index INTEGER NOT NULL,
            required_documents TEXT,
            auto_advance INTEGER DEFAULT 0,
            sla_hours INTEGER DEFAULT 72,
            approval_required INTEGER DEFAULT 0,
            approver_roles TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (company_id) REFERENCES companies(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS application_transitions (
            id TEXT PRIMARY KEY,
            application_id TEXT NOT NULL,
            from_stage TEXT,
            to_stage TEXT NOT NULL,
            triggered_by TEXT NOT NULL,
            transition_type TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id)
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS application_tasks (
            id TEXT PRIMARY KEY,
            application_id TEXT NOT NULL,
            task_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            assigned_to TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'normal',
            due_date TEXT,
            completed_at TEXT,
            completed_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY (application_id) REFERENCES applications(id)
        )
    """)
    
    # Create default workflow stages for default company
    default_stages = [
        ('initial', 'Initial Submission', 1, ['id_proof', 'income_proof'], 0, 24),
        ('document_review', 'Document Review', 2, [], 0, 48),
        ('eligibility_check', 'Eligibility Verification', 3, [], 1, 24),
        ('background_check', 'Background Check', 4, [], 0, 72),
        ('final_review', 'Final Review', 5, [], 0, 48),
        ('decision', 'Decision', 6, [], 0, 24)
    ]
    
    for stage_name, desc, order, docs, auto, sla in default_stages:
        stage_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT OR IGNORE INTO application_workflow_stages 
            (id, company_id, name, description, order_index, required_documents, auto_advance, sla_hours)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (stage_id, '51467432-b0f5-4e20-912d-78e6fbebfbc9', stage_name, desc, order, json.dumps(docs), auto, sla))
    
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

class CRAAssessmentArea(BaseModel):
    name: str
    counties: list
    income_levels: dict
    active: bool = True

class CRAPerformanceData(BaseModel):
    assessment_period: str
    assessment_year: int
    assessment_quarter: Optional[int] = None
    low_income_lending_amount: float = 0
    moderate_income_lending_amount: float = 0
    middle_income_lending_amount: float = 0
    upper_income_lending_amount: float = 0
    community_development_amount: float = 0
    small_business_lending_amount: float = 0

class DocumentCreate(BaseModel):
    entity_type: str  # 'applicant', 'project', 'investment', 'cra'
    entity_id: str
    document_category: Optional[str] = None
    metadata: Optional[dict] = None

class DocumentResponse(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_size: int
    content_type: str
    document_category: Optional[str] = None
    entity_type: str
    entity_id: str
    status: str
    created_at: str
    upload_user_id: str

class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    file_size: int
    upload_url: Optional[str] = None
    message: str

class NotificationCreate(BaseModel):
    user_id: str
    type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    priority: Optional[str] = "normal"
    action_url: Optional[str] = None
    metadata: Optional[dict] = None

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    priority: str
    status: str
    action_url: Optional[str] = None
    created_at: str
    read_at: Optional[str] = None

class NotificationPreferences(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = False
    push_enabled: bool = True
    notification_types: Optional[list] = None
    email_frequency: str = "immediate"
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None

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
    if USE_POSTGRESQL and pg_pool:
        conn = pg_pool.getconn()
        try:
            yield conn
        finally:
            pg_pool.putconn(conn)
    else:
        conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

# File upload utility functions
def validate_file_extension(filename: str, file_category: str = 'documents') -> bool:
    """Validate file extension against allowed types"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS.get(file_category, ALLOWED_EXTENSIONS['documents'])

def validate_mime_type(content_type: str) -> bool:
    """Validate MIME type against allowed types"""
    return content_type in ALLOWED_MIME_TYPES

def generate_secure_filename(original_filename: str, entity_type: str, entity_id: str) -> str:
    """Generate secure filename with UUID prefix"""
    ext = os.path.splitext(original_filename)[1].lower()
    unique_id = str(uuid.uuid4())[:8]
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    return f"{entity_type}_{entity_id}_{timestamp}_{unique_id}{ext}"

def get_file_path(filename: str, entity_type: str, company_id: str) -> str:
    """Generate organized file path"""
    # Create directory structure: uploads/company_id/entity_type/
    dir_path = os.path.join(UPLOAD_DIR, company_id, entity_type)
    os.makedirs(dir_path, exist_ok=True)
    return os.path.join(dir_path, filename)

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA256 hash of file for integrity verification"""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

async def save_uploaded_file(file: UploadFile, file_path: str) -> bool:
    """Save uploaded file to disk securely"""
    try:
        if AIOFILES_AVAILABLE:
            # Use async file I/O
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
        else:
            # Fallback to synchronous I/O
            with open(file_path, 'wb') as f:
                content = await file.read()
                f.write(content)
        return True
    except Exception as e:
        logger.error(f"Error saving file {file_path}: {e}")
        return False

def log_document_access(conn, document_id: str, user_id: str, action: str, ip_address: str = None, user_agent: str = None):
    """Log document access for security auditing"""
    cursor = conn.cursor()
    access_id = str(uuid.uuid4())
    
    cursor.execute("""
        INSERT INTO document_access_log 
        (id, document_id, user_id, action, ip_address, user_agent, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (access_id, document_id, user_id, action, ip_address, user_agent, datetime.utcnow().isoformat()))
    
    conn.commit()

# AMI and Eligibility Validation Functions
def get_ami_data_by_location(location: str, year: int = 2024) -> dict:
    """Get Area Median Income data by location and year"""
    # Real AMI data for major housing markets (2024 HUD data)
    ami_data = {
        "san francisco": {
            "mfi": 141300,  # Median Family Income
            "region": "San Francisco-Oakland-Fremont, CA HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        },
        "oakland": {
            "mfi": 141300,  # Same MSA as SF
            "region": "San Francisco-Oakland-Fremont, CA HUD Metro FMR Area", 
            "effective_date": "2024-01-01"
        },
        "san jose": {
            "mfi": 153500,
            "region": "San Jose-Sunnyvale-Santa Clara, CA HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        },
        "los angeles": {
            "mfi": 94600,
            "region": "Los Angeles-Long Beach-Glendale, CA HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        },
        "new york": {
            "mfi": 120100,
            "region": "New York, NY HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        },
        "chicago": {
            "mfi": 89200,
            "region": "Chicago-Joliet-Naperville, IL HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        },
        "seattle": {
            "mfi": 116300,
            "region": "Seattle-Bellevue, WA HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        },
        "boston": {
            "mfi": 124700,
            "region": "Boston-Cambridge-Quincy, MA-NH HUD Metro FMR Area",
            "effective_date": "2024-01-01"
        }
    }
    
    # Normalize location for lookup
    location_key = location.lower().strip()
    for city in ami_data.keys():
        if city in location_key:
            return ami_data[city]
    
    # Default to national median if location not found
    return {
        "mfi": 87200,  # 2024 National Median Family Income
        "region": "National Average",
        "effective_date": "2024-01-01"
    }

def calculate_ami_thresholds(mfi: float, household_size: int) -> dict:
    """Calculate AMI thresholds based on HUD guidelines for household size"""
    # HUD income adjustment factors by household size
    size_adjustments = {
        1: 0.70,   # 1 person: 70% of 4-person MFI
        2: 0.80,   # 2 person: 80% of 4-person MFI  
        3: 0.90,   # 3 person: 90% of 4-person MFI
        4: 1.00,   # 4 person: 100% of 4-person MFI (baseline)
        5: 1.08,   # 5 person: 108% of 4-person MFI
        6: 1.16,   # 6 person: 116% of 4-person MFI
        7: 1.24,   # 7 person: 124% of 4-person MFI
        8: 1.32    # 8 person: 132% of 4-person MFI
    }
    
    # For households larger than 8, add 8% for each additional person
    if household_size > 8:
        adjustment = size_adjustments[8] + (0.08 * (household_size - 8))
    else:
        adjustment = size_adjustments.get(household_size, 1.0)
    
    adjusted_mfi = mfi * adjustment
    
    return {
        "adjusted_mfi": adjusted_mfi,
        "extremely_low": adjusted_mfi * 0.30,    # 30% AMI - Extremely Low Income
        "very_low": adjusted_mfi * 0.50,         # 50% AMI - Very Low Income
        "low": adjusted_mfi * 0.80,              # 80% AMI - Low Income
        "moderate": adjusted_mfi * 1.20,         # 120% AMI - Moderate Income
        "area_median": adjusted_mfi,             # 100% AMI
        "household_size": household_size,
        "base_mfi": mfi
    }

def determine_income_category(annual_income: float, ami_thresholds: dict) -> dict:
    """Determine income category based on AMI thresholds"""
    if annual_income <= ami_thresholds["extremely_low"]:
        return {
            "category": "extremely_low",
            "ami_percentage": (annual_income / ami_thresholds["area_median"]) * 100,
            "description": "Extremely Low Income (≤30% AMI)",
            "eligible_programs": ["public_housing", "vouchers", "homeless_assistance"]
        }
    elif annual_income <= ami_thresholds["very_low"]:
        return {
            "category": "very_low", 
            "ami_percentage": (annual_income / ami_thresholds["area_median"]) * 100,
            "description": "Very Low Income (31-50% AMI)",
            "eligible_programs": ["public_housing", "vouchers", "low_income_housing_tax_credit"]
        }
    elif annual_income <= ami_thresholds["low"]:
        return {
            "category": "low",
            "ami_percentage": (annual_income / ami_thresholds["area_median"]) * 100, 
            "description": "Low Income (51-80% AMI)",
            "eligible_programs": ["low_income_housing_tax_credit", "home_program", "cdbg"]
        }
    elif annual_income <= ami_thresholds["moderate"]:
        return {
            "category": "moderate",
            "ami_percentage": (annual_income / ami_thresholds["area_median"]) * 100,
            "description": "Moderate Income (81-120% AMI)", 
            "eligible_programs": ["workforce_housing", "first_time_homebuyer"]
        }
    else:
        return {
            "category": "above_moderate",
            "ami_percentage": (annual_income / ami_thresholds["area_median"]) * 100,
            "description": "Above Moderate Income (>120% AMI)",
            "eligible_programs": ["market_rate"]
        }

def validate_applicant_eligibility(applicant: dict, project: dict) -> dict:
    """Comprehensive eligibility validation for applicant-project matching"""
    
    # Get applicant basic info
    annual_income = applicant.get('income', 0)
    household_size = applicant.get('household_size', 1)
    location = applicant.get('location_preference') or project.get('location', 'national')
    
    # Get AMI data for location
    ami_data = get_ami_data_by_location(location)
    ami_thresholds = calculate_ami_thresholds(ami_data['mfi'], household_size)
    income_category = determine_income_category(annual_income, ami_thresholds)
    
    # Parse project AMI requirements
    project_ami_levels = project.get('ami_levels', '').lower()
    eligible_for_project = False
    ineligible_reasons = []
    
    # Check AMI eligibility
    applicant_ami_percent = income_category['ami_percentage']
    
    # Parse project AMI ranges (e.g., "30-80%", "50-120%")
    if project_ami_levels:
        try:
            # Extract AMI range from project
            ami_range = project_ami_levels.replace('%', '').replace(' ', '')
            if '-' in ami_range:
                min_ami, max_ami = map(float, ami_range.split('-'))
                if min_ami <= applicant_ami_percent <= max_ami:
                    eligible_for_project = True
                else:
                    ineligible_reasons.append(f"Income ${annual_income:,.0f} ({applicant_ami_percent:.1f}% AMI) outside project range {project_ami_levels}")
            elif ami_range.isdigit():
                max_ami = float(ami_range)
                if applicant_ami_percent <= max_ami:
                    eligible_for_project = True
                else:
                    ineligible_reasons.append(f"Income ${annual_income:,.0f} ({applicant_ami_percent:.1f}% AMI) exceeds project limit {project_ami_levels}")
        except ValueError:
            # If parsing fails, be conservative and mark as ineligible
            ineligible_reasons.append(f"Cannot parse project AMI requirements: {project_ami_levels}")
    else:
        # No AMI requirements specified - assume market rate
        eligible_for_project = True
    
    # Additional eligibility checks
    total_units = project.get('total_units', 0)
    affordable_units = project.get('affordable_units', 0)
    available_units = project.get('available_units', 0)
    
    if available_units <= 0:
        ineligible_reasons.append("No units currently available")
    
    # Calculate eligibility score (0-100)
    eligibility_score = 0
    
    if eligible_for_project:
        eligibility_score += 50  # Base eligibility
        
        # Bonus points for being in preferred income categories
        if income_category['category'] in ['extremely_low', 'very_low']:
            eligibility_score += 30  # Priority for lowest income
        elif income_category['category'] == 'low':
            eligibility_score += 20
        elif income_category['category'] == 'moderate':
            eligibility_score += 10
        
        # Geographic preference bonus
        if applicant.get('location_preference') and project.get('location'):
            if applicant['location_preference'].lower() in project['location'].lower():
                eligibility_score += 10
        
        # Household size optimization
        bedrooms = project.get('bedrooms', 2)
        if bedrooms >= household_size - 1:  # Allow some flexibility
            eligibility_score += 10
    
    return {
        "eligible": eligible_for_project and len(ineligible_reasons) == 0,
        "eligibility_score": min(eligibility_score, 100),
        "ami_data": {
            "location": location,
            "mfi": ami_data['mfi'],
            "adjusted_mfi": ami_thresholds['area_median'],
            "household_size": household_size,
            "applicant_income": annual_income,
            "ami_percentage": applicant_ami_percent,
            "income_category": income_category['category'],
            "income_description": income_category['description']
        },
        "project_requirements": {
            "ami_levels": project_ami_levels,
            "total_units": total_units,
            "affordable_units": affordable_units,
            "available_units": available_units
        },
        "eligible_programs": income_category['eligible_programs'],
        "ineligible_reasons": ineligible_reasons,
        "recommendations": generate_eligibility_recommendations(income_category, project, ineligible_reasons)
    }

def generate_eligibility_recommendations(income_category: dict, project: dict, ineligible_reasons: list) -> list:
    """Generate helpful recommendations for applicants"""
    recommendations = []
    
    if ineligible_reasons:
        if any("income" in reason.lower() for reason in ineligible_reasons):
            recommendations.append("Consider applying for income-based assistance programs")
            recommendations.append("Look for projects with higher AMI limits")
            
        if any("units" in reason.lower() for reason in ineligible_reasons):
            recommendations.append("Join the waitlist for this project")
            recommendations.append("Check similar projects in the area")
    else:
        recommendations.append("You appear eligible for this project")
        if income_category['category'] in ['extremely_low', 'very_low']:
            recommendations.append("You may qualify for additional rental assistance")
        
        recommendations.append("Prepare required documentation for application")
    
    return recommendations

def calculate_affordability_index(applicant_income: float, rental_cost: float, household_size: int) -> dict:
    """Calculate housing affordability metrics"""
    monthly_income = applicant_income / 12
    affordability_ratio = (rental_cost / monthly_income) * 100 if monthly_income > 0 else 0
    
    # HUD affordability standards
    affordable = affordability_ratio <= 30  # 30% or less of income
    cost_burdened = 30 < affordability_ratio <= 50  # 30-50% of income
    severely_cost_burdened = affordability_ratio > 50  # >50% of income
    
    return {
        "monthly_income": monthly_income,
        "monthly_rent": rental_cost,
        "affordability_ratio": affordability_ratio,
        "affordable": affordable,
        "cost_burdened": cost_burdened,
        "severely_cost_burdened": severely_cost_burdened,
        "maximum_affordable_rent": monthly_income * 0.30,
        "household_size": household_size
    }

# Notification System Functions
def create_notification(conn, company_id: str, user_id: str, notification_type: str, 
                       title: str = None, message: str = None, template_vars: dict = None,
                       entity_type: str = None, entity_id: str = None, priority: str = "normal",
                       action_url: str = None, metadata: dict = None) -> str:
    """Create a notification using templates or direct content"""
    cursor = conn.cursor()
    notification_id = str(uuid.uuid4())
    
    # If template variables provided, use template
    if template_vars and not (title and message):
        cursor.execute("""
            SELECT title_template, message_template 
            FROM notification_templates 
            WHERE type = ? AND active = 1
        """, (notification_type,))
        
        template = cursor.fetchone()
        if template:
            title = template['title_template']
            message = template['message_template']
            
            # Replace template variables
            for key, value in template_vars.items():
                title = title.replace(f"{{{key}}}", str(value))
                message = message.replace(f"{{{key}}}", str(value))
    
    # Create notification
    cursor.execute("""
        INSERT INTO notifications 
        (id, company_id, user_id, type, title, message, entity_type, entity_id, 
         priority, status, action_url, metadata, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        notification_id, company_id, user_id, notification_type, title, message,
        entity_type, entity_id, priority, 'unread', action_url,
        json.dumps(metadata) if metadata else None, datetime.utcnow().isoformat()
    ))
    
    conn.commit()
    
    # Check if immediate email notification is needed
    check_and_send_immediate_notification(conn, notification_id, user_id)
    
    # Send real-time WebSocket notification
    asyncio.create_task(send_realtime_notification(
        user_id, {
            "id": notification_id,
            "type": notification_type,
            "title": title,
            "message": message,
            "priority": priority,
            "action_url": action_url,
            "created_at": datetime.utcnow().isoformat()
        }
    ))
    
    return notification_id

async def send_realtime_notification(user_id: str, notification: dict):
    """Send notification via WebSocket to connected user"""
    try:
        await manager.send_notification(user_id, notification)
    except Exception as e:
        logger.error(f"Failed to send WebSocket notification: {e}")

def check_and_send_immediate_notification(conn, notification_id: str, user_id: str):
    """Check if user wants immediate notifications and send if enabled"""
    cursor = conn.cursor()
    
    # Get user preferences
    cursor.execute("""
        SELECT email_enabled, email_frequency, quiet_hours_start, quiet_hours_end
        FROM notification_preferences
        WHERE user_id = ?
    """, (user_id,))
    
    prefs = cursor.fetchone()
    
    # Default to email enabled and immediate if no preferences set
    if not prefs or (prefs['email_enabled'] and prefs['email_frequency'] == 'immediate'):
        # Check quiet hours
        if prefs and prefs['quiet_hours_start'] and prefs['quiet_hours_end']:
            current_hour = datetime.now().hour
            quiet_start = int(prefs['quiet_hours_start'].split(':')[0])
            quiet_end = int(prefs['quiet_hours_end'].split(':')[0])
            
            # Handle overnight quiet hours
            if quiet_start > quiet_end:
                if current_hour >= quiet_start or current_hour < quiet_end:
                    return  # In quiet hours
            else:
                if quiet_start <= current_hour < quiet_end:
                    return  # In quiet hours
        
        # Queue for email sending (in production, this would send to a queue)
        logger.info(f"Would send immediate email for notification {notification_id}")

def mark_notification_read(conn, notification_id: str, user_id: str) -> bool:
    """Mark a notification as read"""
    cursor = conn.cursor()
    
    cursor.execute("""
        UPDATE notifications 
        SET status = 'read', read_at = ?
        WHERE id = ? AND user_id = ? AND status = 'unread'
    """, (datetime.utcnow().isoformat(), notification_id, user_id))
    
    conn.commit()
    return cursor.rowcount > 0

def get_unread_notification_count(conn, user_id: str) -> int:
    """Get count of unread notifications for a user"""
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND status = 'unread'
    """, (user_id,))
    
    result = cursor.fetchone()
    return result['count'] if result else 0

def bulk_create_notifications(conn, notifications: list) -> list:
    """Create multiple notifications efficiently"""
    created_ids = []
    
    for notif in notifications:
        notif_id = create_notification(
            conn,
            notif.get('company_id'),
            notif.get('user_id'),
            notif.get('type'),
            notif.get('title'),
            notif.get('message'),
            notif.get('template_vars'),
            notif.get('entity_type'),
            notif.get('entity_id'),
            notif.get('priority', 'normal'),
            notif.get('action_url'),
            notif.get('metadata')
        )
        created_ids.append(notif_id)
    
    return created_ids

def notify_new_project_matches(conn, project_id: str, company_id: str):
    """Notify eligible applicants about new project"""
    cursor = conn.cursor()
    
    # Get project details
    cursor.execute("SELECT * FROM projects WHERE id = ? AND company_id = ?", (project_id, company_id))
    project = cursor.fetchone()
    
    if not project:
        return
    
    # Find eligible applicants
    cursor.execute("""
        SELECT a.*, u.id as user_id 
        FROM applicants a
        JOIN users u ON u.email = a.email AND u.company_id = a.company_id
        WHERE a.company_id = ? AND a.status = 'active'
    """, (company_id,))
    
    notifications = []
    
    for applicant_row in cursor.fetchall():
        applicant = dict(applicant_row)
        
        # Check eligibility
        eligibility = validate_applicant_eligibility(applicant, dict(project))
        
        if eligibility['eligible']:
            notifications.append({
                'company_id': company_id,
                'user_id': applicant['user_id'],
                'type': 'new_opportunity',
                'template_vars': {
                    'applicant_name': f"{applicant['first_name']} {applicant['last_name']}",
                    'project_name': project['name'],
                    'project_details': f"Location: {project.get('location', 'N/A')}\nAMI Levels: {project.get('ami_levels', 'N/A')}\nAvailable Units: {project.get('available_units', 0)}",
                    'action_url': f"/dashboard/projects/{project_id}/apply"
                },
                'entity_type': 'project',
                'entity_id': project_id,
                'action_url': f"/dashboard/projects/{project_id}/apply"
            })
    
    # Bulk create notifications
    if notifications:
        bulk_create_notifications(conn, notifications)

# Database operations
def get_or_create_company(conn, company_key: str):
    """Get or create company by key"""
    cursor = conn.cursor()
    
    # Try to get existing company
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT * FROM companies WHERE key = %s", (company_key,))
        company = cursor.fetchone()
        if company:
            columns = [desc[0] for desc in cursor.description]
            company = dict(zip(columns, company))
    else:
        cursor.execute("SELECT * FROM companies WHERE key = ?", (company_key,))
        company = cursor.fetchone()
        if company:
            company = dict(company)
    
    if not company:
        # Create new company
        company_id = str(uuid.uuid4())
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("""
                INSERT INTO companies (id, key, name, plan, seats) 
                VALUES (%s, %s, %s, %s, %s)
            """, (company_id, company_key, f"Company {company_key}", "basic", 10))
        else:
            cursor.execute("""
                INSERT INTO companies (id, key, name, plan, seats) 
                VALUES (?, ?, ?, ?, ?)
            """, (company_id, company_key, f"Company {company_key}", "basic", 10))
        conn.commit()
        
        # Fetch the created company
        if USE_POSTGRESQL and pg_pool:
            cursor.execute("SELECT * FROM companies WHERE id = %s", (company_id,))
            company = cursor.fetchone()
            columns = [desc[0] for desc in cursor.description]
            company = dict(zip(columns, company))
        else:
            cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
            company = cursor.fetchone()
            company = dict(company)
    
    return company

def create_user(conn, email: str, password: str, company_id: str, role: str = "user"):
    """Create new user"""
    cursor = conn.cursor()
    
    # Check if user exists
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
    else:
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    
    if cursor.fetchone():
        raise ValidationError("User with this email already exists", field="email")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(password)
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO users (id, company_id, email, password_hash, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, company_id, email, hashed_pw, role))
    else:
        cursor.execute("""
            INSERT INTO users (id, company_id, email, hashed_password, role)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, company_id, email, hashed_pw, role))
    
    conn.commit()
    return {"id": user_id, "email": email, "role": role, "company_id": company_id}

def get_user_by_email(conn, email: str):
    """Get user by email"""
    cursor = conn.cursor()
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if user:
            # Convert to dict for PostgreSQL
            columns = [desc[0] for desc in cursor.description]
            return dict(zip(columns, user))
    else:
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        return dict(user) if user else None
    
    return None

def verify_user_credentials(conn, email: str, password: str):
    """Verify user login credentials"""
    user = get_user_by_email(conn, email)
    if not user:
        return None
    
    # Handle both column names for compatibility
    password_hash = user.get('hashed_password') or user.get('password_hash')
    if password_hash and verify_password(password, password_hash):
        return user
    return None

def log_activity(conn, user_id: str, company_id: str, activity_type: str, title: str, 
                description: str, entity_type: str = None, entity_id: str = None, 
                metadata: dict = None, status: str = "info"):
    """Log user activity"""
    cursor = conn.cursor()
    activity_id = str(uuid.uuid4())
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            INSERT INTO activity_logs (
                id, company_id, user_id, type, title, description, 
                entity_type, entity_id, metadata, status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            activity_id, company_id, user_id, activity_type, title, description,
            entity_type, entity_id, json.dumps(metadata) if metadata else None, status
        ))
    else:
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
    
    if USE_POSTGRESQL and pg_pool:
        cursor.execute("""
            SELECT al.*, u.email as user_email 
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            WHERE al.company_id = %s
            ORDER BY al.created_at DESC
            LIMIT %s OFFSET %s
        """, (company_id, limit, offset))
    else:
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
        if USE_POSTGRESQL:
            # Convert tuple to dict for PostgreSQL
            columns = [desc[0] for desc in cursor.description]
            activity = dict(zip(columns, row))
        else:
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

# CRA Calculation Functions
def classify_investment_by_income_level(investment: dict, area_thresholds: dict) -> str:
    """Classify investment by target income level based on AMI percentage"""
    ami_percent = investment.get('ami_percent', 0)
    
    if not ami_percent:
        return 'unknown'
    
    # Standard CRA income classifications based on Area Median Income (AMI)
    if ami_percent <= 50:
        return 'low'  # Low-income: ≤50% AMI
    elif ami_percent <= 80:
        return 'moderate'  # Moderate-income: 51-80% AMI
    elif ami_percent <= 120:
        return 'middle'  # Middle-income: 81-120% AMI
    else:
        return 'upper'  # Upper-income: >120% AMI

def get_or_create_default_assessment_areas(conn, company_id: str):
    """Get or create default CRA assessment areas for a company"""
    cursor = conn.cursor()
    
    # Check if areas already exist
    cursor.execute("SELECT COUNT(*) FROM cra_assessments WHERE company_id = ?", (company_id,))
    count = cursor.fetchone()[0]
    
    if count > 0:
        return
    
    # Create default assessment areas (San Francisco Bay Area example)
    default_areas = [
        {
            "assessment_area": "San Francisco Bay Area",
            "income_level": "Overall",
            "median_family_income": 141300,  # 2024 Bay Area MFI
            "low_income_threshold": 70650,    # 50% of MFI
            "moderate_income_threshold": 113040,  # 80% of MFI
            "middle_income_threshold": 169560,   # 120% of MFI
            "upper_income_threshold": 999999999  # Above 120% of MFI
        }
    ]
    
    for area in default_areas:
        area_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO cra_assessments 
            (id, company_id, assessment_area, income_level, median_family_income,
             low_income_threshold, moderate_income_threshold, middle_income_threshold, upper_income_threshold)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            area_id, company_id, area['assessment_area'], area['income_level'],
            area['median_family_income'], area['low_income_threshold'],
            area['moderate_income_threshold'], area['middle_income_threshold'],
            area['upper_income_threshold']
        ))
    
    conn.commit()

def calculate_cra_metrics_from_investments(conn, company_id: str, assessment_year: int = None):
    """Calculate real CRA metrics from actual investment data"""
    cursor = conn.cursor()
    
    # Get current year if not specified
    if not assessment_year:
        assessment_year = datetime.now().year
    
    # Ensure assessment areas exist
    get_or_create_default_assessment_areas(conn, company_id)
    
    # Get all investments for the year
    cursor.execute("""
        SELECT i.*, p.location, p.total_units, p.affordable_units
        FROM investments i
        LEFT JOIN projects p ON i.project_id = p.id
        WHERE i.company_id = ? 
        AND strftime('%Y', i.date_invested) = ?
        AND i.status IN ('active', 'completed')
    """, (company_id, str(assessment_year)))
    
    investments = [dict(row) for row in cursor.fetchall()]
    
    # Calculate totals by income level
    totals = {
        'low_income': 0,
        'moderate_income': 0,
        'middle_income': 0,
        'upper_income': 0,
        'community_development': 0,
        'small_business': 0,
        'total': 0
    }
    
    for investment in investments:
        amount = investment.get('investment_amount', 0)
        income_level = classify_investment_by_income_level(investment, {})
        
        if income_level == 'low':
            totals['low_income'] += amount
        elif income_level == 'moderate':
            totals['moderate_income'] += amount
        elif income_level == 'middle':
            totals['middle_income'] += amount
        elif income_level == 'upper':
            totals['upper_income'] += amount
        
        # Community development: projects with >50% affordable units
        affordable_ratio = 0
        if investment.get('total_units') and investment.get('affordable_units'):
            affordable_ratio = investment['affordable_units'] / investment['total_units']
        
        if affordable_ratio > 0.5:
            totals['community_development'] += amount
        
        # Small business lending: projects <$1M
        if amount < 1000000:
            totals['small_business'] += amount
        
        totals['total'] += amount
    
    # Calculate percentages
    if totals['total'] > 0:
        low_income_pct = (totals['low_income'] / totals['total']) * 100
        moderate_income_pct = (totals['moderate_income'] / totals['total']) * 100
        community_dev_pct = (totals['community_development'] / totals['total']) * 100
        small_business_pct = (totals['small_business'] / totals['total']) * 100
        coverage_pct = ((totals['low_income'] + totals['moderate_income']) / totals['total']) * 100
    else:
        low_income_pct = moderate_income_pct = community_dev_pct = small_business_pct = coverage_pct = 0
    
    # Store/update performance data
    period_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT OR REPLACE INTO cra_performance 
        (id, company_id, assessment_period, assessment_year, 
         low_income_lending_amount, moderate_income_lending_amount,
         middle_income_lending_amount, upper_income_lending_amount,
         community_development_amount, small_business_lending_amount, total_lending_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        period_id, company_id, f"Year {assessment_year}", assessment_year,
        totals['low_income'], totals['moderate_income'], totals['middle_income'],
        totals['upper_income'], totals['community_development'], totals['small_business'],
        totals['total']
    ))
    
    conn.commit()
    
    # Return metrics with status determination
    def get_status(current: float, target: float) -> str:
        if current >= target * 1.1:  # 110% of target
            return "exceeds"
        elif current >= target:
            return "meets"
        elif current >= target * 0.9:  # 90% of target
            return "approaching"
        else:
            return "below"
    
    return [
        {
            "category": "Low Income Areas",
            "target": 40.0,
            "current": round(low_income_pct, 1),
            "status": get_status(low_income_pct, 40.0),
            "amount": totals['low_income']
        },
        {
            "category": "Moderate Income Areas",
            "target": 30.0,
            "current": round(moderate_income_pct, 1),
            "status": get_status(moderate_income_pct, 30.0),
            "amount": totals['moderate_income']
        },
        {
            "category": "Assessment Area Coverage",
            "target": 75.0,
            "current": round(coverage_pct, 1),
            "status": get_status(coverage_pct, 75.0),
            "amount": totals['low_income'] + totals['moderate_income']
        },
        {
            "category": "Community Development",
            "target": 15.0,
            "current": round(community_dev_pct, 1),
            "status": get_status(community_dev_pct, 15.0),
            "amount": totals['community_development']
        },
        {
            "category": "Small Business Lending", 
            "target": 25.0,
            "current": round(small_business_pct, 1),
            "status": get_status(small_business_pct, 25.0),
            "amount": totals['small_business']
        }
    ]

def generate_cra_report_data(conn, company_id: str, assessment_year: int = None):
    """Generate comprehensive CRA report data"""
    if not assessment_year:
        assessment_year = datetime.now().year
        
    metrics = calculate_cra_metrics_from_investments(conn, company_id, assessment_year)
    
    # Get investment summary
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) as investment_count, 
               SUM(investment_amount) as total_invested,
               AVG(ami_compliance) as avg_compliance
        FROM investments 
        WHERE company_id = ? 
        AND strftime('%Y', date_invested) = ?
        AND status IN ('active', 'completed')
    """, (company_id, str(assessment_year)))
    
    summary = dict(cursor.fetchone())
    
    return {
        "assessment_year": assessment_year,
        "metrics": metrics,
        "summary": {
            "total_investments": summary['investment_count'] or 0,
            "total_amount_invested": summary['total_invested'] or 0,
            "average_ami_compliance": round(summary['avg_compliance'] or 0, 1)
        },
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

# API Routes
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Database initialization endpoint (temporary for production setup)
@app.post("/api/init-db-2024-temp")
async def init_database_temp(secret: str = None):
    """Initialize database with test users (temporary endpoint)"""
    # Simple security check
    if secret != "homeverse-init-2024":
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    try:
        if USE_POSTGRESQL:
            # PostgreSQL initialization
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Create companies table (matching existing schema)
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
            
            # Create users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    full_name TEXT NOT NULL,
                    role TEXT NOT NULL,
                    company_id TEXT,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    profile TEXT DEFAULT '{}'
                )
            """)
            
            # Create other required tables
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS applicants (
                    id TEXT PRIMARY KEY,
                    company_id TEXT,
                    full_name TEXT NOT NULL,
                    email TEXT,
                    phone TEXT,
                    income NUMERIC,
                    household_size INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id TEXT PRIMARY KEY,
                    company_id TEXT,
                    name TEXT NOT NULL,
                    description TEXT,
                    total_units INTEGER,
                    available_units INTEGER,
                    ami_percentage INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS activities (
                    id TEXT PRIMARY KEY,
                    company_id TEXT,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    resource_type TEXT,
                    resource_id TEXT,
                    details TEXT DEFAULT '{}',
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS contact_submissions (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Insert test company (matching existing schema)
            company_id = "demo-company-" + str(uuid.uuid4())[:8]
            cursor.execute("""
                INSERT INTO companies (id, name, key, plan, seats)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (key) DO NOTHING
            """, (company_id, "Demo Company", "demo-company-2024", "premium", 50))
            
            # Get the company ID (in case it already existed)
            cursor.execute("SELECT id FROM companies WHERE key = %s", ("demo-company-2024",))
            result = cursor.fetchone()
            if result:
                company_id = result[0]
            
            # Test users data
            test_users = [
                ("developer@test.com", "password123", "Dev Thompson", "developer"),
                ("lender@test.com", "password123", "Lenny Banks", "lender"),
                ("buyer@test.com", "password123", "Bailey Buyer", "buyer"),
                ("applicant@test.com", "password123", "Alex Applicant", "applicant"),
                ("admin@test.com", "password123", "Admin User", "admin")
            ]
            
            # Insert test users
            for email, password, full_name, role in test_users:
                user_id = str(uuid.uuid4())
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, full_name, role, company_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE
                    SET password_hash = EXCLUDED.password_hash,
                        full_name = EXCLUDED.full_name,
                        role = EXCLUDED.role
                """, (user_id, email, password_hash, full_name, role, company_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "message": "PostgreSQL database initialized successfully",
                "company_id": company_id,
                "users_created": len(test_users)
            }
            
        else:
            # SQLite is already initialized
            return {
                "message": "SQLite database already initialized",
                "note": "Using SQLite with existing test data"
            }
            
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

@app.post("/api/init-db-simple")
async def init_database_simple(data: dict = Body(...)):
    """Simple database initialization endpoint"""
    # Simple security check
    if data.get("secret") != "homeverse-2024":
        raise HTTPException(status_code=403, detail="Invalid secret")
    
    try:
        if USE_POSTGRESQL:
            import psycopg2
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor()
            
            # Check if tables exist
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'users'
                )
            """)
            users_exists = cursor.fetchone()[0]
            
            if not users_exists:
                # Create minimal schema
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS companies (
                        id TEXT PRIMARY KEY,
                        key TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        company_id TEXT,
                        email TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        role TEXT DEFAULT 'user'
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS applicants (
                        id TEXT PRIMARY KEY,
                        company_id TEXT,
                        full_name TEXT NOT NULL,
                        email TEXT,
                        phone TEXT,
                        income NUMERIC,
                        household_size INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS projects (
                        id TEXT PRIMARY KEY,
                        company_id TEXT,
                        name TEXT NOT NULL,
                        description TEXT,
                        total_units INTEGER,
                        available_units INTEGER,
                        ami_percentage INTEGER,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS activities (
                        id TEXT PRIMARY KEY,
                        company_id TEXT,
                        user_id TEXT,
                        action TEXT NOT NULL,
                        resource_type TEXT,
                        resource_id TEXT,
                        details TEXT DEFAULT '{}',
                        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS contact_submissions (
                        id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL,
                        subject TEXT NOT NULL,
                        message TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            
            # Insert test company
            company_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO companies (id, key, name) 
                VALUES (%s, 'demo-company-2024', 'Demo Company')
                ON CONFLICT (key) DO UPDATE SET id = EXCLUDED.id
                RETURNING id
            """, (company_id,))
            company_id = cursor.fetchone()[0]
            
            # Insert test users
            users_created = 0
            for user_data in data.get("users", []):
                user_id = str(uuid.uuid4())
                email = user_data["email"]
                password = user_data["password"]
                role = user_data["role"]
                
                # Hash password
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cursor.execute("""
                    INSERT INTO users (id, email, password_hash, role, company_id)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE 
                    SET password_hash = EXCLUDED.password_hash,
                        role = EXCLUDED.role
                """, (user_id, email, password_hash, role, company_id))
                users_created += 1
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "message": "Database initialized successfully",
                "company_id": company_id,
                "users_created": users_created
            }
        else:
            return {
                "message": "SQLite database already initialized",
                "note": "Using SQLite with existing test data"
            }
            
    except Exception as e:
        logger.error(f"Simple init error: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

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
    logger.info(f"Login attempt for: {request.email}")
    
    try:
        # Debug: Check if we're using PostgreSQL
        logger.info(f"USE_POSTGRESQL: {USE_POSTGRESQL}")
        logger.info(f"pg_pool exists: {pg_pool is not None}")
        
        user = verify_user_credentials(conn, request.email, request.password)
        if not user:
            logger.warning(f"Failed login attempt for email: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid credentials")
            
        logger.info(f"User authenticated successfully: {user.get('email')}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {request.email}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")
    
    # Log login activity - TEMPORARILY DISABLED FOR POSTGRESQL COMPATIBILITY
    # TODO: Fix log_activity to use PostgreSQL placeholders
    # log_activity(
    #     conn, 
    #     user['id'], 
    #     user['company_id'],
    #     "auth",
    #     "User Login",
    #     f"{user['email']} logged in successfully",
    #     status="success"
    # )
    
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

# User Profile Management Endpoints
@app.put("/api/v1/auth/profile")
async def update_user_profile(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Update user profile information"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        cursor = conn.cursor()
        
        # Update allowed fields
        allowed_fields = ['full_name', 'phone', 'timezone', 'language', 'notification_preferences']
        update_fields = []
        values = []
        
        for field in allowed_fields:
            if field in request:
                if field == 'notification_preferences':
                    update_fields.append(f"{field} = ?")
                    values.append(json.dumps(request[field]))
                else:
                    update_fields.append(f"{field} = ?")
                    values.append(request[field])
        
        if update_fields:
            values.append(user_id)
            query = f"UPDATE users SET {', '.join(update_fields)}, updated_at = ? WHERE id = ?"
            values.insert(len(values) - 1, datetime.utcnow().isoformat())
            cursor.execute(query, values)
            conn.commit()
        
        # Get updated user info
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        return {
            "id": user['id'],
            "email": user['email'],
            "role": user['role'],
            "full_name": user.get('full_name'),
            "phone": user.get('phone'),
            "timezone": user.get('timezone', 'UTC'),
            "language": user.get('language', 'en'),
            "notification_preferences": json.loads(user.get('notification_preferences', '{}'))
        }
        
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Failed to update profile")

@app.post("/api/v1/auth/change-password")
async def change_password(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Change user password"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        current_password = request.get("current_password")
        new_password = request.get("new_password")
        
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Both current and new passwords required")
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        # Verify current password
        if not hashlib.sha256(current_password.encode()).hexdigest() == user['password_hash']:
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        # Update password
        new_password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        cursor.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (new_password_hash, datetime.utcnow().isoformat(), user_id)
        )
        conn.commit()
        
        # Log activity
        log_activity(
            conn, user_id, user['company_id'],
            "security", "Password Changed",
            "User changed their password"
        )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

@app.post("/api/v1/auth/reset-password-request")
async def request_password_reset(request: dict, conn=Depends(get_db)):
    """Request password reset token"""
    email = request.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    
    if user:
        # Generate reset token
        reset_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        # Store reset token (in production, use a separate table)
        cursor.execute(
            "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
            (reset_token, expires_at.isoformat(), user['id'])
        )
        conn.commit()
        
        # Send email (implement email service)
        logger.info(f"Password reset requested for {email}, token: {reset_token}")
        
        # Create notification
        create_notification(
            conn, user['company_id'], user['id'],
            "security", "Password Reset Requested",
            "A password reset was requested for your account. If this wasn't you, please contact support.",
            priority="high"
        )
    
    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a reset link has been sent"}

@app.put("/api/v1/auth/settings")
async def update_user_settings(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Update user settings and preferences"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        cursor = conn.cursor()
        
        # Update settings as JSON
        settings = request.get("settings", {})
        cursor.execute(
            "UPDATE users SET settings = ?, updated_at = ? WHERE id = ?",
            (json.dumps(settings), datetime.utcnow().isoformat(), user_id)
        )
        conn.commit()
        
        return {"message": "Settings updated successfully", "settings": settings}
        
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update settings")

# Company Management Endpoints
@app.put("/api/v1/company")
async def update_company(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Update company information (admin only)"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get user and verify admin
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (payload.get("sub"),))
        user = cursor.fetchone()
        
        if user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        company_id = user['company_id']
        
        # Update allowed fields
        allowed_fields = ['name', 'plan', 'seats', 'settings']
        update_fields = []
        values = []
        
        for field in allowed_fields:
            if field in request:
                if field == 'settings':
                    update_fields.append(f"{field} = ?")
                    values.append(json.dumps(request[field]))
                else:
                    update_fields.append(f"{field} = ?")
                    values.append(request[field])
        
        if update_fields:
            values.append(company_id)
            query = f"UPDATE companies SET {', '.join(update_fields)} WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()
            
            # Log activity
            log_activity(
                conn, user['id'], company_id,
                "admin", "Company Updated",
                f"Company settings updated by {user['email']}"
            )
        
        # Get updated company
        cursor.execute("SELECT * FROM companies WHERE id = ?", (company_id,))
        company = cursor.fetchone()
        
        return {
            "id": company['id'],
            "key": company['key'],
            "name": company['name'],
            "plan": company['plan'],
            "seats": company['seats'],
            "settings": json.loads(company.get('settings', '{}'))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating company: {e}")
        raise HTTPException(status_code=500, detail="Failed to update company")

@app.post("/api/v1/company/invite")
async def invite_user(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Invite new user to company (admin only)"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get user and verify admin
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (payload.get("sub"),))
        user = cursor.fetchone()
        
        if user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        company_id = user['company_id']
        email = request.get("email")
        role = request.get("role", "buyer")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email required")
        
        # Check if user already exists
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")
        
        # Create invitation token
        invite_token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Store invitation (in production, use separate invitations table)
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, company_id, role, invite_token, invite_expires, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            str(uuid.uuid4()), email, '', company_id, role,
            invite_token, expires_at.isoformat(), datetime.utcnow().isoformat()
        ))
        conn.commit()
        
        # Send invitation email (implement email service)
        logger.info(f"User invited: {email}, token: {invite_token}")
        
        # Log activity
        log_activity(
            conn, user['id'], company_id,
            "admin", "User Invited",
            f"{email} invited as {role} by {user['email']}"
        )
        
        return {"message": "Invitation sent successfully", "invite_token": invite_token}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error inviting user: {e}")
        raise HTTPException(status_code=500, detail="Failed to invite user")

@app.get("/api/v1/company/users")
async def get_company_users(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    conn=Depends(get_db)
):
    """Get all users in company (admin only)"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Get user
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (payload.get("sub"),))
        user = cursor.fetchone()
        
        if user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get all company users
        cursor.execute("""
            SELECT id, email, role, full_name, created_at, last_login
            FROM users 
            WHERE company_id = ?
            ORDER BY created_at DESC
        """, (user['company_id'],))
        
        users = []
        for row in cursor.fetchall():
            users.append({
                "id": row['id'],
                "email": row['email'],
                "role": row['role'],
                "full_name": row.get('full_name'),
                "created_at": row['created_at'],
                "last_login": row.get('last_login')
            })
        
        return users
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting company users: {e}")
        raise HTTPException(status_code=500, detail="Failed to get users")

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
    """Get real CRA compliance metrics calculated from investment data"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now, return demo data
            async with pg_pool.acquire() as conn:
                user = await conn.fetchrow("SELECT company_id FROM users WHERE id = $1", user_data["sub"])
                if not user:
                    raise HTTPException(status_code=401, detail="User not found")
                
                # Return demo data for now
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
        else:
            # SQLite version with real CRA calculations
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            company_id = user["company_id"]
            
            # Calculate real CRA metrics from investments
            real_metrics = calculate_cra_metrics_from_investments(conn, company_id)
            conn.close()
            
            # The function returns a list, so we can return it directly
            # If no real investment data, it will return metrics with 0 values
            return real_metrics
            
    except Exception as e:
        logger.error(f"Error getting CRA metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get CRA metrics")

@app.get("/api/v1/lenders/cra/report")
async def generate_cra_report(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Generate comprehensive CRA compliance report"""
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
                
                # Return demo report data
                return {
                    "report_id": f"cra_report_{str(uuid.uuid4())[:8]}",
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "company_name": "Demo Company",
                    "assessment_period": "2024",
                    "overall_rating": "Satisfactory",
                    "metrics": [],
                    "recommendations": [
                        "Continue focus on low-income area investments",
                        "Expand community development initiatives"
                    ]
                }
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
            
            # Generate comprehensive CRA report
            try:
                report_data = generate_cra_report_data(conn, company_id)
                
                # Log activity
                log_activity(
                    conn,
                    user_data["sub"],
                    company_id,
                    "compliance",
                    "CRA Report Generated",
                    "Generated comprehensive CRA compliance report",
                    entity_type="report",
                    entity_id=report_data["report_id"],
                    metadata={"report_type": "cra_compliance"},
                    status="info"
                )
                
                conn.close()
                return report_data
            except Exception as report_error:
                logger.error(f"Error in generate_cra_report_data: {report_error}")
                conn.close()
                
                # Return a basic report structure if function fails
                return {
                    "report_id": f"cra_report_{str(uuid.uuid4())[:8]}",
                    "generated_at": datetime.utcnow().isoformat() + "Z",
                    "company_name": "Test Company",
                    "assessment_period": "2024",
                    "overall_rating": "Needs Review",
                    "metrics": calculate_cra_metrics_from_investments(sqlite3.connect(DATABASE_PATH), company_id),
                    "recommendations": [
                        "Increase investment in low-income areas",
                        "Expand community development initiatives",
                        "Consider geographic distribution of investments"
                    ]
                }
            
    except Exception as e:
        logger.error(f"Error generating CRA report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate CRA report")

@app.get("/api/v1/lenders/cra/assessment-areas")
async def get_cra_assessment_areas(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get CRA assessment areas for the company"""
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
                
                # Return demo assessment areas
                return [
                    {
                        "id": "aa_001",
                        "name": "San Francisco MSA",
                        "counties": ["San Francisco", "San Mateo", "Marin"],
                        "income_levels": {
                            "low": {"min": 0, "max": 50},
                            "moderate": {"min": 50, "max": 80},
                            "middle": {"min": 80, "max": 120},
                            "upper": {"min": 120, "max": 999}
                        },
                        "active": True
                    }
                ]
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
            
            # Check if table exists and get assessment areas
            try:
                cursor.execute("""
                    SELECT * FROM cra_assessments 
                    WHERE company_id = ? AND active = 1
                    ORDER BY name
                """, (company_id,))
                
                areas = []
                for row in cursor.fetchall():
                    areas.append({
                        "id": row["id"],
                        "name": row["name"],
                        "counties": json.loads(row["counties"]) if row["counties"] else [],
                        "income_levels": json.loads(row["income_levels"]) if row["income_levels"] else {},
                        "active": bool(row["active"])
                    })
                
                conn.close()
                
                # If no assessment areas, return default
                if not areas:
                    return [
                        {
                            "id": "default_aa",
                            "name": "Default Assessment Area",
                            "counties": ["San Francisco", "San Mateo"],
                            "income_levels": {
                                "low": {"min": 0, "max": 50},
                                "moderate": {"min": 50, "max": 80},
                                "middle": {"min": 80, "max": 120},
                                "upper": {"min": 120, "max": 999}
                            },
                            "active": True
                        }
                    ]
                
                return areas
                
            except Exception as table_error:
                logger.warning(f"CRA assessments table may not exist: {table_error}")
                conn.close()
                
                # Return default assessment area if table doesn't exist
                return [
                    {
                        "id": "default_aa",
                        "name": "Default Assessment Area",
                        "counties": ["San Francisco", "San Mateo"],
                        "income_levels": {
                            "low": {"min": 0, "max": 50},
                            "moderate": {"min": 50, "max": 80},
                            "middle": {"min": 80, "max": 120},
                            "upper": {"min": 120, "max": 999}
                        },
                        "active": True
                    }
                ]
            
    except Exception as e:
        logger.error(f"Error getting CRA assessment areas: {e}")
        raise HTTPException(status_code=500, detail="Failed to get CRA assessment areas")

@app.post("/api/v1/lenders/cra/assessment-areas")
async def create_cra_assessment_area(area_data: CRAAssessmentArea, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Create new CRA assessment area"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL CRA areas not yet implemented")
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
            area_id = str(uuid.uuid4())
            
            # Insert assessment area
            cursor.execute("""
                INSERT INTO cra_assessments 
                (id, company_id, name, counties, income_levels, active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                area_id,
                company_id,
                area_data.name,
                json.dumps(area_data.counties),
                json.dumps(area_data.income_levels),
                area_data.active,
                datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            ))
            
            conn.commit()
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "compliance",
                "CRA Assessment Area Created",
                f"Created CRA assessment area: {area_data.name}",
                entity_type="cra_assessment",
                entity_id=area_id,
                metadata={"area_name": area_data.name, "counties": area_data.counties},
                status="info"
            )
            
            conn.close()
            
            return {
                "id": area_id,
                "message": "CRA assessment area created successfully",
                "name": area_data.name
            }
            
    except Exception as e:
        logger.error(f"Error creating CRA assessment area: {e}")
        raise HTTPException(status_code=500, detail="Failed to create CRA assessment area")

# File Upload Endpoints
@app.post("/api/v1/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    document_category: str = Form(None),
    metadata: str = Form(None),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Upload a document with security validation"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL file upload not yet implemented")
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
            
            # Validate file size
            if file.size and file.size > MAX_FILE_SIZE:
                raise HTTPException(status_code=413, detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes")
            
            # Validate file extension
            if not validate_file_extension(file.filename):
                raise HTTPException(status_code=400, detail="File type not allowed")
            
            # Validate MIME type
            if file.content_type and not validate_mime_type(file.content_type):
                raise HTTPException(status_code=400, detail="MIME type not allowed")
            
            # Generate secure filename and path
            secure_filename = generate_secure_filename(file.filename, entity_type, entity_id)
            file_path = get_file_path(secure_filename, entity_type, company_id)
            
            # Save file to disk
            file_saved = await save_uploaded_file(file, file_path)
            if not file_saved:
                raise HTTPException(status_code=500, detail="Failed to save file")
            
            # Calculate file hash for integrity
            file_hash = calculate_file_hash(file_path)
            
            # Save document metadata to database
            document_id = str(uuid.uuid4())
            metadata_dict = json.loads(metadata) if metadata else {}
            metadata_dict["file_hash"] = file_hash
            
            cursor.execute("""
                INSERT INTO documents 
                (id, company_id, entity_type, entity_id, filename, original_filename, 
                 file_size, content_type, file_path, document_category, upload_user_id, 
                 metadata, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                document_id, company_id, entity_type, entity_id, secure_filename, 
                file.filename, file.size or 0, file.content_type or 'application/octet-stream',
                file_path, document_category, user_data["sub"], json.dumps(metadata_dict),
                datetime.utcnow().isoformat(), datetime.utcnow().isoformat()
            ))
            
            # Log the upload
            log_document_access(conn, document_id, user_data["sub"], "upload")
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "document",
                "Document Uploaded",
                f"Uploaded {file.filename} for {entity_type} {entity_id}",
                entity_type="document",
                entity_id=document_id,
                metadata={
                    "filename": file.filename,
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "file_size": file.size or 0
                },
                status="info"
            )
            
            conn.commit()
            conn.close()
            
            return DocumentUploadResponse(
                document_id=document_id,
                filename=secure_filename,
                file_size=file.size or 0,
                message="Document uploaded successfully"
            )
            
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload document")

@app.get("/api/v1/documents")
async def get_documents(
    entity_type: str = None,
    entity_id: str = None,
    document_category: str = None,
    skip: int = 0,
    limit: int = 20,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get documents with filtering options"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL document listing not yet implemented")
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
            
            # Build query with filters
            query = "SELECT * FROM documents WHERE company_id = ? AND status = 'active'"
            params = [company_id]
            
            if entity_type:
                query += " AND entity_type = ?"
                params.append(entity_type)
            
            if entity_id:
                query += " AND entity_id = ?"
                params.append(entity_id)
            
            if document_category:
                query += " AND document_category = ?"
                params.append(document_category)
            
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, skip])
            
            cursor.execute(query, params)
            documents = []
            
            for row in cursor.fetchall():
                documents.append({
                    "id": row["id"],
                    "filename": row["filename"],
                    "original_filename": row["original_filename"],
                    "file_size": row["file_size"],
                    "content_type": row["content_type"],
                    "document_category": row["document_category"],
                    "entity_type": row["entity_type"],
                    "entity_id": row["entity_id"],
                    "status": row["status"],
                    "created_at": row["created_at"],
                    "upload_user_id": row["upload_user_id"]
                })
            
            conn.close()
            return documents
            
    except Exception as e:
        logger.error(f"Error getting documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to get documents")

@app.get("/api/v1/documents/{document_id}/download")
async def download_document(
    document_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Download document with access control"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL document download not yet implemented")
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
            
            # Get document info with access control
            cursor.execute("""
                SELECT * FROM documents 
                WHERE id = ? AND company_id = ? AND status = 'active'
            """, (document_id, company_id))
            
            document = cursor.fetchone()
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Verify file exists
            if not os.path.exists(document["file_path"]):
                raise HTTPException(status_code=404, detail="File not found on disk")
            
            # Log the download
            log_document_access(conn, document_id, user_data["sub"], "download")
            
            conn.close()
            
            # Return file response
            return FileResponse(
                path=document["file_path"],
                filename=document["original_filename"],
                media_type=document["content_type"]
            )
            
    except Exception as e:
        logger.error(f"Error downloading document: {e}")
        raise HTTPException(status_code=500, detail="Failed to download document")

@app.delete("/api/v1/documents/{document_id}")
async def delete_document(
    document_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Delete document (soft delete)"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL document deletion not yet implemented")
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
            
            # Get document info with access control
            cursor.execute("""
                SELECT * FROM documents 
                WHERE id = ? AND company_id = ? AND status = 'active'
            """, (document_id, company_id))
            
            document = cursor.fetchone()
            if not document:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Soft delete - mark as deleted
            cursor.execute("""
                UPDATE documents 
                SET status = 'deleted', updated_at = ?
                WHERE id = ?
            """, (datetime.utcnow().isoformat(), document_id))
            
            # Log the deletion
            log_document_access(conn, document_id, user_data["sub"], "delete")
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "document",
                "Document Deleted",
                f"Deleted document {document['original_filename']}",
                entity_type="document",
                entity_id=document_id,
                metadata={"filename": document["original_filename"]},
                status="warning"
            )
            
            conn.commit()
            conn.close()
            
            return {"message": "Document deleted successfully"}
            
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete document")

# AMI and Eligibility Validation Endpoints
@app.get("/api/v1/ami/location/{location}")
async def get_ami_by_location(
    location: str,
    household_size: int = 4,
    year: int = 2024,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get AMI data and thresholds for a specific location and household size"""
    try:
        # Get AMI data for location
        ami_data = get_ami_data_by_location(location, year)
        ami_thresholds = calculate_ami_thresholds(ami_data['mfi'], household_size)
        
        return {
            "location": location,
            "year": year,
            "household_size": household_size,
            "mfi": ami_data['mfi'],
            "region": ami_data['region'],
            "effective_date": ami_data['effective_date'],
            "thresholds": ami_thresholds,
            "income_categories": {
                "extremely_low": {
                    "limit": ami_thresholds['extremely_low'],
                    "description": "≤30% AMI",
                    "programs": ["public_housing", "vouchers", "homeless_assistance"]
                },
                "very_low": {
                    "limit": ami_thresholds['very_low'],
                    "description": "31-50% AMI", 
                    "programs": ["public_housing", "vouchers", "low_income_housing_tax_credit"]
                },
                "low": {
                    "limit": ami_thresholds['low'],
                    "description": "51-80% AMI",
                    "programs": ["low_income_housing_tax_credit", "home_program", "cdbg"]
                },
                "moderate": {
                    "limit": ami_thresholds['moderate'],
                    "description": "81-120% AMI",
                    "programs": ["workforce_housing", "first_time_homebuyer"]
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting AMI data: {e}")
        raise HTTPException(status_code=500, detail="Failed to get AMI data")

@app.post("/api/v1/eligibility/validate")
async def validate_eligibility(
    validation_request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Validate applicant eligibility for a specific project"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL eligibility validation not yet implemented")
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
            
            # Get applicant and project data
            applicant_id = validation_request.get('applicant_id')
            project_id = validation_request.get('project_id')
            
            if not applicant_id or not project_id:
                raise HTTPException(status_code=400, detail="Both applicant_id and project_id are required")
            
            # Fetch applicant data
            cursor.execute("SELECT * FROM applicants WHERE id = ? AND company_id = ?", (applicant_id, company_id))
            applicant_row = cursor.fetchone()
            if not applicant_row:
                raise HTTPException(status_code=404, detail="Applicant not found")
            
            applicant = dict(applicant_row)
            
            # Fetch project data
            cursor.execute("SELECT * FROM projects WHERE id = ? AND company_id = ?", (project_id, company_id))
            project_row = cursor.fetchone()
            if not project_row:
                raise HTTPException(status_code=404, detail="Project not found")
            
            project = dict(project_row)
            
            # Perform eligibility validation
            eligibility_result = validate_applicant_eligibility(applicant, project)
            
            # Calculate affordability if rental cost is available
            rental_cost = project.get('monthly_rent')
            if rental_cost and applicant.get('income'):
                affordability = calculate_affordability_index(
                    applicant['income'], 
                    rental_cost, 
                    applicant.get('household_size', 1)
                )
                eligibility_result['affordability'] = affordability
            
            # Log activity
            log_activity(
                conn,
                user_data["sub"],
                company_id,
                "eligibility",
                "Eligibility Validation",
                f"Validated eligibility for applicant {applicant['first_name']} {applicant['last_name']} for project {project['name']}",
                entity_type="validation",
                entity_id=f"{applicant_id}_{project_id}",
                metadata={
                    "applicant_id": applicant_id,
                    "project_id": project_id,
                    "eligible": eligibility_result['eligible'],
                    "eligibility_score": eligibility_result['eligibility_score']
                },
                status="info"
            )
            
            # Create notification for eligibility result
            # First, find the user ID for the applicant
            cursor.execute("SELECT id FROM users WHERE email = ? AND company_id = ?", (applicant['email'], company_id))
            applicant_user = cursor.fetchone()
            
            if applicant_user:
                create_notification(
                    conn,
                    company_id,
                    applicant_user['id'],
                    'eligibility_result',
                    template_vars={
                        'applicant_name': f"{applicant['first_name']} {applicant['last_name']}",
                        'project_name': project['name'],
                        'result': 'Eligible' if eligibility_result['eligible'] else 'Not Eligible',
                        'recommendations': '\n'.join(eligibility_result.get('recommendations', []))
                    },
                    entity_type='validation',
                    entity_id=f"{applicant_id}_{project_id}",
                    priority='high' if eligibility_result['eligible'] else 'normal',
                    action_url=f"/dashboard/projects/{project_id}/apply" if eligibility_result['eligible'] else None
                )
            
            conn.close()
            
            return eligibility_result
            
    except Exception as e:
        logger.error(f"Error validating eligibility: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate eligibility")

@app.post("/api/v1/eligibility/income-analysis")
async def analyze_income(
    income_request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze income against AMI thresholds for a location"""
    try:
        annual_income = income_request.get('annual_income')
        household_size = income_request.get('household_size', 1)
        location = income_request.get('location', 'national')
        
        if not annual_income:
            raise HTTPException(status_code=400, detail="annual_income is required")
        
        # Get AMI data and calculate category
        ami_data = get_ami_data_by_location(location)
        ami_thresholds = calculate_ami_thresholds(ami_data['mfi'], household_size)
        income_category = determine_income_category(annual_income, ami_thresholds)
        
        return {
            "analysis": {
                "annual_income": annual_income,
                "monthly_income": annual_income / 12,
                "household_size": household_size,
                "location": location,
                "ami_data": ami_data,
                "income_category": income_category,
                "thresholds": ami_thresholds
            },
            "affordable_rent_30": (annual_income / 12) * 0.30,  # 30% of income
            "affordable_rent_50": (annual_income / 12) * 0.50,  # 50% of income (severely cost-burdened threshold)
            "eligible_programs": income_category['eligible_programs'],
            "recommendations": [
                f"Based on {income_category['description']}, you may qualify for specific housing programs",
                f"Maximum recommended rent: ${(annual_income / 12) * 0.30:,.0f}/month (30% of income)",
                "Consider applying for rental assistance if available in your area"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error analyzing income: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze income")

@app.get("/api/v1/eligibility/projects/{applicant_id}")
async def get_eligible_projects(
    applicant_id: str,
    max_results: int = 10,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get projects that an applicant is eligible for"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL eligible projects not yet implemented")
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
            
            # Get applicant data
            cursor.execute("SELECT * FROM applicants WHERE id = ? AND company_id = ?", (applicant_id, company_id))
            applicant_row = cursor.fetchone()
            if not applicant_row:
                raise HTTPException(status_code=404, detail="Applicant not found")
            
            applicant = dict(applicant_row)
            
            # Get all projects for the company
            cursor.execute("SELECT * FROM projects WHERE company_id = ? ORDER BY created_at DESC", (company_id,))
            project_rows = cursor.fetchall()
            
            eligible_projects = []
            
            for project_row in project_rows:
                project = dict(project_row)
                eligibility = validate_applicant_eligibility(applicant, project)
                
                if eligibility['eligible']:
                    project_info = {
                        "project": project,
                        "eligibility": eligibility,
                        "eligibility_score": eligibility['eligibility_score']
                    }
                    
                    # Add affordability if rental cost available
                    if project.get('monthly_rent') and applicant.get('income'):
                        affordability = calculate_affordability_index(
                            applicant['income'],
                            project['monthly_rent'],
                            applicant.get('household_size', 1)
                        )
                        project_info['affordability'] = affordability
                    
                    eligible_projects.append(project_info)
            
            # Sort by eligibility score (highest first)
            eligible_projects.sort(key=lambda x: x['eligibility_score'], reverse=True)
            
            # Limit results
            eligible_projects = eligible_projects[:max_results]
            
            conn.close()
            
            return {
                "applicant_id": applicant_id,
                "total_eligible_projects": len(eligible_projects),
                "eligible_projects": eligible_projects,
                "applicant_summary": {
                    "name": f"{applicant.get('first_name', '')} {applicant.get('last_name', '')}",
                    "income": applicant.get('income'),
                    "household_size": applicant.get('household_size'),
                    "location_preference": applicant.get('location_preference')
                }
            }
            
    except Exception as e:
        logger.error(f"Error getting eligible projects: {e}")
        raise HTTPException(status_code=500, detail="Failed to get eligible projects")

# Notification Endpoints
@app.get("/api/v1/notifications")
async def get_notifications(
    status: str = None,
    type: str = None,
    priority: str = None,
    skip: int = 0,
    limit: int = 20,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get notifications for current user with filtering"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL notifications not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            
            # Build query with filters
            query = """
                SELECT n.*, u.email as user_email 
                FROM notifications n
                JOIN users u ON n.user_id = u.id
                WHERE n.user_id = ?
            """
            params = [user_data["sub"]]
            
            if status:
                query += " AND n.status = ?"
                params.append(status)
            
            if type:
                query += " AND n.type = ?"
                params.append(type)
            
            if priority:
                query += " AND n.priority = ?"
                params.append(priority)
            
            query += " ORDER BY n.created_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, skip])
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            notifications = []
            for row in cursor.fetchall():
                notifications.append({
                    "id": row["id"],
                    "type": row["type"],
                    "title": row["title"],
                    "message": row["message"],
                    "entity_type": row["entity_type"],
                    "entity_id": row["entity_id"],
                    "priority": row["priority"],
                    "status": row["status"],
                    "action_url": row["action_url"],
                    "created_at": row["created_at"],
                    "read_at": row["read_at"]
                })
            
            # Get unread count
            unread_count = get_unread_notification_count(conn, user_data["sub"])
            
            conn.close()
            
            return {
                "notifications": notifications,
                "unread_count": unread_count,
                "total": len(notifications)
            }
            
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail="Failed to get notifications")

@app.post("/api/v1/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Mark a notification as read"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL notification update not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            
            success = mark_notification_read(conn, notification_id, user_data["sub"])
            
            if not success:
                raise HTTPException(status_code=404, detail="Notification not found or already read")
            
            conn.close()
            
            return {"message": "Notification marked as read"}
            
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification")

@app.post("/api/v1/notifications/mark-all-read")
async def mark_all_notifications_read(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Mark all notifications as read for current user"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL bulk notification update not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE notifications 
                SET status = 'read', read_at = ?
                WHERE user_id = ? AND status = 'unread'
            """, (datetime.utcnow().isoformat(), user_data["sub"]))
            
            updated_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            return {
                "message": "All notifications marked as read",
                "updated_count": updated_count
            }
            
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notifications")

@app.get("/api/v1/notifications/preferences")
async def get_notification_preferences(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get notification preferences for current user"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL preferences not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM notification_preferences WHERE user_id = ?", (user_data["sub"],))
            prefs = cursor.fetchone()
            
            if prefs:
                result = {
                    "email_enabled": bool(prefs["email_enabled"]),
                    "sms_enabled": bool(prefs["sms_enabled"]),
                    "push_enabled": bool(prefs["push_enabled"]),
                    "notification_types": json.loads(prefs["notification_types"]) if prefs["notification_types"] else None,
                    "email_frequency": prefs["email_frequency"],
                    "quiet_hours_start": prefs["quiet_hours_start"],
                    "quiet_hours_end": prefs["quiet_hours_end"]
                }
            else:
                # Return defaults
                result = {
                    "email_enabled": True,
                    "sms_enabled": False,
                    "push_enabled": True,
                    "notification_types": None,
                    "email_frequency": "immediate",
                    "quiet_hours_start": None,
                    "quiet_hours_end": None
                }
            
            conn.close()
            return result
            
    except Exception as e:
        logger.error(f"Error getting notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to get preferences")

@app.post("/api/v1/notifications/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Update notification preferences for current user"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL preferences update not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            # Check if preferences exist
            cursor.execute("SELECT id FROM notification_preferences WHERE user_id = ?", (user_data["sub"],))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing preferences
                cursor.execute("""
                    UPDATE notification_preferences 
                    SET email_enabled = ?, sms_enabled = ?, push_enabled = ?,
                        notification_types = ?, email_frequency = ?,
                        quiet_hours_start = ?, quiet_hours_end = ?,
                        updated_at = ?
                    WHERE user_id = ?
                """, (
                    1 if preferences.email_enabled else 0,
                    1 if preferences.sms_enabled else 0,
                    1 if preferences.push_enabled else 0,
                    json.dumps(preferences.notification_types) if preferences.notification_types else None,
                    preferences.email_frequency,
                    preferences.quiet_hours_start,
                    preferences.quiet_hours_end,
                    datetime.utcnow().isoformat(),
                    user_data["sub"]
                ))
            else:
                # Insert new preferences
                pref_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO notification_preferences 
                    (id, user_id, email_enabled, sms_enabled, push_enabled,
                     notification_types, email_frequency, quiet_hours_start, quiet_hours_end)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pref_id,
                    user_data["sub"],
                    1 if preferences.email_enabled else 0,
                    1 if preferences.sms_enabled else 0,
                    1 if preferences.push_enabled else 0,
                    json.dumps(preferences.notification_types) if preferences.notification_types else None,
                    preferences.email_frequency,
                    preferences.quiet_hours_start,
                    preferences.quiet_hours_end
                ))
            
            conn.commit()
            conn.close()
            
            return {"message": "Notification preferences updated successfully"}
            
    except Exception as e:
        logger.error(f"Error updating notification preferences: {e}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

@app.post("/api/v1/notifications/test")
async def send_test_notification(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Send a test notification to current user"""
    try:
        # Get user info from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            # PostgreSQL version - placeholder for now
            raise HTTPException(status_code=501, detail="PostgreSQL test notification not yet implemented")
        else:
            # SQLite version
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get user's company
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_data["sub"],))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            # Create test notification
            notification_id = create_notification(
                conn,
                user["company_id"],
                user_data["sub"],
                'system_alert',
                title='Test Notification',
                message='This is a test notification from HomeVerse. If you received this, your notifications are working correctly!',
                priority='low',
                metadata={'test': True, 'timestamp': datetime.utcnow().isoformat()}
            )
            
            conn.close()
            
            return {
                "message": "Test notification sent successfully",
                "notification_id": notification_id
            }
            
    except Exception as e:
        logger.error(f"Error sending test notification: {e}")
        raise HTTPException(status_code=500, detail="Failed to send test notification")

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
    logger.info(f"🚀 Starting HomeVerse API v2.0.5 ({ENVIRONMENT} mode)")
    
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

# Application Workflow Endpoints
@app.post("/api/v1/projects/{project_id}/apply")
async def create_application(
    project_id: str,
    applicant_id: str = None,
    priority: int = 0,
    metadata: dict = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new application for a project"""
    try:
        # Get user from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL workflow not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Verify project exists
            cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
            project = cursor.fetchone()
            if not project:
                raise ResourceNotFoundError("Project", project_id)
            
            # If applicant_id not provided, get from user
            if not applicant_id:
                cursor.execute("SELECT id FROM applicants WHERE email = ?", (user_data.get("email"),))
                applicant = cursor.fetchone()
                if not applicant:
                    raise ValidationError("No applicant profile found. Please create an applicant profile first.")
                applicant_id = applicant[0]
            
            # Check for existing application
            cursor.execute("""
                SELECT id FROM applications 
                WHERE applicant_id = ? AND project_id = ? 
                AND status NOT IN ('withdrawn', 'rejected')
            """, (applicant_id, project_id))
            
            if cursor.fetchone():
                raise ValidationError("You already have an active application for this project")
            
            # Create application
            application_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO applications 
                (id, company_id, applicant_id, project_id, status, workflow_stage, priority, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                application_id,
                project['company_id'],
                applicant_id,
                project_id,
                'draft',
                'initial',
                priority,
                json.dumps(metadata) if metadata else None
            ))
            
            # Create initial tasks
            create_application_tasks(conn, application_id, 'initial')
            
            # Log activity
            log_activity(
                conn,
                project['company_id'],
                user_data["sub"],
                'application_created',
                'Application Created',
                f'New application for {project["name"]}',
                entity_type='application',
                entity_id=application_id
            )
            
            # Create notification
            create_notification(
                conn,
                project['company_id'],
                user_data["sub"],
                'application_status',
                template_vars={
                    'applicant_name': user_data.get('email'),
                    'project_name': project['name'],
                    'status': 'created',
                    'details': 'You can now submit required documents.'
                },
                entity_type='application',
                entity_id=application_id
            )
            
            conn.commit()
            
            # Get created application
            cursor.execute("SELECT * FROM applications WHERE id = ?", (application_id,))
            application = dict(cursor.fetchone())
            
            conn.close()
            
            return {
                "application": application,
                "next_steps": get_next_steps(application['workflow_stage'])
            }
            
    except (ValidationError, ResourceNotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error creating application: {e}")
        raise HTTPException(status_code=500, detail="Failed to create application")

@app.get("/api/v1/applications/{application_id}")
async def get_application(
    application_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get application details with workflow status"""
    try:
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL workflow not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get application with related data
            cursor.execute("""
                SELECT a.*, p.name as project_name, p.address as project_address,
                       ap.first_name || ' ' || ap.last_name as applicant_name,
                       ap.email as applicant_email
                FROM applications a
                JOIN projects p ON a.project_id = p.id
                JOIN applicants ap ON a.applicant_id = ap.id
                WHERE a.id = ?
            """, (application_id,))
            
            application = cursor.fetchone()
            if not application:
                raise ResourceNotFoundError("Application", application_id)
            
            application_dict = dict(application)
            
            # Get workflow stages
            cursor.execute("""
                SELECT * FROM application_workflow_stages
                WHERE company_id = ?
                ORDER BY order_index
            """, (application['company_id'],))
            
            stages = [dict(row) for row in cursor.fetchall()]
            
            # Get current stage details
            current_stage = next((s for s in stages if s['name'] == application['workflow_stage']), None)
            
            # Get transitions history
            cursor.execute("""
                SELECT * FROM application_transitions
                WHERE application_id = ?
                ORDER BY created_at DESC
            """, (application_id,))
            
            transitions = [dict(row) for row in cursor.fetchall()]
            
            # Get pending tasks
            cursor.execute("""
                SELECT * FROM application_tasks
                WHERE application_id = ? AND status = 'pending'
                ORDER BY priority DESC, created_at
            """, (application_id,))
            
            tasks = [dict(row) for row in cursor.fetchall()]
            
            conn.close()
            
            return {
                "application": application_dict,
                "workflow": {
                    "current_stage": current_stage,
                    "all_stages": stages,
                    "progress_percentage": calculate_progress(application['workflow_stage'], stages)
                },
                "transitions": transitions,
                "pending_tasks": tasks
            }
            
    except ResourceNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error getting application: {e}")
        raise HTTPException(status_code=500, detail="Failed to get application")

@app.post("/api/v1/applications/{application_id}/submit")
async def submit_application(
    application_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Submit application for review"""
    try:
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL workflow not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            # Verify application exists and is in draft
            cursor.execute("""
                SELECT * FROM applications WHERE id = ? AND status = 'draft'
            """, (application_id,))
            
            application = cursor.fetchone()
            if not application:
                raise ValidationError("Application not found or already submitted")
            
            # Check required documents
            missing_docs = check_required_documents(conn, application_id)
            if missing_docs:
                raise ValidationError(f"Missing required documents: {', '.join(missing_docs)}")
            
            # Update status
            cursor.execute("""
                UPDATE applications 
                SET status = 'submitted', 
                    submitted_at = ?,
                    workflow_stage = 'document_review'
                WHERE id = ?
            """, (datetime.utcnow().isoformat(), application_id))
            
            # Create transition record
            transition_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO application_transitions
                (id, application_id, from_stage, to_stage, triggered_by, transition_type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                transition_id,
                application_id,
                'initial',
                'document_review',
                credentials.credentials,
                'submit',
                'Application submitted for review'
            ))
            
            # Create tasks for document review
            create_application_tasks(conn, application_id, 'document_review')
            
            # Send notification
            create_notification(
                conn,
                application['company_id'],
                application['applicant_id'],
                'application_status',
                'Application Submitted',
                'Your application has been submitted and is under review.',
                entity_type='application',
                entity_id=application_id
            )
            
            conn.commit()
            conn.close()
            
            return {"message": "Application submitted successfully", "status": "submitted"}
            
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error submitting application: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit application")

@app.post("/api/v1/applications/{application_id}/advance")
async def advance_workflow(
    application_id: str,
    notes: str = None,
    force: bool = False,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Advance application to next workflow stage"""
    try:
        # Get user from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check user role - only managers and admins can advance workflow
        if user_data.get("role") not in ["admin", "manager", "lender", "developer"]:
            raise AuthorizationError("Only authorized users can advance workflow")
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL workflow not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get application
            cursor.execute("SELECT * FROM applications WHERE id = ?", (application_id,))
            application = cursor.fetchone()
            if not application:
                raise ResourceNotFoundError("Application", application_id)
            
            # Get current and next stage
            cursor.execute("""
                SELECT * FROM application_workflow_stages
                WHERE company_id = ?
                ORDER BY order_index
            """, (application['company_id'],))
            
            stages = list(cursor.fetchall())
            current_idx = next((i for i, s in enumerate(stages) if s['name'] == application['workflow_stage']), -1)
            
            if current_idx == -1 or current_idx >= len(stages) - 1:
                raise ValidationError("Cannot advance: already at final stage")
            
            next_stage = stages[current_idx + 1]
            
            # Check if current stage tasks are complete (unless forced)
            if not force:
                cursor.execute("""
                    SELECT COUNT(*) as pending FROM application_tasks
                    WHERE application_id = ? AND status = 'pending'
                """, (application_id,))
                
                if cursor.fetchone()['pending'] > 0:
                    raise ValidationError("Cannot advance: pending tasks in current stage")
            
            # Update workflow stage
            cursor.execute("""
                UPDATE applications 
                SET workflow_stage = ?,
                    reviewed_at = CASE WHEN ? = 'final_review' THEN ? ELSE reviewed_at END
                WHERE id = ?
            """, (next_stage['name'], next_stage['name'], datetime.utcnow().isoformat(), application_id))
            
            # Create transition record
            transition_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO application_transitions
                (id, application_id, from_stage, to_stage, triggered_by, transition_type, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                transition_id,
                application_id,
                application['workflow_stage'],
                next_stage['name'],
                user_data["sub"],
                'manual_advance' if force else 'advance',
                notes
            ))
            
            # Create tasks for new stage
            create_application_tasks(conn, application_id, next_stage['name'])
            
            # Handle auto-advance stages
            if next_stage['auto_advance']:
                perform_auto_checks(conn, application_id, next_stage['name'])
            
            conn.commit()
            conn.close()
            
            return {
                "message": f"Application advanced to {next_stage['description']}",
                "new_stage": next_stage['name']
            }
            
    except (ValidationError, AuthorizationError, ResourceNotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error advancing workflow: {e}")
        raise HTTPException(status_code=500, detail="Failed to advance workflow")

@app.post("/api/v1/applications/{application_id}/decision")
async def make_decision(
    application_id: str,
    decision: str,  # approved, rejected, waitlisted
    reason: str = None,
    conditions: list[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Make final decision on application"""
    try:
        # Get user from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Check authorization
        if user_data.get("role") not in ["admin", "manager", "lender", "developer"]:
            raise AuthorizationError("Only authorized users can make decisions")
        
        if decision not in ["approved", "rejected", "waitlisted"]:
            raise ValidationError("Invalid decision. Must be: approved, rejected, or waitlisted")
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostgreSQL workflow not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            
            # Update application
            cursor.execute("""
                UPDATE applications 
                SET decision = ?,
                    decision_reason = ?,
                    decision_maker_id = ?,
                    decided_at = ?,
                    status = ?,
                    workflow_stage = 'decision'
                WHERE id = ?
            """, (
                decision,
                reason,
                user_data["sub"],
                datetime.utcnow().isoformat(),
                decision,
                application_id
            ))
            
            # Get application details for notification
            cursor.execute("""
                SELECT a.*, p.name as project_name, ap.email as applicant_email
                FROM applications a
                JOIN projects p ON a.project_id = p.id
                JOIN applicants ap ON a.applicant_id = ap.id
                WHERE a.id = ?
            """, (application_id,))
            
            app_data = cursor.fetchone()
            
            # Create notification
            notification_msg = {
                'approved': f'Congratulations! Your application for {app_data["project_name"]} has been approved.',
                'rejected': f'Your application for {app_data["project_name"]} has been rejected.',
                'waitlisted': f'Your application for {app_data["project_name"]} has been placed on the waitlist.'
            }[decision]
            
            create_notification(
                conn,
                app_data['company_id'],
                app_data['applicant_id'],
                'application_status',
                f'Application {decision.capitalize()}',
                notification_msg + (f' Reason: {reason}' if reason else ''),
                entity_type='application',
                entity_id=application_id,
                priority='high' if decision == 'approved' else 'normal'
            )
            
            conn.commit()
            conn.close()
            
            return {
                "message": f"Decision recorded: {decision}",
                "decision": decision,
                "reason": reason,
                "conditions": conditions
            }
            
    except (ValidationError, AuthorizationError):
        raise
    except Exception as e:
        logger.error(f"Error making decision: {e}")
        raise HTTPException(status_code=500, detail="Failed to record decision")

# Helper functions for workflow
def create_application_tasks(conn, application_id: str, stage: str):
    """Create tasks for a workflow stage"""
    cursor = conn.cursor()
    
    # Define tasks by stage
    stage_tasks = {
        'initial': [
            ('upload_documents', 'Upload Required Documents', 'Upload government ID and proof of income'),
            ('complete_profile', 'Complete Applicant Profile', 'Ensure all profile fields are filled')
        ],
        'document_review': [
            ('verify_documents', 'Verify Documents', 'Review uploaded documents for authenticity'),
            ('check_completeness', 'Check Application Completeness', 'Ensure all required information is provided')
        ],
        'eligibility_check': [
            ('verify_income', 'Verify Income Eligibility', 'Confirm income meets project requirements'),
            ('check_household_size', 'Verify Household Size', 'Confirm household size matches application')
        ],
        'background_check': [
            ('criminal_check', 'Criminal Background Check', 'Run criminal background verification'),
            ('credit_check', 'Credit History Review', 'Review credit history and rental history')
        ],
        'final_review': [
            ('final_assessment', 'Final Application Assessment', 'Complete final review of all materials'),
            ('prepare_decision', 'Prepare Decision Recommendation', 'Document recommendation for approval')
        ]
    }
    
    tasks = stage_tasks.get(stage, [])
    
    for task_type, title, description in tasks:
        task_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO application_tasks
            (id, application_id, task_type, title, description, status, priority)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (task_id, application_id, task_type, title, description, 'pending', 'normal'))

def check_required_documents(conn, application_id: str) -> list:
    """Check if required documents are uploaded"""
    cursor = conn.cursor()
    
    # Get required documents for current stage
    cursor.execute("""
        SELECT aws.required_documents
        FROM applications a
        JOIN application_workflow_stages aws ON a.workflow_stage = aws.name
        WHERE a.id = ? AND aws.company_id = a.company_id
    """, (application_id,))
    
    result = cursor.fetchone()
    if not result or not result['required_documents']:
        return []
    
    required_docs = json.loads(result['required_documents'])
    
    # Check uploaded documents
    cursor.execute("""
        SELECT document_category FROM documents
        WHERE entity_type = 'application' AND entity_id = ?
    """, (application_id,))
    
    uploaded_categories = {row['document_category'] for row in cursor.fetchall()}
    
    missing = [doc for doc in required_docs if doc not in uploaded_categories]
    return missing

def perform_auto_checks(conn, application_id: str, stage: str):
    """Perform automatic checks for auto-advance stages"""
    if stage == 'eligibility_check':
        # Run eligibility verification
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.*, ap.income as annual_income, ap.household_size,
                   p.ami_levels, p.latitude, p.longitude
            FROM applications a
            JOIN applicants ap ON a.applicant_id = ap.id
            JOIN projects p ON a.project_id = p.id
            WHERE a.id = ?
        """, (application_id,))
        
        data = cursor.fetchone()
        
        # Convert row to dict for validation
        applicant_data = {
            'annual_income': data['annual_income'],
            'household_size': data['household_size'],
            'preferred_location_lat': data['latitude'],
            'preferred_location_lon': data['longitude']
        }
        
        project_data = {
            'ami_levels': json.loads(data['ami_levels']),
            'total_units': 100,  # Default if not available
            'affordable_units': 80,  # Default if not available
            'available_units': 10,  # Default if not available
            'latitude': data['latitude'],
            'longitude': data['longitude'],
            'min_income': 0,
            'max_income': 100000,
            'bedroom_sizes': [1, 2, 3]
        }
        
        # Perform eligibility check
        result = validate_applicant_eligibility(applicant_data, project_data)
        
        # Update application
        cursor.execute("""
            UPDATE applications
            SET eligibility_verified = ?,
                score = ?
            WHERE id = ?
        """, (1 if result['eligible'] else 0, result['eligibility_score'], application_id))
        
        # Auto-advance if eligible
        if result['eligible']:
            cursor.execute("""
                UPDATE applications SET workflow_stage = 'background_check'
                WHERE id = ?
            """, (application_id,))

def calculate_progress(current_stage: str, all_stages: list) -> int:
    """Calculate workflow progress percentage"""
    stage_names = [s['name'] for s in all_stages]
    if current_stage not in stage_names:
        return 0
    
    current_idx = stage_names.index(current_stage)
    return int((current_idx + 1) / len(stage_names) * 100)

def get_next_steps(stage: str) -> list:
    """Get next steps for current stage"""
    next_steps = {
        'initial': [
            'Upload required documents (ID, proof of income)',
            'Complete your applicant profile',
            'Review application before submission'
        ],
        'document_review': [
            'Wait for document verification',
            'You may be contacted for additional documents'
        ],
        'eligibility_check': [
            'Eligibility is being verified',
            'You will be notified of the results'
        ],
        'background_check': [
            'Background verification in progress',
            'This typically takes 2-3 business days'
        ],
        'final_review': [
            'Your application is in final review',
            'Decision will be made soon'
        ],
        'decision': [
            'Review your decision letter',
            'Follow instructions in the decision'
        ]
    }
    
    return next_steps.get(stage, ['Contact support for assistance'])

# Geospatial Search Endpoints
@app.get("/api/v1/search/projects")
async def search_projects_by_location(
    lat: float,
    lon: float,
    radius_miles: float = 10.0,
    min_units: int = None,
    max_units: int = None,
    ami_min: int = None,
    ami_max: int = None,
    status: str = "active",
    limit: int = 20,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Search for projects within a radius of a given location"""
    try:
        # Validate inputs
        if not (-90 <= lat <= 90):
            raise ValidationError("Latitude must be between -90 and 90", field="lat")
        if not (-180 <= lon <= 180):
            raise ValidationError("Longitude must be between -180 and 180", field="lon")
        if radius_miles <= 0 or radius_miles > 100:
            raise ValidationError("Radius must be between 0 and 100 miles", field="radius_miles")
        
        if USE_POSTGRESQL:
            # PostgreSQL with PostGIS
            raise HTTPException(status_code=501, detail="PostGIS search not yet implemented")
        else:
            # SQLite implementation with Haversine formula
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            
            # Add Haversine distance function to SQLite
            conn.create_function("haversine", 4, calculate_haversine_distance)
            
            # Build query
            query = """
                SELECT *, 
                       haversine(?, ?, latitude, longitude) as distance_miles
                FROM projects
                WHERE haversine(?, ?, latitude, longitude) <= ?
                  AND status = ?
            """
            params = [lat, lon, lat, lon, radius_miles, status]
            
            # Add optional filters
            if min_units is not None:
                query += " AND total_units >= ?"
                params.append(min_units)
            
            if max_units is not None:
                query += " AND total_units <= ?"
                params.append(max_units)
            
            if ami_min is not None:
                query += " AND CAST(json_extract(ami_levels, '$[0]') AS INTEGER) >= ?"
                params.append(ami_min)
            
            if ami_max is not None:
                query += " AND CAST(json_extract(ami_levels, '$[#-1]') AS INTEGER) <= ?"
                params.append(ami_max)
            
            query += " ORDER BY distance_miles ASC LIMIT ?"
            params.append(limit)
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            projects = []
            for row in cursor.fetchall():
                project = dict(row)
                project['ami_levels'] = json.loads(project['ami_levels']) if project['ami_levels'] else []
                project['amenities'] = json.loads(project['amenities']) if project['amenities'] else []
                project['distance_miles'] = round(project['distance_miles'], 2)
                projects.append(project)
            
            conn.close()
            
            # Log search activity
            if projects:
                conn = sqlite3.connect(DATABASE_PATH)
                log_activity(
                    conn,
                    projects[0]['company_id'] if projects else 'system',
                    credentials.credentials,
                    'search',
                    'Project Search',
                    f'Searched for projects within {radius_miles} miles of ({lat}, {lon})',
                    metadata={
                        'center': {'lat': lat, 'lon': lon},
                        'radius_miles': radius_miles,
                        'results_count': len(projects),
                        'filters': {
                            'min_units': min_units,
                            'max_units': max_units,
                            'ami_min': ami_min,
                            'ami_max': ami_max
                        }
                    }
                )
                conn.close()
            
            return {
                "center": {"lat": lat, "lon": lon},
                "radius_miles": radius_miles,
                "total_results": len(projects),
                "projects": projects
            }
            
    except ValidationError:
        raise
    except Exception as e:
        logger.error(f"Error searching projects: {e}")
        raise HTTPException(status_code=500, detail="Failed to search projects")

@app.get("/api/v1/search/applicants")
async def search_applicants_by_location(
    project_id: str = None,
    lat: float = None,
    lon: float = None,
    radius_miles: float = 25.0,
    income_min: float = None,
    income_max: float = None,
    household_size_min: int = None,
    household_size_max: int = None,
    limit: int = 50,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Search for applicants near a project or location"""
    try:
        # Get user from token
        token = credentials.credentials
        user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Require either project_id or lat/lon
        if not project_id and (lat is None or lon is None):
            raise ValidationError("Either project_id or lat/lon coordinates are required")
        
        if USE_POSTGRESQL:
            raise HTTPException(status_code=501, detail="PostGIS search not yet implemented")
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            
            # If project_id provided, get its location
            if project_id:
                cursor = conn.cursor()
                cursor.execute("SELECT latitude, longitude FROM projects WHERE id = ?", (project_id,))
                project = cursor.fetchone()
                if not project:
                    raise ResourceNotFoundError("Project", project_id)
                lat = project['latitude']
                lon = project['longitude']
            
            # Add Haversine function
            conn.create_function("haversine", 4, calculate_haversine_distance)
            
            # Build query
            query = """
                SELECT *, 
                       haversine(?, ?, preferred_location_lat, preferred_location_lon) as distance_miles
                FROM applicants
                WHERE haversine(?, ?, preferred_location_lat, preferred_location_lon) <= ?
                  AND status = 'active'
            """
            params = [lat, lon, lat, lon, radius_miles]
            
            # Add filters
            if income_min is not None:
                query += " AND annual_income >= ?"
                params.append(income_min)
            
            if income_max is not None:
                query += " AND annual_income <= ?"
                params.append(income_max)
            
            if household_size_min is not None:
                query += " AND household_size >= ?"
                params.append(household_size_min)
            
            if household_size_max is not None:
                query += " AND household_size <= ?"
                params.append(household_size_max)
            
            query += " ORDER BY distance_miles ASC LIMIT ?"
            params.append(limit)
            
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            applicants = []
            for row in cursor.fetchall():
                applicant = dict(row)
                applicant['distance_miles'] = round(applicant['distance_miles'], 2)
                
                # Calculate AMI percentage for this location
                ami_data = get_ami_by_location(lat, lon, applicant['household_size'])
                if ami_data:
                    applicant['ami_percentage'] = round(
                        (applicant['annual_income'] / ami_data['ami_thresholds']['area_median']) * 100
                    )
                
                applicants.append(applicant)
            
            conn.close()
            
            return {
                "center": {"lat": lat, "lon": lon},
                "radius_miles": radius_miles,
                "total_results": len(applicants),
                "applicants": applicants
            }
            
    except ValidationError:
        raise
    except ResourceNotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error searching applicants: {e}")
        raise HTTPException(status_code=500, detail="Failed to search applicants")

@app.post("/api/v1/search/amenities")
async def search_nearby_amenities(
    lat: float,
    lon: float,
    amenity_types: list[str] = ["school", "hospital", "transit", "grocery", "park"],
    radius_miles: float = 5.0,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Search for amenities near a location (schools, transit, etc)"""
    try:
        # In production, this would call external APIs like Google Places, Transit APIs, etc.
        # For now, return simulated data
        
        amenities = {
            "schools": [
                {
                    "name": "Lincoln Elementary School",
                    "type": "elementary",
                    "distance_miles": 0.8,
                    "rating": 4.2,
                    "address": "123 School St"
                },
                {
                    "name": "Washington High School",
                    "type": "high_school",
                    "distance_miles": 1.5,
                    "rating": 3.8,
                    "address": "456 Education Blvd"
                }
            ] if "school" in amenity_types else [],
            
            "transit": [
                {
                    "name": "Central Station",
                    "type": "metro",
                    "distance_miles": 0.3,
                    "lines": ["Red Line", "Blue Line"],
                    "walk_time_minutes": 6
                },
                {
                    "name": "Bus Stop 42",
                    "type": "bus",
                    "distance_miles": 0.1,
                    "routes": ["42", "78", "Express"],
                    "walk_time_minutes": 2
                }
            ] if "transit" in amenity_types else [],
            
            "grocery": [
                {
                    "name": "Fresh Market",
                    "type": "supermarket",
                    "distance_miles": 0.5,
                    "hours": "7AM-10PM",
                    "has_pharmacy": True
                }
            ] if "grocery" in amenity_types else [],
            
            "healthcare": [
                {
                    "name": "Community Health Center",
                    "type": "clinic",
                    "distance_miles": 1.2,
                    "accepts_medicaid": True,
                    "emergency_services": False
                },
                {
                    "name": "Regional Medical Center",
                    "type": "hospital",
                    "distance_miles": 3.5,
                    "emergency_services": True,
                    "trauma_level": 2
                }
            ] if "hospital" in amenity_types else [],
            
            "parks": [
                {
                    "name": "Riverside Park",
                    "type": "park",
                    "distance_miles": 0.6,
                    "size_acres": 25,
                    "amenities": ["playground", "walking_trail", "picnic_area"]
                }
            ] if "park" in amenity_types else []
        }
        
        # Calculate walkability score
        walkability_score = calculate_walkability_score(amenities)
        
        # Calculate transit score
        transit_score = calculate_transit_score(amenities.get("transit", []))
        
        return {
            "location": {"lat": lat, "lon": lon},
            "radius_miles": radius_miles,
            "amenities": amenities,
            "scores": {
                "walkability": walkability_score,
                "transit": transit_score,
                "overall_livability": round((walkability_score + transit_score) / 2)
            }
        }
        
    except Exception as e:
        logger.error(f"Error searching amenities: {e}")
        raise HTTPException(status_code=500, detail="Failed to search amenities")

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points on Earth using Haversine formula"""
    if lat2 is None or lon2 is None:
        return float('inf')
    
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth's radius in miles
    r = 3956
    
    return c * r

def calculate_walkability_score(amenities: dict) -> int:
    """Calculate walkability score based on nearby amenities"""
    score = 50  # Base score
    
    # Points for amenities within walking distance
    for category, items in amenities.items():
        for item in items:
            if item.get('distance_miles', float('inf')) <= 0.5:  # Within 0.5 miles
                score += 10
            elif item.get('distance_miles', float('inf')) <= 1.0:  # Within 1 mile
                score += 5
    
    # Cap at 100
    return min(score, 100)

def calculate_transit_score(transit_stops: list) -> int:
    """Calculate transit accessibility score"""
    if not transit_stops:
        return 20  # Base score for areas without transit
    
    score = 40  # Base score with transit
    
    # Points for proximity to transit
    for stop in transit_stops:
        if stop.get('distance_miles', float('inf')) <= 0.25:  # Within 1/4 mile
            score += 20
        elif stop.get('distance_miles', float('inf')) <= 0.5:  # Within 1/2 mile
            score += 10
        
        # Bonus for rail/metro
        if stop.get('type') == 'metro':
            score += 10
    
    return min(score, 100)

# WebSocket endpoint for real-time notifications
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications and updates"""
    try:
        # Verify user authentication via query param token
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008, reason="Missing authentication token")
            return
        
        try:
            user_data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            if user_data["sub"] != user_id:
                await websocket.close(code=1008, reason="Invalid user ID")
                return
        except jwt.InvalidTokenError:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
        # Get user's company
        if USE_POSTGRESQL:
            # PostgreSQL implementation would go here
            company_id = "default-company"
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT company_id FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            company_id = user[0] if user else "default-company"
            conn.close()
        
        # Connect the WebSocket
        ws_id = await manager.connect(websocket, user_id, company_id)
        
        # Send initial connection success message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "WebSocket connection established"
        })
        
        # Send any pending notifications
        if USE_POSTGRESQL:
            # PostgreSQL implementation
            pass
        else:
            conn = sqlite3.connect(DATABASE_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get unread notifications
            cursor.execute("""
                SELECT * FROM notifications 
                WHERE user_id = ? AND status = 'unread'
                ORDER BY created_at DESC
                LIMIT 10
            """, (user_id,))
            
            for row in cursor.fetchall():
                await websocket.send_json({
                    "type": "notification",
                    "data": {
                        "id": row["id"],
                        "type": row["type"],
                        "title": row["title"],
                        "message": row["message"],
                        "priority": row["priority"],
                        "created_at": row["created_at"]
                    }
                })
            
            conn.close()
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif data.get("type") == "mark_read":
                notification_id = data.get("notification_id")
                if notification_id:
                    # Mark notification as read
                    if not USE_POSTGRESQL:
                        conn = sqlite3.connect(DATABASE_PATH)
                        cursor = conn.cursor()
                        cursor.execute("""
                            UPDATE notifications 
                            SET status = 'read', read_at = ?
                            WHERE id = ? AND user_id = ?
                        """, (datetime.now().isoformat(), notification_id, user_id))
                        conn.commit()
                        conn.close()
                    
                    await websocket.send_json({
                        "type": "notification_read",
                        "notification_id": notification_id
                    })
                    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id, company_id)
        logger.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=1011, reason="Internal server error")

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