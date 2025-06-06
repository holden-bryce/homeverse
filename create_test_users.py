#!/usr/bin/env python3
"""Script to create test users for all portal roles"""
import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.db.database import get_session
from app.db.crud import create_user, get_user_by_email
from app.db.tenant_context import ensure_company_exists

async def create_test_users():
    """Create test users for all portal types"""
    async for session in get_session():
        try:
            # Ensure test company exists
            company = await ensure_company_exists(session, 'test-company')
            print(f'Using company: {company.name} (key: {company.key})')
            
            # Test users for different roles
            test_users = [
                {'email': 'developer@test.com', 'password': 'password123', 'role': 'developer', 'company_key': 'test-company'},
                {'email': 'lender@test.com', 'password': 'password123', 'role': 'lender', 'company_key': 'test-company'},
                {'email': 'buyer@test.com', 'password': 'password123', 'role': 'buyer', 'company_key': 'test-company'},
                {'email': 'admin@test.com', 'password': 'password123', 'role': 'admin', 'company_key': 'test-company'},
                {'email': 'applicant@test.com', 'password': 'password123', 'role': 'applicant', 'company_key': 'test-company'},
            ]
            
            created_users = []
            for user_data in test_users:
                # Check if user already exists
                existing = await get_user_by_email(session, user_data['email'])
                if existing:
                    print(f'User {user_data["email"]} already exists with role: {existing.role}')
                    created_users.append({
                        'email': user_data['email'],
                        'role': existing.role,
                        'status': 'existing'
                    })
                else:
                    # Create new user
                    user = await create_user(
                        session=session,
                        email=user_data['email'],
                        password=user_data['password'],
                        company_key=user_data['company_key'],
                        role=user_data['role']
                    )
                    print(f'Created user: {user.email} with role: {user.role}')
                    created_users.append({
                        'email': user.email,
                        'role': user.role,
                        'status': 'created'
                    })
            
            print('\n=== TEST LOGIN CREDENTIALS ===')
            for user in created_users:
                print(f'Email: {user["email"]}')
                print(f'Password: password123')
                print(f'Role: {user["role"]}')
                print(f'Status: {user["status"]}')
                print('---')
            
            print('\n=== PORTAL ACCESS ===')
            print('Developer Portal: http://localhost:3000/dashboard/developers')
            print('Lender Portal: http://localhost:3000/dashboard/lenders')
            print('Buyer Portal: http://localhost:3000/dashboard/buyers')
            print('Applicant Portal: http://localhost:3000/dashboard/applicants')
            print('Admin Portal: http://localhost:3000/dashboard (admin role)')
            
            break
        except Exception as e:
            print(f'Error: {e}')
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_test_users())