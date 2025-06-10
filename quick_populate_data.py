#!/usr/bin/env python3
"""
Quick script to populate HomeVerse with test data
"""
import os
from datetime import datetime, timedelta
import random
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")  # Use service key to bypass RLS
)

# Test company data
test_company = {
    "id": "11111111-1111-1111-1111-111111111111",
    "name": "Demo Housing Partners",
    "key": "demo-housing",
    "plan": "enterprise",
    "seats": 20,
    "settings": {
        "branding": {
            "primary_color": "#0d9488",
            "logo_url": "/logo.png"
        }
    }
}

# Test users
test_users = [
    {
        "email": "admin@homeverse.io",
        "password": "Admin123!",
        "full_name": "Sarah Johnson",
        "role": "admin",
        "company_id": test_company["id"]
    },
    {
        "email": "developer@homeverse.io", 
        "password": "Dev123!",
        "full_name": "Michael Chen",
        "role": "developer",
        "company_id": test_company["id"]
    },
    {
        "email": "lender@homeverse.io",
        "password": "Lender123!",
        "full_name": "Emily Williams",
        "role": "lender", 
        "company_id": test_company["id"]
    },
    {
        "email": "buyer@homeverse.io",
        "password": "Buyer123!",
        "full_name": "James Rodriguez",
        "role": "buyer",
        "company_id": test_company["id"]
    },
    {
        "email": "applicant@homeverse.io",
        "password": "Applicant123!",
        "full_name": "Maria Garcia",
        "role": "applicant",
        "company_id": test_company["id"]
    }
]

