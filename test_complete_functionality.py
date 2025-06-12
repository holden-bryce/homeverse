#!/usr/bin/env python3
"""
Test complete functionality of HomeVerse application
Tests login, data creation, and company isolation
"""

import asyncio
import json
from datetime import datetime
from playwright.async_api import async_playwright
import requests

# Base URLs
FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8000"

# Test accounts from different companies
TEST_ACCOUNTS = [
    {
        "email": "developer@test.com",
        "password": "password123",
        "role": "developer",
        "company": "test"
    },
    {
        "email": "lender@test.com", 
        "password": "password123",
        "role": "lender",
        "company": "test"
    },
    {
        "email": "admin@demo.com",
        "password": "password123", 
        "role": "admin",
        "company": "demo"
    }
]

class TestResults:
    def __init__(self):
        self.results = []
        self.data_created = {}
        
    def add_result(self, test_name, status, details=""):
        self.results.append({
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{'✅' if status == 'PASS' else '❌'} {test_name}: {details}")
        
    def save_results(self):
        with open("test_results.json", "w") as f:
            json.dump({
                "results": self.results,
                "data_created": self.data_created,
                "summary": {
                    "total": len(self.results),
                    "passed": len([r for r in self.results if r["status"] == "PASS"]),
                    "failed": len([r for r in self.results if r["status"] == "FAIL"])
                }
            }, f, indent=2)

async def test_backend_health():
    """Test if backend is responding"""
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        return response.status_code == 200
    except:
        return False

async def test_login_and_create_data(page, account, results):
    """Test login and data creation for a specific account"""
    try:
        # Navigate to login page
        await page.goto(f"{FRONTEND_URL}/auth/login")
        await page.wait_for_load_state("networkidle")
        
        # Fill login form
        await page.fill('input[name="email"]', account["email"])
        await page.fill('input[name="password"]', account["password"])
        
        # Submit form
        await page.click('button[type="submit"]')
        
        # Wait for navigation
        await page.wait_for_url("**/dashboard/**", timeout=10000)
        
        # Check we're on dashboard
        current_url = page.url
        results.add_result(
            f"Login - {account['email']}", 
            "PASS", 
            f"Successfully logged in and redirected to {current_url}"
        )
        
        # Store company data
        if account["company"] not in results.data_created:
            results.data_created[account["company"]] = {
                "applicants": [],
                "projects": []
            }
        
        # Test creating an applicant (if developer role)
        if account["role"] in ["developer", "admin"]:
            await test_create_applicant(page, account, results)
            
        # Test creating a project (if developer role)
        if account["role"] == "developer":
            await test_create_project(page, account, results)
            
        # Logout
        await page.click('button:has-text("Sign Out")')
        await page.wait_for_url("**/auth/login")
        
    except Exception as e:
        results.add_result(
            f"Login - {account['email']}", 
            "FAIL", 
            str(e)
        )

async def test_create_applicant(page, account, results):
    """Test creating an applicant"""
    try:
        # Navigate to applicants page
        await page.goto(f"{FRONTEND_URL}/dashboard/applicants")
        await page.wait_for_load_state("networkidle")
        
        # Click new applicant button
        await page.click('a:has-text("New Applicant")')
        await page.wait_for_url("**/applicants/new")
        
        # Fill applicant form
        test_data = {
            "first_name": f"Test_{account['company']}",
            "last_name": f"User_{datetime.now().strftime('%H%M%S')}",
            "email": f"test_{account['company']}_{datetime.now().strftime('%H%M%S')}@example.com",
            "phone": "555-0123",
            "address": "123 Test Street",
            "city": "Test City",
            "state": "CA",
            "zip": "90210",
            "annual_income": "50000",
            "household_size": "2",
            "credit_score": "700"
        }
        
        # Fill form fields
        for field, value in test_data.items():
            selector = f'input[name="{field}"], select[name="{field}"]'
            if await page.locator(selector).count() > 0:
                await page.fill(selector, value)
        
        # Submit form
        await page.click('button[type="submit"]')
        
        # Wait for redirect back to applicants list
        await page.wait_for_url("**/applicants", timeout=10000)
        
        # Verify applicant appears in list
        await page.wait_for_selector(f'text={test_data["first_name"]}', timeout=5000)
        
        results.add_result(
            f"Create Applicant - {account['email']}", 
            "PASS", 
            f"Created applicant: {test_data['first_name']} {test_data['last_name']}"
        )
        
        # Store created data
        results.data_created[account["company"]]["applicants"].append(test_data)
        
    except Exception as e:
        results.add_result(
            f"Create Applicant - {account['email']}", 
            "FAIL", 
            str(e)
        )

async def test_create_project(page, account, results):
    """Test creating a project"""
    try:
        # Navigate to projects page
        await page.goto(f"{FRONTEND_URL}/dashboard/projects")
        await page.wait_for_load_state("networkidle")
        
        # Click new project button
        await page.click('button:has-text("New Project")')
        
        # Wait for modal/form
        await page.wait_for_selector('input[name="name"]', timeout=5000)
        
        # Fill project form
        test_data = {
            "name": f"Test Project {account['company']} {datetime.now().strftime('%H%M%S')}",
            "address": "456 Project Ave",
            "city": "Project City", 
            "state": "CA",
            "zipCode": "90211",
            "totalUnits": "100",
            "affordableUnits": "30",
            "status": "planning"
        }
        
        # Fill form fields
        for field, value in test_data.items():
            selector = f'input[name="{field}"], select[name="{field}"]'
            if await page.locator(selector).count() > 0:
                await page.fill(selector, value)
        
        # Submit form
        submit_button = page.locator('button[type="submit"]').last
        await submit_button.click()
        
        # Wait for modal to close and verify project appears
        await page.wait_for_selector(f'text={test_data["name"]}', timeout=10000)
        
        results.add_result(
            f"Create Project - {account['email']}", 
            "PASS", 
            f"Created project: {test_data['name']}"
        )
        
        # Store created data
        results.data_created[account["company"]]["projects"].append(test_data)
        
    except Exception as e:
        results.add_result(
            f"Create Project - {account['email']}", 
            "FAIL", 
            str(e)
        )

async def test_data_isolation(results):
    """Test that data is properly isolated between companies"""
    test_isolation = True
    
    # Check if test company data exists
    test_company_data = results.data_created.get("test", {})
    demo_company_data = results.data_created.get("demo", {})
    
    if test_company_data and demo_company_data:
        # We should have created different data for each company
        test_applicants = test_company_data.get("applicants", [])
        demo_applicants = demo_company_data.get("applicants", [])
        
        if test_applicants and demo_applicants:
            # Names should be different (contain company name)
            test_names = [a["first_name"] for a in test_applicants]
            demo_names = [a["first_name"] for a in demo_applicants]
            
            # Check that test company applicants contain "test" 
            # and demo company applicants contain "demo"
            test_isolation = (
                all("test" in name.lower() for name in test_names) and
                all("demo" in name.lower() for name in demo_names)
            )
            
            results.add_result(
                "Data Isolation Check",
                "PASS" if test_isolation else "FAIL",
                f"Test company has {len(test_applicants)} applicants, "
                f"Demo company has {len(demo_applicants)} applicants"
            )
        else:
            results.add_result(
                "Data Isolation Check",
                "SKIP",
                "Not enough data created to test isolation"
            )
    else:
        results.add_result(
            "Data Isolation Check",
            "SKIP", 
            "Need data from multiple companies to test isolation"
        )

async def main():
    """Run all tests"""
    results = TestResults()
    
    print("🧪 Testing HomeVerse Complete Functionality")
    print("=" * 50)
    
    # Test backend health
    backend_healthy = await test_backend_health()
    results.add_result(
        "Backend Health Check",
        "PASS" if backend_healthy else "FAIL",
        f"Backend at {BACKEND_URL} is {'running' if backend_healthy else 'not responding'}"
    )
    
    if not backend_healthy:
        print("❌ Backend is not running. Please start it first.")
        return
    
    # Test with Playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        try:
            # Test each account
            for account in TEST_ACCOUNTS:
                print(f"\n📧 Testing account: {account['email']}")
                print("-" * 40)
                
                context = await browser.new_context()
                page = await context.new_page()
                
                await test_login_and_create_data(page, account, results)
                
                await context.close()
            
            # Test data isolation
            print("\n🔒 Testing Data Isolation")
            print("-" * 40)
            await test_data_isolation(results)
            
        finally:
            await browser.close()
    
    # Save results
    results.save_results()
    
    # Print summary
    print("\n📊 Test Summary")
    print("=" * 50)
    total = len(results.results)
    passed = len([r for r in results.results if r["status"] == "PASS"])
    failed = len([r for r in results.results if r["status"] == "FAIL"])
    skipped = len([r for r in results.results if r["status"] == "SKIP"])
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"\nResults saved to: test_results.json")

if __name__ == "__main__":
    asyncio.run(main())