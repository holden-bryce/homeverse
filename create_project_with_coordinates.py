#!/usr/bin/env python3
"""Create test project with proper coordinates"""

import requests
import json

# Login as developer
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'developer@test.com', 'password': 'password123'}
)
token = login_response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Projects with proper structure
projects = [
    {
        "name": "Sunset Gardens",
        "description": "Affordable housing development in Sunset District",
        "location": "Sunset District, San Francisco, CA",
        "coordinates": [-122.4449, 37.7558],  # [lng, lat] format
        "total_units": 120,
        "available_units": 36,
        "ami_percentage": 80,
        "amenities": ["Parking", "Laundry", "Community Garden"]
    },
    {
        "name": "Oakland Commons",
        "description": "Mixed-income community in Downtown Oakland",
        "location": "Downtown Oakland, CA",
        "coordinates": [-122.2711, 37.8044],
        "total_units": 200,
        "available_units": 60,
        "ami_percentage": 60,
        "amenities": ["Gym", "Rooftop Deck", "Bike Storage"]
    },
    {
        "name": "Mission Bay Towers",
        "description": "New construction near UCSF campus",
        "location": "Mission Bay, San Francisco, CA",
        "coordinates": [-122.3954, 37.7679],
        "total_units": 300,
        "available_units": 90,
        "ami_percentage": 100,
        "amenities": ["Concierge", "Pet Spa", "Co-working Space"]
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
response = requests.get(
    'http://localhost:8000/api/v1/analytics/heatmap',
    headers=headers
)
print(f"\nHeatmap data: {json.dumps(response.json(), indent=2)}")