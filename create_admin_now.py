#!/usr/bin/env python3
"""Create admin user directly - just run this script!"""
import os
import sys

# Try to load from .env first
try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

# Get service key
service_key = os.getenv("SUPABASE_SERVICE_KEY")
if not service_key:
    print("Please enter your Supabase service key")
    print("(You can find it at: https://vzxadsifonqklotzhdpl.supabase.co/project/vzxadsifonqklotzhdpl/settings/api)")
    print("Look for 'service_role' under 'Project API keys'")
    service_key = input("\nService key: ").strip()

# Set up environment
os.environ["SUPABASE_URL"] = "https://vzxadsifonqklotzhdpl.supabase.co"
os.environ["SUPABASE_SERVICE_KEY"] = service_key

try:
    from supabase import create_client
    
    # Initialize Supabase admin client
    supabase = create_client(
        "https://vzxadsifonqklotzhdpl.supabase.co",
        service_key
    )
    
    print("\n🔄 Creating admin user...")
    
    # First ensure demo company exists
    company = supabase.table('companies').select('id').eq('key', 'demo-company-2024').execute()
    if not company.data:
        company = supabase.table('companies').insert({
            "name": "Demo Company",
            "key": "demo-company-2024"
        }).execute()
        company_id = company.data[0]['id']
        print("✅ Created demo company")
    else:
        company_id = company.data[0]['id']
        print("✅ Demo company exists")
    
    # Create admin user
    try:
        user_response = supabase.auth.admin.create_user({
            "email": "admin@test.com",
            "password": "password123",
            "email_confirm": True,
            "user_metadata": {
                "full_name": "Demo Admin",
                "role": "admin"
            }
        })
        
        if user_response.user:
            # Create/update profile
            supabase.table('profiles').upsert({
                "id": user_response.user.id,
                "company_id": company_id,
                "role": "admin",
                "full_name": "Demo Admin"
            }).execute()
            
            print("\n✅ SUCCESS! Admin user created!")
            print("\n📧 Login credentials:")
            print("   Email: admin@test.com")
            print("   Password: password123")
            print("\n🌐 Login at: https://homeverse-frontend.onrender.com")
        else:
            print("❌ Failed to create user")
            
    except Exception as e:
        if "already been registered" in str(e):
            print("\n⚠️  Admin user already exists!")
            print("\n📧 Login credentials:")
            print("   Email: admin@test.com")
            print("   Password: password123")
            print("\n🌐 Login at: https://homeverse-frontend.onrender.com")
            
            # Try to update profile in case it's missing
            try:
                users = supabase.auth.admin.list_users()
                admin_user = next((u for u in users if u.email == "admin@test.com"), None)
                if admin_user:
                    supabase.table('profiles').upsert({
                        "id": admin_user.id,
                        "company_id": company_id,
                        "role": "admin",
                        "full_name": "Demo Admin"
                    }).execute()
                    print("\n✅ Updated admin profile")
            except:
                pass
        else:
            print(f"\n❌ Error: {str(e)}")
            
except ImportError:
    print("\n❌ Supabase module not installed!")
    print("Run: pip install supabase python-dotenv")
    sys.exit(1)
except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    sys.exit(1)