# Test projects
test_projects = [
    {
        "name": "Riverside Commons",
        "description": "A 48-unit affordable housing community featuring energy-efficient apartments, community gardens, and on-site childcare facilities.",
        "developer_name": "Urban Housing Partners",
        "location": "Oakland, CA",
        "address": "1234 Riverside Ave, Oakland, CA 94601",
        "lat": 37.8044,
        "lng": -122.2712,
        "total_units": 48,
        "affordable_units": 48,
        "ami_levels": ["30", "50", "80"],
        "status": "accepting_applications",
        "application_deadline": (datetime.now() + timedelta(days=30)).isoformat(),
        "estimated_completion": (datetime.now() + timedelta(days=365)).isoformat(),
        "amenities": ["Community Garden", "Playground", "Fitness Center", "Laundry", "Parking"],
        "unit_types": {
            "1BR": {"count": 16, "min_rent": 800, "max_rent": 1200},
            "2BR": {"count": 24, "min_rent": 1000, "max_rent": 1500},
            "3BR": {"count": 8, "min_rent": 1200, "max_rent": 1800}
        }
    },
    {
        "name": "Green Valley Apartments", 
        "description": "Sustainable living community with solar panels, EV charging stations, and water conservation systems.",
        "developer_name": "EcoLiving Developers",
        "location": "Sacramento, CA",
        "address": "5678 Valley View Dr, Sacramento, CA 95814",
        "lat": 38.5816,
        "lng": -121.4944,
        "total_units": 72,
        "affordable_units": 60,
        "ami_levels": ["30", "50", "60", "80"],
        "status": "accepting_applications",
        "application_deadline": (datetime.now() + timedelta(days=45)).isoformat(),
        "estimated_completion": (datetime.now() + timedelta(days=450)).isoformat(),
        "amenities": ["Solar Power", "EV Charging", "Bike Storage", "Community Room", "BBQ Area"],
        "unit_types": {
            "Studio": {"count": 12, "min_rent": 650, "max_rent": 850},
            "1BR": {"count": 30, "min_rent": 850, "max_rent": 1100},
            "2BR": {"count": 30, "min_rent": 1100, "max_rent": 1400}
        }
    },
    {
        "name": "Downtown Senior Housing",
        "description": "Age-restricted community (55+) with accessible design, healthcare services, and social programs.",
        "developer_name": "Senior Living Solutions",
        "location": "San Jose, CA", 
        "address": "999 Main St, San Jose, CA 95113",
        "lat": 37.3382,
        "lng": -121.8863,
        "total_units": 100,
        "affordable_units": 80,
        "ami_levels": ["30", "50", "60"],
        "status": "pre_application",
        "application_deadline": (datetime.now() + timedelta(days=60)).isoformat(),
        "estimated_completion": (datetime.now() + timedelta(days=540)).isoformat(),
        "amenities": ["Healthcare Center", "Library", "Computer Lab", "Meal Service", "Transportation"],
        "unit_types": {
            "Studio": {"count": 40, "min_rent": 600, "max_rent": 800},
            "1BR": {"count": 60, "min_rent": 750, "max_rent": 1000}
        }
    },
    {
        "name": "Families First Village",
        "description": "Family-oriented community with 3-4 bedroom units, after-school programs, and job training center.",
        "developer_name": "Community First Development",
        "location": "Fresno, CA",
        "address": "2468 Family Way, Fresno, CA 93721",
        "lat": 36.7468,
        "lng": -119.7726,
        "total_units": 36,
        "affordable_units": 36,
        "ami_levels": ["30", "50", "60", "80"],
        "status": "accepting_applications",
        "application_deadline": (datetime.now() + timedelta(days=21)).isoformat(),
        "estimated_completion": (datetime.now() + timedelta(days=300)).isoformat(),
        "amenities": ["After-school Program", "Job Center", "Playground", "Basketball Court", "Community Garden"],
        "unit_types": {
            "3BR": {"count": 24, "min_rent": 1300, "max_rent": 1700},
            "4BR": {"count": 12, "min_rent": 1500, "max_rent": 2000}
        }
    },
    {
        "name": "Transit-Oriented Housing",
        "description": "Located next to BART station with bike storage, car-share program, and walkable neighborhood.",
        "developer_name": "Transit Communities LLC",
        "location": "Berkeley, CA",
        "address": "3690 Shattuck Ave, Berkeley, CA 94709",
        "lat": 37.8715,
        "lng": -122.2730,
        "total_units": 120,
        "affordable_units": 96,
        "ami_levels": ["50", "60", "80", "120"],
        "status": "accepting_applications",
        "application_deadline": (datetime.now() + timedelta(days=14)).isoformat(),
        "estimated_completion": (datetime.now() + timedelta(days=180)).isoformat(),
        "amenities": ["BART Access", "Bike Storage", "Car Share", "Retail Space", "Rooftop Deck"],
        "unit_types": {
            "Studio": {"count": 30, "min_rent": 900, "max_rent": 1200},
            "1BR": {"count": 50, "min_rent": 1200, "max_rent": 1600},
            "2BR": {"count": 40, "min_rent": 1600, "max_rent": 2200}
        }
    }
]

