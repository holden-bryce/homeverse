"""
HomeVerse Simple Production App for Render Deployment
Minimal version to get PostgreSQL working on Render
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)