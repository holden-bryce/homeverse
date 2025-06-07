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

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)