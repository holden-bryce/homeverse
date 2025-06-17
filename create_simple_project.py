#!/usr/bin/env python3
"""Create simple test project"""

import requests
import json

# Login as developer
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'developer@test.com', 'password': 'password123'}
)
token = login_response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Simple project data
project = {
    "name": "Test Housing Project",
    "description": "A test affordable housing project",
    "total_units": 100,
    "affordable_units": 30,
    "min_income": 40000,
    "max_income": 80000,
    "min_rent": 1200,
    "max_rent": 2400,
    "location_lat": 37.7749,
    "location_lng": -122.4194,
    "address": "123 Market St, San Francisco, CA 94105"
}

response = requests.post(
    'http://localhost:8000/api/v1/projects',
    headers=headers,
    json=project
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

# Check heatmap data
response = requests.get(
    'http://localhost:8000/api/v1/analytics/heatmap',
    headers=headers
)
print(f"\nHeatmap data: {json.dumps(response.json(), indent=2)}")