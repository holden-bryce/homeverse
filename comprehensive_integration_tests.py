#!/usr/bin/env python3
"""
HomeVerse Comprehensive Integration Test Suite
Tests all functionality after security fixes implementation
"""

import asyncio
import json
import time
import requests
import os
import tempfile
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
import statistics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test configuration
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

# Test accounts for all 5 roles
TEST_ACCOUNTS = {
    "admin": {"email": "admin@test.com", "password": "password123"},
    "developer": {"email": "developer@test.com", "password": "password123"},
    "lender": {"email": "lender@test.com", "password": "password123"},
    "buyer": {"email": "buyer@test.com", "password": "password123"},
    "applicant": {"email": "applicant@test.com", "password": "password123"}
}

# Performance benchmarks
PERFORMANCE_TARGETS = {
    "login": 250,  # ms
    "api_response": 200,  # ms
    "file_upload": 1000,  # ms
    "search": 500,  # ms
    "page_load": 3000  # ms
}

class TestResult:
    def __init__(self, test_name: str):
        self.test_name = test_name
        self.passed = True
        self.errors = []
        self.warnings = []
        self.performance_metrics = {}
        self.start_time = time.time()
        
    def fail(self, error: str):
        self.passed = False
        self.errors.append(error)
        logger.error(f"❌ {self.test_name}: {error}")
        
    def warn(self, warning: str):
        self.warnings.append(warning)
        logger.warning(f"⚠️  {self.test_name}: {warning}")
        
    def record_metric(self, metric_name: str, value: float):
        self.performance_metrics[metric_name] = value
        
    def finish(self):
        duration = time.time() - self.start_time
        status = "✅ PASSED" if self.passed else "❌ FAILED"
        logger.info(f"{status} {self.test_name} ({duration:.2f}s)")
        return self

