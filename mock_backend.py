#!/usr/bin/env python3
"""Mock backend for testing when Supabase is down"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn
import uuid

app = FastAPI(title="HomeVerse Mock API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data storage
mock_users = {
    "developer@test.com": {
        "id": "mock-user-1",
        "email": "developer@test.com",
        "password": "password123",
        "role": "developer",
        "full_name": "Developer User",
        "company_id": "mock-company-1"
    }
}

mock_applicants = []
mock_projects = []

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
async def root():
    return {"message": "HomeVerse Mock API - Use when Supabase is down"}

@app.get("/health")
async def health():
    return {
        "status": "healthy (mock)",
        "database": "in-memory",
        "timestamp": datetime.now().isoformat(),
        "note": "Using mock backend due to Supabase/GCP issues"
    }

@app.post("/api/v1/auth/login")
async def login(request: LoginRequest):
    user = mock_users.get(request.email)
    if user and user["password"] == request.password:
        return {
            "access_token": f"mock-token-{user['id']}",
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "role": user["role"],
                "full_name": user["full_name"],
                "company": {
                    "id": "mock-company-1",
                    "name": "Mock Company",
                    "key": "mock"
                }
            }
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/v1/applicants")
async def list_applicants():
    return mock_applicants

@app.post("/api/v1/applicants")
async def create_applicant(data: dict):
    applicant = {
        "id": str(uuid.uuid4()),
        "company_id": "mock-company-1",
        "created_at": datetime.now().isoformat(),
        **data
    }
    mock_applicants.append(applicant)
    return applicant

@app.get("/api/v1/projects")
async def list_projects():
    return mock_projects

@app.post("/api/v1/projects")
async def create_project(data: dict):
    project = {
        "id": str(uuid.uuid4()),
        "company_id": "mock-company-1",
        "created_at": datetime.now().isoformat(),
        **data
    }
    mock_projects.append(project)
    return project

if __name__ == "__main__":
    print("🚨 Starting MOCK backend due to Supabase/GCP issues")
    print("📍 This is for UI testing only - data is not persisted")
    uvicorn.run(app, host="0.0.0.0", port=8000)