"""
HomeVerse FastAPI Application with PostgreSQL Support
Enhanced version with production-ready features
"""

import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import uvicorn

# Database imports
from app.db.postgresql_database import postgresql_db, get_db
from sqlalchemy.ext.asyncio import AsyncSession

# API routes - import what's available
try:
    from app.api.v1 import auth, projects, applicants, contact, admin, lenders, reports
except ImportError as e:
    logger.warning(f"Some API modules not available: {e}")
    # Create minimal router structure
    from fastapi import APIRouter
    auth = APIRouter()
    projects = APIRouter() 
    applicants = APIRouter()
    contact = APIRouter()
    admin = APIRouter()
    lenders = APIRouter()
    reports = APIRouter()

# Configuration
try:
    from app.config import settings
except ImportError:
    logger.warning("Config module not found, using environment variables")
    settings = None

# Logging setup
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format=os.getenv("LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
logger = logging.getLogger(__name__)

# Application lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("🚀 Starting HomeVerse application...")
    
    try:
        # Initialize PostgreSQL database
        await postgresql_db.initialize()
        logger.info("✅ Database initialized")
        
        # Create tables if they don't exist
        # await postgresql_db.create_tables()
        
        # Additional startup tasks
        await startup_tasks()
        
        logger.info("🎉 Application startup completed")
        
    except Exception as e:
        logger.error(f"❌ Application startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down HomeVerse application...")
    await postgresql_db.close()
    logger.info("✅ Application shutdown completed")

async def startup_tasks():
    """Additional startup tasks"""
    try:
        # Health check
        if await postgresql_db.health_check():
            logger.info("✅ Database health check passed")
        else:
            logger.warning("⚠️ Database health check failed")
        
        # You can add more startup tasks here:
        # - Cache warming
        # - Background task scheduling
        # - External service health checks
        
    except Exception as e:
        logger.error(f"Startup tasks failed: {e}")

# Create FastAPI application
app = FastAPI(
    title="HomeVerse API",
    description="Affordable Housing Management Platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure properly for production
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://homeverse-frontend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Company context middleware for Row Level Security
@app.middleware("http")
async def set_company_context(request: Request, call_next):
    """Set company context for database operations"""
    response = await call_next(request)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "error_id": str(id(exc))
        }
    )

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
            "timestamp": asyncio.get_event_loop().time()
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

@app.get("/health/database")
async def database_health(db: AsyncSession = Depends(get_db)):
    """Detailed database health check"""
    try:
        # Test basic query
        from sqlalchemy import text
        result = await db.execute(text("SELECT 1 as test"))
        test_value = result.scalar()
        
        # Get database stats
        stats_result = await db.execute(text("""
        SELECT 
            COUNT(*) as total_connections,
            SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
        """))
        stats = stats_result.fetchone()
        
        return {
            "status": "healthy",
            "test_query": test_value == 1,
            "total_connections": stats[0] if stats else 0,
            "active_connections": stats[1] if stats else 0,
            "database_name": os.getenv("DATABASE_URL", "").split("/")[-1]
        }
        
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "error": str(e)
            }
        )

# API routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(applicants.router, prefix="/api/v1/applicants", tags=["Applicants"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["Contact"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(lenders.router, prefix="/api/v1/lenders", tags=["Lenders"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "HomeVerse API v2.0 - PostgreSQL Edition",
        "documentation": "/api/docs",
        "health": "/health",
        "version": "2.0.0"
    }

# Database management endpoints (development only)
if os.getenv("ENVIRONMENT") == "development":
    
    @app.post("/dev/reset-database")
    async def reset_database(db: AsyncSession = Depends(get_db)):
        """Reset database - DEVELOPMENT ONLY"""
        try:
            from sqlalchemy import text
            
            # Drop all tables
            await db.execute(text("DROP SCHEMA public CASCADE"))
            await db.execute(text("CREATE SCHEMA public"))
            await db.execute(text("GRANT ALL ON SCHEMA public TO postgres"))
            await db.execute(text("GRANT ALL ON SCHEMA public TO public"))
            
            await db.commit()
            
            # Recreate tables
            await postgresql_db.create_tables()
            
            return {"message": "Database reset successfully"}
            
        except Exception as e:
            logger.error(f"Database reset failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/dev/database-stats")
    async def database_stats(db: AsyncSession = Depends(get_db)):
        """Get database statistics - DEVELOPMENT ONLY"""
        try:
            from sqlalchemy import text
            
            # Get table sizes
            result = await db.execute(text("""
            SELECT 
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
                pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            """))
            
            tables = []
            for row in result.fetchall():
                tables.append({
                    "table": row[0],
                    "size": row[1],
                    "size_bytes": row[2]
                })
            
            # Get record counts
            counts = {}
            for table in ["companies", "users", "projects", "applicants", "applications"]:
                try:
                    count_result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    counts[table] = count_result.scalar()
                except:
                    counts[table] = 0
            
            return {
                "table_sizes": tables,
                "record_counts": counts,
                "database_size": sum(t["size_bytes"] for t in tables)
            }
            
        except Exception as e:
            logger.error(f"Database stats failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Configuration for direct run
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    uvicorn.run(
        "app.main_postgresql:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level=os.getenv("LOG_LEVEL", "info").lower()
    )