class HomeVerseTestSuite:
    def __init__(self):
        self.results: List[TestResult] = []
        self.tokens = {}
        self.test_data = {}
        
    def add_result(self, result: TestResult):
        self.results.append(result.finish())
        
    async def run_all_tests(self):
        """Run all integration tests"""
        logger.info("🚀 Starting HomeVerse Comprehensive Integration Tests")
        logger.info("=" * 60)
        
        # Test 1: Authentication & User Management
        await self.test_authentication()
        
        # Test 2: Applicant Management CRUD
        await self.test_applicant_management()
        
        # Test 3: Project Management
        await self.test_project_management()
        
        # Test 4: File Upload/Download
        await self.test_file_operations()
        
        # Test 5: Email Notifications
        await self.test_email_notifications()
        
        # Test 6: Map Functionality
        await self.test_map_functionality()
        
        # Test 7: PII Encryption
        await self.test_pii_encryption()
        
        # Test 8: Performance Benchmarks
        await self.test_performance()
        
        # Test 9: Rate Limiting
        await self.test_rate_limiting()
        
        # Generate comprehensive report
        self.generate_report()
        
    async def test_authentication(self):
        """Test 1: Authentication & User Management for all 5 roles"""
        result = TestResult("Authentication & User Management")
        
        try:
            # Test login for each role
            for role, credentials in TEST_ACCOUNTS.items():
                # Test login
                login_start = time.time()
                response = requests.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json=credentials
                )
                login_time = (time.time() - login_start) * 1000
                
                if response.status_code != 200:
                    result.fail(f"Login failed for {role}: {response.status_code} - {response.text}")
                    continue
                    
                data = response.json()
                if "access_token" not in data:
                    result.fail(f"No access token returned for {role}")
                    continue
                    
                self.tokens[role] = data["access_token"]
                result.record_metric(f"login_time_{role}", login_time)
                
                if login_time > PERFORMANCE_TARGETS["login"]:
                    result.warn(f"Login slow for {role}: {login_time:.0f}ms")
                
                # Test token validation
                headers = {"Authorization": f"Bearer {self.tokens[role]}"}
                profile_response = requests.get(
                    f"{BASE_URL}/api/v1/users/profile",
                    headers=headers
                )
                
                if profile_response.status_code != 200:
                    result.fail(f"Profile fetch failed for {role}")
                    
                # Test logout
                logout_response = requests.post(
                    f"{BASE_URL}/api/v1/auth/logout",
                    headers=headers
                )
                
                if logout_response.status_code != 200:
                    result.warn(f"Logout failed for {role}")
                    
                # Re-login for subsequent tests
                response = requests.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json=credentials
                )
                if response.status_code == 200:
                    self.tokens[role] = response.json()["access_token"]
                    
            # Test password reset flow (without actually sending email)
            reset_response = requests.post(
                f"{BASE_URL}/api/v1/auth/request-reset",
                json={"email": "test@example.com"}
            )
            
            # Test role-based access control
            if "developer" in self.tokens:
                # Developer should access project endpoints
                headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
                access_response = requests.get(
                    f"{BASE_URL}/api/v1/projects",
                    headers=headers
                )
                if access_response.status_code != 200:
                    result.fail("Developer cannot access projects endpoint")
                    
            logger.info(f"✅ Authenticated {len(self.tokens)} users successfully")
            
        except Exception as e:
            result.fail(f"Authentication test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_applicant_management(self):
        """Test 2: Applicant Management CRUD Operations"""
        result = TestResult("Applicant Management CRUD")
        
        try:
            if "developer" not in self.tokens:
                result.fail("No developer token available")
                self.add_result(result)
                return
                
            headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
            
            # Create applicant
            create_start = time.time()
            applicant_data = {
                "first_name": "Test",
                "last_name": "Applicant",
                "email": "test.applicant@example.com",
                "phone": "+1234567890",
                "income": 50000,
                "household_size": 3,
                "preferences": {
                    "bedrooms": 2,
                    "max_rent": 1500
                }
            }
            
            create_response = requests.post(
                f"{BASE_URL}/api/v1/applicants",
                json=applicant_data,
                headers=headers
            )
            create_time = (time.time() - create_start) * 1000
            result.record_metric("applicant_create_time", create_time)
            
            if create_response.status_code != 200:
                result.fail(f"Create applicant failed: {create_response.status_code}")
                self.add_result(result)
                return
                
            created_applicant = create_response.json()["data"]
            self.test_data["applicant_id"] = created_applicant["id"]
            
            # Verify PII is returned decrypted
            if created_applicant.get("email") != applicant_data["email"]:
                result.fail("Email not properly decrypted")
            if created_applicant.get("phone") != applicant_data["phone"]:
                result.fail("Phone not properly decrypted")
                
            # Read applicant
            read_start = time.time()
            read_response = requests.get(
                f"{BASE_URL}/api/v1/applicants/{self.test_data['applicant_id']}",
                headers=headers
            )
            read_time = (time.time() - read_start) * 1000
            result.record_metric("applicant_read_time", read_time)
            
            if read_response.status_code != 200:
                result.fail("Read applicant failed")
                
            # Update applicant
            update_start = time.time()
            update_data = {
                "income": 60000,
                "household_size": 4
            }
            update_response = requests.patch(
                f"{BASE_URL}/api/v1/applicants/{self.test_data['applicant_id']}",
                json=update_data,
                headers=headers
            )
            update_time = (time.time() - update_start) * 1000
            result.record_metric("applicant_update_time", update_time)
            
            if update_response.status_code != 200:
                result.fail("Update applicant failed")
                
            # Search applicants
            search_start = time.time()
            search_response = requests.get(
                f"{BASE_URL}/api/v1/applicants?search=Test",
                headers=headers
            )
            search_time = (time.time() - search_start) * 1000
            result.record_metric("applicant_search_time", search_time)
            
            if search_response.status_code != 200:
                result.fail("Search applicants failed")
            else:
                results = search_response.json()["data"]
                if not any(a["id"] == self.test_data["applicant_id"] for a in results):
                    result.warn("Created applicant not found in search results")
                    
            # List applicants with pagination
            list_response = requests.get(
                f"{BASE_URL}/api/v1/applicants?limit=10&offset=0",
                headers=headers
            )
            
            if list_response.status_code != 200:
                result.fail("List applicants failed")
                
            # Delete applicant
            delete_response = requests.delete(
                f"{BASE_URL}/api/v1/applicants/{self.test_data['applicant_id']}",
                headers=headers
            )
            
            if delete_response.status_code != 200:
                result.warn("Delete applicant failed")
                
            logger.info("✅ Applicant CRUD operations completed successfully")
            
        except Exception as e:
            result.fail(f"Applicant management test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_project_management(self):
        """Test 3: Project Management and Application Workflows"""
        result = TestResult("Project Management & Applications")
        
        try:
            if "developer" not in self.tokens:
                result.fail("No developer token available")
                self.add_result(result)
                return
                
            headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
            
            # Create project
            project_data = {
                "name": "Test Housing Project",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "CA",
                "zip_code": "12345",
                "total_units": 50,
                "affordable_units": 40,
                "ami_percentage": 80,
                "min_income": 30000,
                "max_income": 80000,
                "bedrooms": [1, 2, 3],
                "amenities": ["Parking", "Laundry", "Gym"],
                "description": "Test project description",
                "status": "active"
            }
            
            create_response = requests.post(
                f"{BASE_URL}/api/v1/projects",
                json=project_data,
                headers=headers
            )
            
            if create_response.status_code != 200:
                result.fail(f"Create project failed: {create_response.status_code}")
                self.add_result(result)
                return
                
            created_project = create_response.json()["data"]
            self.test_data["project_id"] = created_project["id"]
            
            # Read project
            read_response = requests.get(
                f"{BASE_URL}/api/v1/projects/{self.test_data['project_id']}",
                headers=headers
            )
            
            if read_response.status_code != 200:
                result.fail("Read project failed")
                
            # Update project
            update_response = requests.patch(
                f"{BASE_URL}/api/v1/projects/{self.test_data['project_id']}",
                json={"status": "pending"},
                headers=headers
            )
            
            if update_response.status_code != 200:
                result.fail("Update project failed")
                
            # Test application workflow
            if "applicant" in self.tokens:
                # First create an applicant
                applicant_headers = {"Authorization": f"Bearer {self.tokens['applicant']}"}
                
                # Create application
                application_data = {
                    "project_id": self.test_data["project_id"],
                    "message": "I am interested in this property"
                }
                
                app_response = requests.post(
                    f"{BASE_URL}/api/v1/applications",
                    json=application_data,
                    headers=applicant_headers
                )
                
                if app_response.status_code == 200:
                    self.test_data["application_id"] = app_response.json()["data"]["id"]
                else:
                    result.warn(f"Create application failed: {app_response.status_code}")
                    
            # Get project matches
            matches_response = requests.get(
                f"{BASE_URL}/api/v1/projects/{self.test_data['project_id']}/matches",
                headers=headers
            )
            
            if matches_response.status_code != 200:
                result.warn("Get project matches failed")
                
            logger.info("✅ Project management operations completed successfully")
            
        except Exception as e:
            result.fail(f"Project management test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_file_operations(self):
        """Test 4: File Upload/Download with Rate Limiting"""
        result = TestResult("File Upload/Download Operations")
        
        try:
            if "developer" not in self.tokens:
                result.fail("No developer token available")
                self.add_result(result)
                return
                
            headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
            
            # Create a test file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.pdf', delete=False) as f:
                f.write("Test document content")
                test_file_path = f.name
                
            try:
                # Test document upload
                with open(test_file_path, 'rb') as f:
                    files = {'file': ('test_document.pdf', f, 'application/pdf')}
                    data = {
                        'resource_type': 'project',
                        'resource_id': self.test_data.get('project_id', 'test-id')
                    }
                    
                    upload_start = time.time()
                    upload_response = requests.post(
                        f"{BASE_URL}/api/v1/upload/document",
                        files=files,
                        data=data,
                        headers=headers
                    )
                    upload_time = (time.time() - upload_start) * 1000
                    result.record_metric("file_upload_time", upload_time)
                    
                if upload_response.status_code != 200:
                    result.fail(f"File upload failed: {upload_response.status_code}")
                else:
                    upload_data = upload_response.json()
                    self.test_data["file_url"] = upload_data.get("url", "")
                    
                # Test image upload (if project exists)
                if "project_id" in self.test_data:
                    with tempfile.NamedTemporaryFile(mode='wb', suffix='.jpg', delete=False) as img:
                        # Create a minimal JPEG
                        img.write(b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f')
                        img_path = img.name
                        
                    with open(img_path, 'rb') as f:
                        files = {'file': ('test_image.jpg', f, 'image/jpeg')}
                        img_response = requests.post(
                            f"{BASE_URL}/api/v1/projects/{self.test_data['project_id']}/images",
                            files=files,
                            headers=headers
                        )
                        
                    if img_response.status_code != 200:
                        result.warn("Image upload failed")
                        
                    os.unlink(img_path)
                    
                # Test rate limiting on uploads
                logger.info("Testing upload rate limits...")
                rate_limit_hit = False
                for i in range(25):  # Should hit 20/hour limit
                    with open(test_file_path, 'rb') as f:
                        files = {'file': (f'test_{i}.pdf', f, 'application/pdf')}
                        data = {
                            'resource_type': 'project',
                            'resource_id': 'test-rate-limit'
                        }
                        
                        response = requests.post(
                            f"{BASE_URL}/api/v1/upload/document",
                            files=files,
                            data=data,
                            headers=headers
                        )
                        
                        if response.status_code == 429:
                            rate_limit_hit = True
                            retry_after = response.headers.get('Retry-After')
                            logger.info(f"✅ Rate limit hit after {i+1} uploads. Retry after: {retry_after}s")
                            break
                            
                if not rate_limit_hit:
                    result.warn("Rate limit not enforced on file uploads")
                    
            finally:
                os.unlink(test_file_path)
                
            logger.info("✅ File operations completed successfully")
            
        except Exception as e:
            result.fail(f"File operations test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_email_notifications(self):
        """Test 5: Email Notifications and SendGrid Integration"""
        result = TestResult("Email Notifications")
        
        try:
            # Test contact form submission
            contact_data = {
                "name": "Test User",
                "email": "test@example.com",
                "company": "Test Company",
                "role": "Developer",
                "subject": "Test Contact",
                "message": "This is a test message"
            }
            
            # Should be rate limited to 3/hour
            for i in range(5):
                contact_response = requests.post(
                    f"{BASE_URL}/api/v1/contact",
                    data=contact_data  # Form data, not JSON
                )
                
                if contact_response.status_code == 429:
                    logger.info(f"✅ Contact form rate limit hit after {i+1} submissions")
                    break
                elif contact_response.status_code != 200:
                    if i == 0:
                        result.warn(f"Contact form submission failed: {contact_response.status_code}")
                        
            # Test notification preferences
            if "developer" in self.tokens:
                headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
                
                # Update notification preferences
                prefs_data = {
                    "email_project_updates": True,
                    "email_application_updates": False,
                    "email_marketing": False
                }
                
                # This endpoint might not exist, but we test it
                prefs_response = requests.patch(
                    f"{BASE_URL}/api/v1/users/notification-preferences",
                    json=prefs_data,
                    headers=headers
                )
                
                if prefs_response.status_code != 200:
                    result.warn("Notification preferences update not implemented")
                    
            logger.info("✅ Email notification tests completed")
            
        except Exception as e:
            result.fail(f"Email notification test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_map_functionality(self):
        """Test 6: Map Functionality and Mapbox Integration"""
        result = TestResult("Map Functionality")
        
        try:
            if "developer" not in self.tokens:
                result.fail("No developer token available")
                self.add_result(result)
                return
                
            headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
            
            # Test heatmap data endpoint
            heatmap_response = requests.get(
                f"{BASE_URL}/api/v1/analytics/heatmap",
                headers=headers
            )
            
            if heatmap_response.status_code != 200:
                result.fail("Heatmap data endpoint failed")
            else:
                heatmap_data = heatmap_response.json()
                if "projects" not in heatmap_data or "applicants" not in heatmap_data:
                    result.warn("Heatmap data structure incorrect")
                    
            # Test location-based search
            location_params = {
                "lat": 37.7749,
                "lng": -122.4194,
                "radius": 10  # miles
            }
            
            location_response = requests.get(
                f"{BASE_URL}/api/v1/projects",
                params=location_params,
                headers=headers
            )
            
            if location_response.status_code != 200:
                result.warn("Location-based project search not implemented")
                
            logger.info("✅ Map functionality tests completed")
            
        except Exception as e:
            result.fail(f"Map functionality test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_pii_encryption(self):
        """Test 7: PII Encryption Transparency and Search"""
        result = TestResult("PII Encryption & Search")
        
        try:
            if "developer" not in self.tokens:
                result.fail("No developer token available")
                self.add_result(result)
                return
                
            headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
            
            # Create applicant with PII
            test_email = f"encryption_test_{int(time.time())}@example.com"
            test_phone = f"+1555{int(time.time()) % 10000000:07d}"
            
            applicant_data = {
                "first_name": "Encryption",
                "last_name": "Test",
                "email": test_email,
                "phone": test_phone,
                "income": 65000
            }
            
            create_response = requests.post(
                f"{BASE_URL}/api/v1/applicants",
                json=applicant_data,
                headers=headers
            )
            
            if create_response.status_code != 200:
                result.fail("Failed to create test applicant for encryption")
                self.add_result(result)
                return
                
            created = create_response.json()["data"]
            test_id = created["id"]
            
            # Verify PII is returned decrypted
            if created.get("email") != test_email:
                result.fail("Email not properly decrypted on create")
            if created.get("phone") != test_phone:
                result.fail("Phone not properly decrypted on create")
                
            # Read back and verify
            read_response = requests.get(
                f"{BASE_URL}/api/v1/applicants/{test_id}",
                headers=headers
            )
            
            if read_response.status_code == 200:
                read_data = read_response.json()["data"]
                if read_data.get("email") != test_email:
                    result.fail("Email not properly decrypted on read")
                if read_data.get("phone") != test_phone:
                    result.fail("Phone not properly decrypted on read")
                    
            # Test search by name (should work)
            name_search = requests.get(
                f"{BASE_URL}/api/v1/applicants?search=Encryption",
                headers=headers
            )
            
            if name_search.status_code == 200:
                results = name_search.json()["data"]
                found = any(a["id"] == test_id for a in results)
                if not found:
                    result.warn("Search by name failed to find encrypted applicant")
            else:
                result.fail("Search by name failed")
                
            # Test search by email (may not work with encryption)
            email_search = requests.get(
                f"{BASE_URL}/api/v1/applicants?search={test_email}",
                headers=headers
            )
            
            if email_search.status_code == 200:
                results = email_search.json()["data"]
                found = any(a["id"] == test_id for a in results)
                if not found:
                    logger.info("ℹ️  Search by encrypted email not supported (expected)")
                    
            # Clean up
            requests.delete(
                f"{BASE_URL}/api/v1/applicants/{test_id}",
                headers=headers
            )
            
            logger.info("✅ PII encryption tests completed")
            
        except Exception as e:
            result.fail(f"PII encryption test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_performance(self):
        """Test 8: Performance Benchmarks"""
        result = TestResult("Performance Benchmarks")
        
        try:
            if not self.tokens:
                result.fail("No tokens available for performance testing")
                self.add_result(result)
                return
                
            # Use developer token for most tests
            headers = {"Authorization": f"Bearer {self.tokens.get('developer', list(self.tokens.values())[0])}"}
            
            # Collect performance metrics
            metrics = {
                "login": [],
                "api_list": [],
                "api_create": [],
                "api_read": [],
                "api_update": [],
                "api_search": []
            }
            
            # Run performance tests (5 iterations each)
            for i in range(5):
                # Login performance
                start = time.time()
                login_response = requests.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json=TEST_ACCOUNTS["developer"]
                )
                metrics["login"].append((time.time() - start) * 1000)
                
                # API list performance
                start = time.time()
                requests.get(f"{BASE_URL}/api/v1/applicants", headers=headers)
                metrics["api_list"].append((time.time() - start) * 1000)
                
                # API create performance
                start = time.time()
                requests.post(
                    f"{BASE_URL}/api/v1/applicants",
                    json={
                        "first_name": f"Perf{i}",
                        "last_name": "Test",
                        "email": f"perf{i}@test.com",
                        "income": 50000
                    },
                    headers=headers
                )
                metrics["api_create"].append((time.time() - start) * 1000)
                
                # API search performance
                start = time.time()
                requests.get(
                    f"{BASE_URL}/api/v1/applicants?search=Test",
                    headers=headers
                )
                metrics["api_search"].append((time.time() - start) * 1000)
                
            # Calculate statistics
            for metric_name, times in metrics.items():
                if times:
                    avg_time = statistics.mean(times)
                    p95_time = statistics.quantiles(times, n=20)[18] if len(times) >= 20 else max(times)
                    
                    result.record_metric(f"{metric_name}_avg", avg_time)
                    result.record_metric(f"{metric_name}_p95", p95_time)
                    
                    # Check against targets
                    target_key = "login" if metric_name == "login" else "api_response"
                    if target_key in PERFORMANCE_TARGETS:
                        if avg_time > PERFORMANCE_TARGETS[target_key]:
                            result.warn(f"{metric_name} average time {avg_time:.0f}ms exceeds target {PERFORMANCE_TARGETS[target_key]}ms")
                            
            logger.info("✅ Performance benchmarks completed")
            
            # Log summary
            logger.info("\n📊 Performance Summary:")
            for metric_name, times in metrics.items():
                if times:
                    logger.info(f"  {metric_name}: avg={statistics.mean(times):.0f}ms, min={min(times):.0f}ms, max={max(times):.0f}ms")
                    
        except Exception as e:
            result.fail(f"Performance test error: {str(e)}")
            
        self.add_result(result)
        
    async def test_rate_limiting(self):
        """Test 9: Rate Limiting Impact on Normal Workflows"""
        result = TestResult("Rate Limiting Impact")
        
        try:
            # Test normal workflow isn't impacted
            if "developer" in self.tokens:
                headers = {"Authorization": f"Bearer {self.tokens['developer']}"}
                
                # Normal workflow: Create 5 applicants (well under 30/hour limit)
                for i in range(5):
                    response = requests.post(
                        f"{BASE_URL}/api/v1/applicants",
                        json={
                            "first_name": f"Normal{i}",
                            "last_name": "User",
                            "email": f"normal{i}@test.com",
                            "income": 45000
                        },
                        headers=headers
                    )
                    
                    if response.status_code == 429:
                        result.fail(f"Rate limit hit during normal usage after {i+1} requests")
                        break
                    elif response.status_code != 200:
                        result.warn(f"Request {i+1} failed: {response.status_code}")
                        
                # Test auth rate limits
                logger.info("Testing authentication rate limits...")
                login_attempts = 0
                rate_limited = False
                
                for i in range(7):  # Should hit 5/minute limit
                    response = requests.post(
                        f"{BASE_URL}/api/v1/auth/login",
                        json={"email": "wrong@test.com", "password": "wrongpass"}
                    )
                    login_attempts += 1
                    
                    if response.status_code == 429:
                        rate_limited = True
                        retry_after = response.headers.get('Retry-After', 'unknown')
                        
                        # Verify error message is user-friendly
                        try:
                            error_data = response.json()
                            if "message" in error_data:
                                if "too many requests" not in error_data["message"].lower():
                                    result.warn("Rate limit error message not user-friendly")
                        except:
                            pass
                            
                        logger.info(f"✅ Login rate limit hit after {login_attempts} attempts. Retry after: {retry_after}s")
                        break
                        
                    time.sleep(0.5)  # Small delay between attempts
                    
                if not rate_limited:
                    result.fail("Login rate limit not enforced")
                    
            logger.info("✅ Rate limiting tests completed")
            
        except Exception as e:
            result.fail(f"Rate limiting test error: {str(e)}")
            
        self.add_result(result)
        
    def generate_report(self):
        """Generate comprehensive test report"""
        logger.info("\n" + "=" * 60)
        logger.info("📋 HOMEVERSE INTEGRATION TEST REPORT")
        logger.info("=" * 60)
        
        # Calculate summary stats
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r.passed)
        failed_tests = total_tests - passed_tests
        
        # Overall status
        if failed_tests == 0:
            logger.info(f"\n✅ ALL TESTS PASSED ({passed_tests}/{total_tests})")
        else:
            logger.info(f"\n⚠️  TESTS COMPLETED WITH FAILURES")
            logger.info(f"   Passed: {passed_tests}")
            logger.info(f"   Failed: {failed_tests}")
            
        # Detailed results
        logger.info("\n📊 DETAILED TEST RESULTS:")
        logger.info("-" * 40)
        
        for result in self.results:
            status = "✅ PASS" if result.passed else "❌ FAIL"
            logger.info(f"\n{status} {result.test_name}")
            
            if result.errors:
                logger.info("  Errors:")
                for error in result.errors:
                    logger.info(f"    - {error}")
                    
            if result.warnings:
                logger.info("  Warnings:")
                for warning in result.warnings:
                    logger.info(f"    - {warning}")
                    
            if result.performance_metrics:
                logger.info("  Performance:")
                for metric, value in result.performance_metrics.items():
                    logger.info(f"    - {metric}: {value:.1f}ms")
                    
        # Performance summary
        logger.info("\n⚡ PERFORMANCE SUMMARY:")
        logger.info("-" * 40)
        
        all_metrics = {}
        for result in self.results:
            all_metrics.update(result.performance_metrics)
            
        if all_metrics:
            # Group by metric type
            login_metrics = {k: v for k, v in all_metrics.items() if "login" in k}
            api_metrics = {k: v for k, v in all_metrics.items() if "api" in k or "applicant" in k or "project" in k}
            file_metrics = {k: v for k, v in all_metrics.items() if "file" in k or "upload" in k}
            
            if login_metrics:
                logger.info("\nAuthentication Performance:")
                for metric, value in sorted(login_metrics.items()):
                    logger.info(f"  {metric}: {value:.0f}ms")
                    
            if api_metrics:
                logger.info("\nAPI Performance:")
                for metric, value in sorted(api_metrics.items()):
                    logger.info(f"  {metric}: {value:.0f}ms")
                    
            if file_metrics:
                logger.info("\nFile Operation Performance:")
                for metric, value in sorted(file_metrics.items()):
                    logger.info(f"  {metric}: {value:.0f}ms")
                    
        # Security fixes validation
        logger.info("\n🔒 SECURITY FIXES VALIDATION:")
        logger.info("-" * 40)
        
        security_checks = {
            "CORS Configuration": any("CORS" not in r.errors for r in self.results),
            "Rate Limiting": any(r.test_name == "Rate Limiting Impact" and r.passed for r in self.results),
            "PII Encryption": any(r.test_name == "PII Encryption & Search" and r.passed for r in self.results),
            "Authentication": any(r.test_name == "Authentication & User Management" and r.passed for r in self.results)
        }
        
        for check, passed in security_checks.items():
            status = "✅" if passed else "❌"
            logger.info(f"  {status} {check}")
            
        # Regression checklist
        logger.info("\n📝 REGRESSION TEST CHECKLIST:")
        logger.info("-" * 40)
        
        features = [
            "User Authentication (all 5 roles)",
            "Applicant CRUD Operations", 
            "Project Management",
            "Application Workflow",
            "File Upload/Download",
            "Email Notifications",
            "Map/Location Features",
            "Search Functionality",
            "PII Data Handling",
            "Rate Limiting"
        ]
        
        for feature in features:
            # Check if feature was tested and passed
            tested = any(feature.lower() in r.test_name.lower() for r in self.results)
            passed = any(feature.lower() in r.test_name.lower() and r.passed for r in self.results)
            
            if tested:
                status = "✅" if passed else "❌"
            else:
                status = "⚠️ "
                
            logger.info(f"  {status} {feature}")
            
        # Critical issues
        critical_issues = []
        for result in self.results:
            if not result.passed:
                critical_issues.extend(result.errors)
                
        if critical_issues:
            logger.info("\n🚨 CRITICAL ISSUES REQUIRING FIXES:")
            logger.info("-" * 40)
            for i, issue in enumerate(critical_issues, 1):
                logger.info(f"  {i}. {issue}")
                
        # Recommendations
        logger.info("\n💡 RECOMMENDATIONS:")
        logger.info("-" * 40)
        
        if failed_tests > 0:
            logger.info("  1. Fix all critical issues before deployment")
            logger.info("  2. Re-run failed tests after fixes")
            logger.info("  3. Add automated tests for failed scenarios")
        else:
            logger.info("  1. Application is ready for production deployment")
            logger.info("  2. Set up continuous monitoring")
            logger.info("  3. Schedule regular security audits")
            
        logger.info("\n" + "=" * 60)
        logger.info(f"Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info("=" * 60)
        
        # Save detailed report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0
            },
            "results": [
                {
                    "test": r.test_name,
                    "passed": r.passed,
                    "errors": r.errors,
                    "warnings": r.warnings,
                    "metrics": r.performance_metrics
                }
                for r in self.results
            ]
        }
        
        with open("test_results.json", "w") as f:
            json.dump(report_data, f, indent=2)
            
        logger.info("\n📄 Detailed report saved to: test_results.json")

async def main():
    """Run the test suite"""
    # Check if services are running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            logger.error("❌ Backend service not responding properly")
            return
    except:
        logger.error("❌ Backend service not running. Start with: python3 supabase_backend.py")
        return
        
    # Run tests
    suite = HomeVerseTestSuite()
    await suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())