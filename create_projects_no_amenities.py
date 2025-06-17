#!/usr/bin/env python3
"""Create test projects without amenities field"""

import requests
import json

# Login as developer
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'developer@test.com', 'password': 'password123'}
)
token = login_response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Projects without amenities
projects = [
    {
        "name": "Sunset Gardens",
        "description": "Affordable housing development in Sunset District",
        "location": "Sunset District, San Francisco, CA",
        "coordinates": [-122.4449, 37.7558],
        "total_units": 120,
        "available_units": 36,
        "ami_percentage": 80
    },
    {
        "name": "Oakland Commons", 
        "description": "Mixed-income community in Downtown Oakland",
        "location": "Downtown Oakland, CA",
        "coordinates": [-122.2711, 37.8044],
        "total_units": 200,
        "available_units": 60,
        "ami_percentage": 60
    },
    {
        "name": "Mission Bay Towers",
        "description": "New construction near UCSF campus",
        "location": "Mission Bay, San Francisco, CA",
        "coordinates": [-122.3954, 37.7679],
        "total_units": 300,
        "available_units": 90,
        "ami_percentage": 100
    }
]

# Create projects
for project in projects:
    response = requests.post(
        'http://localhost:8000/api/v1/projects',
        headers=headers,
        json=project
    )
    if response.status_code == 200:
        print(f"Created project: {project['name']}")
    else:
        print(f"Failed to create {project['name']}: {response.status_code} - {response.text}")

# Check heatmap data
print("\nChecking heatmap data...")
response = requests.get(
    'http://localhost:8000/api/v1/analytics/heatmap',
    headers=headers
)
heatmap_data = response.json()
print(f"Total projects: {heatmap_data['statistics']['total_projects']}")
print(f"Total applicants: {heatmap_data['statistics']['total_applicants']}")
if heatmap_data['projects']:
    print("\nProjects with locations:")
    for p in heatmap_data['projects']:
        print(f"  - {p['name']} at ({p['lat']}, {p['lng']})")