# Test applicants  
test_applicants = [
    {
        "first_name": "John",
        "last_name": "Smith",
        "email": "john.smith@email.com",
        "phone": "(555) 123-4567",
        "address": "123 Oak St, Oakland, CA 94601",
        "lat": 37.8049,
        "lng": -122.2708,
        "household_size": 2,
        "annual_income": 45000,
        "employment_status": "employed",
        "credit_score": 680,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "Oakland",
        "max_rent": 1200,
        "min_bedrooms": 1,
        "accessibility_needs": False,
        "has_pets": True,
        "has_voucher": False,
        "additional_notes": "Looking for pet-friendly housing near public transit"
    },
    {
        "first_name": "Maria",
        "last_name": "Rodriguez",
        "email": "maria.rodriguez@email.com",
        "phone": "(555) 234-5678",
        "address": "456 Pine Ave, Sacramento, CA 95814",
        "lat": 38.5810,
        "lng": -121.4938,
        "household_size": 4,
        "annual_income": 55000,
        "employment_status": "employed",
        "credit_score": 720,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "Sacramento",
        "max_rent": 1500,
        "min_bedrooms": 3,
        "accessibility_needs": False,
        "has_pets": False,
        "has_voucher": False,
        "additional_notes": "Family of 4, need good schools nearby"
    },
    {
        "first_name": "Robert",
        "last_name": "Johnson",
        "email": "robert.johnson@email.com",
        "phone": "(555) 345-6789",
        "address": "789 Elm St, San Jose, CA 95113",
        "lat": 37.3387,
        "lng": -121.8853,
        "household_size": 1,
        "annual_income": 28000,
        "employment_status": "retired",
        "credit_score": 650,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "San Jose",
        "max_rent": 800,
        "min_bedrooms": 0,
        "accessibility_needs": True,
        "has_pets": False,
        "has_voucher": True,
        "voucher_type": "Section 8",
        "additional_notes": "Senior citizen, need accessible unit with grab bars"
    },
    {
        "first_name": "Aisha",
        "last_name": "Patel",
        "email": "aisha.patel@email.com",
        "phone": "(555) 456-7890",
        "address": "321 Maple Dr, Berkeley, CA 94709",
        "lat": 37.8720,
        "lng": -122.2725,
        "household_size": 3,
        "annual_income": 72000,
        "employment_status": "employed",
        "credit_score": 750,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "Berkeley",
        "max_rent": 2000,
        "min_bedrooms": 2,
        "accessibility_needs": False,
        "has_pets": True,
        "has_voucher": False,
        "additional_notes": "Tech worker, prefer near BART station"
    },
    {
        "first_name": "David",
        "last_name": "Kim",
        "email": "david.kim@email.com",
        "phone": "(555) 567-8901",
        "address": "654 Cedar Blvd, Fresno, CA 93721",
        "lat": 36.7470,
        "lng": -119.7720,
        "household_size": 5,
        "annual_income": 48000,
        "employment_status": "employed",
        "credit_score": 690,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "Fresno",
        "max_rent": 1700,
        "min_bedrooms": 4,
        "accessibility_needs": False,
        "has_pets": False,
        "has_voucher": False,
        "additional_notes": "Large family, need 4 bedrooms"
    },
    {
        "first_name": "Lisa",
        "last_name": "Chen",
        "email": "lisa.chen@email.com",
        "phone": "(555) 678-9012",
        "address": "987 Spruce St, Oakland, CA 94607",
        "lat": 37.8055,
        "lng": -122.2698,
        "household_size": 2,
        "annual_income": 38000,
        "employment_status": "employed",
        "credit_score": 700,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "Oakland",
        "max_rent": 1100,
        "min_bedrooms": 1,
        "accessibility_needs": False,
        "has_pets": True,
        "has_voucher": False,
        "additional_notes": "Young couple with small dog"
    },
    {
        "first_name": "Carlos",
        "last_name": "Martinez",
        "email": "carlos.martinez@email.com",
        "phone": "(555) 789-0123",
        "address": "741 Willow Way, Sacramento, CA 95820",
        "lat": 38.5820,
        "lng": -121.4920,
        "household_size": 3,
        "annual_income": 42000,
        "employment_status": "employed",
        "credit_score": 660,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "Sacramento",
        "max_rent": 1300,
        "min_bedrooms": 2,
        "accessibility_needs": False,
        "has_pets": False,
        "has_voucher": False,
        "additional_notes": "Family with young child"
    },
    {
        "first_name": "Jennifer",
        "last_name": "Taylor",
        "email": "jennifer.taylor@email.com",
        "phone": "(555) 890-1234",
        "address": "852 Ash Ave, San Jose, CA 95110",
        "lat": 37.3390,
        "lng": -121.8850,
        "household_size": 1,
        "annual_income": 35000,
        "employment_status": "employed",
        "credit_score": 710,
        "has_rental_history": True,
        "has_eviction_history": False,
        "has_criminal_history": False,
        "preferred_location": "San Jose",
        "max_rent": 1000,
        "min_bedrooms": 0,
        "accessibility_needs": False,
        "has_pets": False,
        "has_voucher": False,
        "additional_notes": "Single professional, prefer studio or 1BR"
    }
]

def create_company():
    """Create test company"""
    print("Creating test company...")
    try:
        result = supabase.table('companies').insert(test_company).execute()
        print(f"✓ Created company: {test_company['name']}")
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"✗ Error creating company: {e}")
        # Try to get existing company
        result = supabase.table('companies').select("*").eq('id', test_company['id']).execute()
        if result.data:
            print(f"✓ Company already exists: {test_company['name']}")
            return result.data[0]
        return None

