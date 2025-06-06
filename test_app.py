#!/usr/bin/env python3
"""Minimal FastAPI app for testing"""

from fastapi import FastAPI
import uvicorn

# Create a minimal FastAPI app
app = FastAPI(
    title="HomeVerse API",
    description="Affordable Housing Analytics Platform",
    version="1.0.0"
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "HomeVerse API is running!", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "homeverse-api"}

@app.get("/api/v1/test")
async def test_endpoint():
    """Test API endpoint"""
    return {
        "message": "API v1 is working",
        "features": [
            "Multi-tenant architecture",
            "AI-powered matching",
            "Geospatial analytics",
            "CRA compliance reporting"
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting HomeVerse API...")
    print("📊 API Documentation: http://localhost:8000/docs")
    print("🔧 Health Check: http://localhost:8000/health")
    
    uvicorn.run(
        "test_app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )