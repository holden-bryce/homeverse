#!/usr/bin/env python3
"""Create test projects with location data"""

import requests
import json

# Login as developer
login_response = requests.post(
    'http://localhost:8000/api/v1/auth/login',
    json={'email': 'developer@test.com', 'password': 'password123'}
)
token = login_response.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Sample projects with Bay Area locations
projects = [
    {
        "name": "Sunset Gardens",
        "description": "Affordable housing development in Sunset District",
        "total_units": 120,
        "affordable_units": 36,
        "min_income": 45000,
        "max_income": 90000,
        "min_rent": 1200,
        "max_rent": 2400,
        "amenities": ["Parking", "Laundry", "Community Garden"],
        "application_deadline": "2024-12-31",
        "availability_date": "2025-03-01",
        "location_lat": 37.7558,
        "location_lng": -122.4449,
        "address": "100 Sunset Blvd, San Francisco, CA 94122",
        "contact_email": "info@sunsetgardens.com",
        "contact_phone": "(415) 555-0100"
    },
    {
        "name": "Oakland Commons",
        "description": "Mixed-income community in Downtown Oakland",
        "total_units": 200,
        "affordable_units": 60,
        "min_income": 35000,
        "max_income": 70000,
        "min_rent": 1000,
        "max_rent": 2000,
        "amenities": ["Gym", "Rooftop Deck", "Bike Storage"],
        "application_deadline": "2024-11-30",
        "availability_date": "2025-01-15",
        "location_lat": 37.8044,
        "location_lng": -122.2711,
        "address": "500 Broadway, Oakland, CA 94607",
        "contact_email": "leasing@oaklandcommons.com",
        "contact_phone": "(510) 555-0200"
    },
    {
        "name": "Mission Bay Towers",
        "description": "New construction near UCSF campus",
        "total_units": 300,
        "affordable_units": 90,
        "min_income": 50000,
        "max_income": 100000,
        "min_rent": 1500,
        "max_rent": 3000,
        "amenities": ["Concierge", "Pet Spa", "Co-working Space"],
        "application_deadline": "2025-01-31",
        "availability_date": "2025-06-01",
        "location_lat": 37.7679,
        "location_lng": -122.3954,
        "address": "1000 Mission Bay Blvd, San Francisco, CA 94158",
        "contact_email": "info@missionbaytowers.com",
        "contact_phone": "(415) 555-0300"
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

print("\nTest projects created successfully!")