def create_users():
    """Create test users"""
    print("\nCreating test users...")
    created_users = []
    
    for user in test_users:
        try:
            # Create auth user
            auth_response = supabase.auth.admin.create_user({
                "email": user["email"],
                "password": user["password"],
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "company_id": user["company_id"]
                }
            })
            
            if auth_response.user:
                # Create profile
                profile_data = {
                    "id": auth_response.user.id,
                    "full_name": user["full_name"],
                    "role": user["role"],
                    "company_id": user["company_id"],
                    "email": user["email"],
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
                
                supabase.table('profiles').insert(profile_data).execute()
                created_users.append(user)
                print(f"✓ Created user: {user['email']} ({user['role']})")
        except Exception as e:
            print(f"✗ Error creating user {user['email']}: {e}")
    
    return created_users

def create_projects():
    """Create test projects"""
    print("\nCreating test projects...")
    created_projects = []
    
    # Get developer user ID
    dev_user = supabase.table('profiles').select("id").eq('email', 'developer@homeverse.io').execute()
    developer_id = dev_user.data[0]['id'] if dev_user.data else None
    
    for project in test_projects:
        try:
            project_data = {
                **project,
                "company_id": test_company["id"],
                "created_by": developer_id,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = supabase.table('projects').insert(project_data).execute()
            created_projects.append(project)
            print(f"✓ Created project: {project['name']} in {project['location']}")
        except Exception as e:
            print(f"✗ Error creating project {project['name']}: {e}")
    
    return created_projects

def create_applicants():
    """Create test applicants"""
    print("\nCreating test applicants...")
    created_applicants = []
    
    # Get a user ID for created_by
    user = supabase.table('profiles').select("id").limit(1).execute()
    user_id = user.data[0]['id'] if user.data else None
    
    for applicant in test_applicants:
        try:
            # Calculate AMI percentage based on income and household size
            ami_percentage = calculate_ami_percentage(applicant['annual_income'], applicant['household_size'])
            
            applicant_data = {
                **applicant,
                "company_id": test_company["id"],
                "created_by": user_id,
                "status": "active",
                "ami_percentage": ami_percentage,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            result = supabase.table('applicants').insert(applicant_data).execute()
            created_applicants.append(applicant)
            print(f"✓ Created applicant: {applicant['first_name']} {applicant['last_name']} ({ami_percentage}% AMI)")
        except Exception as e:
            print(f"✗ Error creating applicant {applicant['first_name']} {applicant['last_name']}: {e}")
    
    return created_applicants

def calculate_ami_percentage(income, household_size):
    """Simple AMI calculation (simplified for demo)"""
    # Rough AMI estimates for Bay Area
    ami_by_household = {
        1: 82000,
        2: 93000,
        3: 105000,
        4: 117000,
        5: 126000
    }
    
    ami = ami_by_household.get(household_size, 117000)
    return round((income / ami) * 100)

def main():
    """Main function to populate all data"""
    print("🏠 HomeVerse Quick Data Population Script")
    print("=" * 50)
    
    # Create company
    company = create_company()
    if not company:
        print("Failed to create company. Exiting.")
        return
    
    # Create users
    users = create_users()
    print(f"\nCreated {len(users)} users")
    
    # Create projects
    projects = create_projects()
    print(f"\nCreated {len(projects)} projects")
    
    # Create applicants
    applicants = create_applicants()
    print(f"\nCreated {len(applicants)} applicants")
    
    print("\n" + "=" * 50)
    print("✅ Data population complete!")
    print("\n📧 Test Accounts:")
    for user in test_users:
        print(f"   {user['email']} / {user['password']} ({user['role']})")
    
    print("\n🏗️ Projects created:")
    for project in test_projects:
        print(f"   - {project['name']} in {project['location']}")
    
    print("\n👥 Applicants created:")
    print(f"   - {len(test_applicants)} applicants with varying income levels")
    
    print("\n🚀 You can now log in to HomeVerse and see all the data!")

if __name__ == "__main__":
    main()