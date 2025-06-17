#!/usr/bin/env python3
"""Create minimal test project"""

import requests
import json

# Login as developer
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'developer@test.com', 'password': 'password123'}
)
token = login_response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Minimal project
project = {
    "name": "Test Project with Location",
    "description": "A test project to verify heatmap",
    "location": "San Francisco, CA",
    "coordinates": [-122.4194, 37.7749],
    "total_units": 100,
    "available_units": 30
}

response = requests.post(
    'http://localhost:8000/api/v1/projects',
    headers=headers,
    json=project
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code == 200:
    print("\nProject created successfully!")
    
    # Check heatmap data
    response = requests.get(
        'http://localhost:8000/api/v1/analytics/heatmap',
        headers=headers
    )
    heatmap = response.json()
    print(f"\nHeatmap data:")
    print(f"Total projects: {heatmap['statistics']['total_projects']}")
    if heatmap['projects']:
        for p in heatmap['projects']:
            print(f"  - {p['name']} at ({p['lat']}, {p['lng']})")