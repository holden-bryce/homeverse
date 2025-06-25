#!/usr/bin/env python3
"""Test script to check project view functionality"""

import requests
import json

# Test configuration
API_URL = "http://localhost:8000"
TEST_EMAIL = "developer@test.com"
TEST_PASSWORD = "password123"

def login():
    """Login and get access token"""
    response = requests.post(f"{API_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    else:
        print(f"Login failed: {response.status_code}")
        print(response.json())
        return None

def get_projects(token):
    """Get all projects"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/api/projects", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get projects: {response.status_code}")
        print(response.json())
        return []

def get_project_detail(token, project_id):
    """Get single project detail"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/api/projects/{project_id}", headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get project detail: {response.status_code}")
        print(response.json())
        return None

def main():
    print("Testing Project View Functionality")
    print("=" * 50)
    
    # Step 1: Login
    print("\n1. Logging in...")
    token = login()
    if not token:
        print("❌ Login failed. Make sure backend is running on http://localhost:8000")
        return
    print("✅ Login successful")
    
    # Step 2: Get projects
    print("\n2. Getting projects...")
    projects = get_projects(token)
    if not projects:
        print("❌ No projects found or error fetching projects")
        print("   - Make sure you have created at least one project")
        print("   - Check if the backend is running")
        return
    
    print(f"✅ Found {len(projects)} projects:")
    for project in projects:
        print(f"   - ID: {project['id']}, Name: {project['name']}")
    
    # Step 3: Test project detail view
    print("\n3. Testing project detail view...")
    if projects:
        first_project = projects[0]
        project_id = first_project['id']
        print(f"   Testing with project ID: {project_id}")
        
        detail = get_project_detail(token, project_id)
        if detail:
            print("✅ Project detail endpoint working")
            print(f"   - Name: {detail['name']}")
            print(f"   - Status: {detail.get('status', 'N/A')}")
            print(f"   - Total Units: {detail.get('total_units', 'N/A')}")
        else:
            print("❌ Failed to get project detail")
    
    # Step 4: Frontend navigation test
    print("\n4. Frontend navigation URLs:")
    if projects:
        for project in projects[:3]:  # Show first 3 projects
            project_id = project['id']
            print(f"   - Project: {project['name']}")
            print(f"     View URL: http://localhost:3000/dashboard/projects/{project_id}")

if __name__ == "__main__":
    main()