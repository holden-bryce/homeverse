#!/usr/bin/env python3
"""Supabase Admin Agent - Automated user and data management"""
import os
import json
from typing import Optional, Dict, List, Any
from supabase import create_client, Client
from dotenv import load_dotenv
import argparse
import sys

# Load environment variables
load_dotenv()

class SupabaseAdminAgent:
    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "https://vzxadsifonqklotzhdpl.supabase.co")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not self.service_key:
            print("❌ SUPABASE_SERVICE_KEY not found in environment")
            sys.exit(1)
            
        self.client: Client = create_client(self.url, self.service_key)
        print(f"✅ Connected to Supabase at {self.url}")
    
    def create_user(self, email: str, password: str, role: str = "buyer", 
                   full_name: str = None, company_key: str = "demo-company-2024") -> Dict:
        """Create a new user with profile"""
        try:
            # Ensure company exists
            company = self.ensure_company_exists(company_key)
            
            # Create auth user
            user_response = self.client.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": full_name or email.split('@')[0],
                    "role": role
                }
            })
            
            if not user_response.user:
                return {"success": False, "error": "Failed to create user"}
            
            # Create/update profile
            profile_data = {
                "id": user_response.user.id,
                "company_id": company['id'],
                "role": role,
                "full_name": full_name or email.split('@')[0]
            }
            
            profile = self.client.table('profiles').upsert(profile_data).execute()
            
            return {
                "success": True,
                "user_id": user_response.user.id,
                "email": email,
                "role": role,
                "company": company['name']
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def ensure_company_exists(self, company_key: str, name: str = None) -> Dict:
        """Ensure a company exists, create if not"""
        try:
            # Check if exists
            result = self.client.table('companies').select('*').eq('key', company_key).execute()
            
            if result.data:
                return result.data[0]
            
            # Create new company
            company_data = {
                "key": company_key,
                "name": name or f"Company {company_key}",
                "plan": "trial",
                "seats": 10
            }
            
            result = self.client.table('companies').insert(company_data).execute()
            print(f"✅ Created company: {company_data['name']}")
            return result.data[0]
            
        except Exception as e:
            print(f"❌ Error with company: {str(e)}")
            raise
    
    def create_test_users(self) -> List[Dict]:
        """Create all test users"""
        test_users = [
            {"email": "developer@test.com", "password": "password123", "role": "developer", "full_name": "Demo Developer"},
            {"email": "lender@test.com", "password": "password123", "role": "lender", "full_name": "Demo Lender"},
            {"email": "buyer@test.com", "password": "password123", "role": "buyer", "full_name": "Demo Buyer"},
            {"email": "applicant@test.com", "password": "password123", "role": "applicant", "full_name": "Demo Applicant"},
            {"email": "admin@test.com", "password": "password123", "role": "admin", "full_name": "Demo Admin"},
        ]
        
        results = []
        for user in test_users:
            print(f"Creating {user['email']}...")
            result = self.create_user(**user)
            results.append(result)
            if result['success']:
                print(f"✅ Created {user['email']}")
            else:
                print(f"❌ Failed to create {user['email']}: {result.get('error')}")
        
        return results
    
    def create_applicant(self, full_name: str, email: str = None, phone: str = None,
                        income: float = None, household_size: int = None,
                        company_key: str = "demo-company-2024") -> Dict:
        """Create an applicant record"""
        try:
            company = self.ensure_company_exists(company_key)
            
            applicant_data = {
                "company_id": company['id'],
                "full_name": full_name,
                "email": email,
                "phone": phone,
                "income": income,
                "household_size": household_size,
                "status": "active"
            }
            
            result = self.client.table('applicants').insert(applicant_data).execute()
            
            return {
                "success": True,
                "applicant_id": result.data[0]['id'],
                "data": result.data[0]
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_project(self, name: str, description: str = None, location: str = None,
                      total_units: int = None, available_units: int = None,
                      ami_percentage: int = None, company_key: str = "demo-company-2024") -> Dict:
        """Create a project"""
        try:
            company = self.ensure_company_exists(company_key)
            
            project_data = {
                "company_id": company['id'],
                "name": name,
                "description": description,
                "location": location,
                "total_units": total_units,
                "available_units": available_units,
                "ami_percentage": ami_percentage,
                "status": "active"
            }
            
            result = self.client.table('projects').insert(project_data).execute()
            
            return {
                "success": True,
                "project_id": result.data[0]['id'],
                "data": result.data[0]
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_users(self) -> List[Dict]:
        """List all users with their profiles"""
        try:
            result = self.client.table('profiles').select('*, companies(name)').execute()
            return result.data
        except Exception as e:
            print(f"❌ Error listing users: {str(e)}")
            return []
    
    def check_health(self) -> Dict:
        """Check Supabase connection and table status"""
        try:
            # Check tables
            tables = ['companies', 'profiles', 'applicants', 'projects']
            status = {}
            
            for table in tables:
                try:
                    result = self.client.table(table).select('count').limit(1).execute()
                    status[table] = "✅ OK"
                except:
                    status[table] = "❌ Error"
            
            return {
                "connected": True,
                "url": self.url,
                "tables": status
            }
            
        except Exception as e:
            return {
                "connected": False,
                "error": str(e)
            }


def main():
    parser = argparse.ArgumentParser(description='Supabase Admin Agent')
    parser.add_argument('command', choices=['create-test-users', 'create-user', 'list-users', 
                                           'create-applicant', 'create-project', 'health'],
                       help='Command to execute')
    parser.add_argument('--email', help='User email')
    parser.add_argument('--password', help='User password')
    parser.add_argument('--role', default='buyer', help='User role')
    parser.add_argument('--name', help='Full name')
    parser.add_argument('--company', default='demo-company-2024', help='Company key')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    agent = SupabaseAdminAgent()
    
    if args.command == 'health':
        result = agent.check_health()
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print(f"Connected: {result['connected']}")
            print(f"URL: {result.get('url', 'N/A')}")
            if 'tables' in result:
                print("Tables:")
                for table, status in result['tables'].items():
                    print(f"  {table}: {status}")
    
    elif args.command == 'create-test-users':
        results = agent.create_test_users()
        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print(f"\nCreated {sum(1 for r in results if r['success'])} of {len(results)} users")
    
    elif args.command == 'create-user':
        if not args.email or not args.password:
            print("❌ --email and --password required")
            sys.exit(1)
        
        result = agent.create_user(
            email=args.email,
            password=args.password,
            role=args.role,
            full_name=args.name,
            company_key=args.company
        )
        
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            if result['success']:
                print(f"✅ Created user: {result['email']} ({result['role']})")
            else:
                print(f"❌ Failed: {result['error']}")
    
    elif args.command == 'list-users':
        users = agent.list_users()
        if args.json:
            print(json.dumps(users, indent=2))
        else:
            print(f"Found {len(users)} users:")
            for user in users:
                company = user.get('companies', {}).get('name', 'N/A')
                print(f"  - {user.get('full_name', 'N/A')} ({user.get('role', 'N/A')}) - {company}")
    
    elif args.command == 'create-applicant':
        if not args.name:
            print("❌ --name required")
            sys.exit(1)
        
        result = agent.create_applicant(
            full_name=args.name,
            company_key=args.company
        )
        
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            if result['success']:
                print(f"✅ Created applicant: {args.name}")
            else:
                print(f"❌ Failed: {result['error']}")
    
    elif args.command == 'create-project':
        if not args.name:
            print("❌ --name required")
            sys.exit(1)
        
        result = agent.create_project(
            name=args.name,
            company_key=args.company
        )
        
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            if result['success']:
                print(f"✅ Created project: {args.name}")
            else:
                print(f"❌ Failed: {result['error']}")


if __name__ == "__main__":
    main()