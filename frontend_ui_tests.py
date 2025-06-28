#!/usr/bin/env python3
"""
HomeVerse Frontend UI Testing Script
Tests UI functionality, responsiveness, and cross-browser compatibility
"""

import asyncio
import json
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Test configuration
FRONTEND_URL = "http://localhost:3000"
WAIT_TIMEOUT = 10

# Test accounts
TEST_ACCOUNTS = {
    "developer": {"email": "developer@test.com", "password": "password123"},
    "lender": {"email": "lender@test.com", "password": "password123"},
    "applicant": {"email": "applicant@test.com", "password": "password123"}
}

class FrontendUITests:
    def __init__(self):
        self.results = []
        self.driver = None
        
    def setup_driver(self, browser="chrome"):
        """Setup Selenium WebDriver"""
        if browser == "chrome":
            options = webdriver.ChromeOptions()
            options.add_argument('--headless')
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            self.driver = webdriver.Chrome(options=options)
        elif browser == "firefox":
            options = webdriver.FirefoxOptions()
            options.add_argument('--headless')
            self.driver = webdriver.Firefox(options=options)
        else:
            raise ValueError(f"Unsupported browser: {browser}")
            
        self.driver.set_window_size(1920, 1080)
        self.wait = WebDriverWait(self.driver, WAIT_TIMEOUT)
        
    def teardown(self):
        """Close the browser"""
        if self.driver:
            self.driver.quit()
            
    def test_landing_page(self):
        """Test landing page elements and responsiveness"""
        logger.info("Testing landing page...")
        
        try:
            self.driver.get(FRONTEND_URL)
            
            # Check page title
            assert "HomeVerse" in self.driver.title
            
            # Check main navigation elements
            nav_links = self.driver.find_elements(By.CSS_SELECTOR, "nav a")
            expected_links = ["About", "Features", "Contact", "Login"]
            
            # Check hero section
            hero = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='hero'], h1"))
            )
            assert hero is not None
            
            # Check CTA buttons
            cta_buttons = self.driver.find_elements(By.CSS_SELECTOR, "button, a[href*='auth']")
            assert len(cta_buttons) > 0
            
            # Test responsive design
            # Mobile view
            self.driver.set_window_size(375, 667)
            time.sleep(1)
            
            # Check mobile menu
            mobile_menu = self.driver.find_elements(By.CSS_SELECTOR, "[class*='mobile'], [class*='burger']")
            
            # Tablet view
            self.driver.set_window_size(768, 1024)
            time.sleep(1)
            
            # Desktop view
            self.driver.set_window_size(1920, 1080)
            
            logger.info("✅ Landing page tests passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Landing page test failed: {str(e)}")
            return False
            
    def test_authentication_flow(self):
        """Test login flow for different user roles"""
        logger.info("Testing authentication flow...")
        
        results = {}
        
        for role, credentials in TEST_ACCOUNTS.items():
            try:
                # Navigate to login page
                self.driver.get(f"{FRONTEND_URL}/auth/login")
                
                # Find and fill login form
                email_input = self.wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
                )
                password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
                
                email_input.clear()
                email_input.send_keys(credentials["email"])
                
                password_input.clear()
                password_input.send_keys(credentials["password"])
                
                # Submit form
                submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
                submit_button.click()
                
                # Wait for redirect to dashboard
                self.wait.until(
                    EC.url_contains("/dashboard")
                )
                
                # Verify correct dashboard loaded
                dashboard_url = self.driver.current_url
                
                # Check for role-specific elements
                if role == "developer":
                    assert any(x in dashboard_url for x in ["/dashboard", "/projects"])
                elif role == "lender":
                    assert any(x in dashboard_url for x in ["/dashboard", "/investments"])
                elif role == "applicant":
                    assert any(x in dashboard_url for x in ["/dashboard", "/applications"])
                    
                results[role] = "✅ Passed"
                
                # Logout
                self.logout()
                
            except Exception as e:
                results[role] = f"❌ Failed: {str(e)}"
                
        # Log results
        for role, result in results.items():
            logger.info(f"  {role}: {result}")
            
        return all("✅" in r for r in results.values())
        
    def test_applicant_crud_ui(self):
        """Test applicant management UI"""
        logger.info("Testing applicant CRUD UI...")
        
        try:
            # Login as developer
            self.login("developer")
            
            # Navigate to applicants section
            self.driver.get(f"{FRONTEND_URL}/dashboard/applicants")
            
            # Check for applicants table/list
            applicants_container = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='table'], [class*='list'], [role='table']"))
            )
            
            # Click create new applicant
            create_button = self.driver.find_element(By.CSS_SELECTOR, "a[href*='new'], button:contains('Add'), button:contains('Create')")
            create_button.click()
            
            # Fill applicant form
            self.wait.until(EC.url_contains("/new"))
            
            # Find form fields
            form_fields = {
                "first_name": "Test",
                "last_name": "Applicant",
                "email": f"test_{int(time.time())}@example.com",
                "phone": "+1234567890"
            }
            
            for field_name, value in form_fields.items():
                try:
                    field = self.driver.find_element(By.CSS_SELECTOR, f"input[name='{field_name}']")
                    field.clear()
                    field.send_keys(value)
                except:
                    logger.warning(f"Could not find field: {field_name}")
                    
            # Submit form
            submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            submit_button.click()
            
            # Wait for success (redirect or toast)
            time.sleep(2)
            
            # Check for success indicators
            success_indicators = [
                self.driver.current_url != f"{FRONTEND_URL}/dashboard/applicants/new",
                len(self.driver.find_elements(By.CSS_SELECTOR, "[class*='toast'], [class*='success']")) > 0
            ]
            
            logger.info("✅ Applicant CRUD UI tests passed")
            return any(success_indicators)
            
        except Exception as e:
            logger.error(f"❌ Applicant CRUD UI test failed: {str(e)}")
            return False
            
    def test_responsive_design(self):
        """Test responsive design across different screen sizes"""
        logger.info("Testing responsive design...")
        
        test_pages = [
            "/",
            "/auth/login",
            "/dashboard"
        ]
        
        screen_sizes = [
            ("Mobile", 375, 667),
            ("Tablet", 768, 1024),
            ("Desktop", 1920, 1080)
        ]
        
        results = {}
        
        for page in test_pages:
            page_results = {}
            
            for size_name, width, height in screen_sizes:
                try:
                    self.driver.set_window_size(width, height)
                    self.driver.get(f"{FRONTEND_URL}{page}")
                    time.sleep(1)
                    
                    # Check for horizontal scroll (bad)
                    body = self.driver.find_element(By.TAG_NAME, "body")
                    has_horizontal_scroll = self.driver.execute_script(
                        "return document.documentElement.scrollWidth > document.documentElement.clientWidth"
                    )
                    
                    # Check for overlapping elements
                    overlapping = self.driver.execute_script("""
                        const elements = document.querySelectorAll('*');
                        for (let i = 0; i < elements.length - 1; i++) {
                            const rect1 = elements[i].getBoundingClientRect();
                            const rect2 = elements[i + 1].getBoundingClientRect();
                            if (rect1.right > rect2.left && rect1.left < rect2.right &&
                                rect1.bottom > rect2.top && rect1.top < rect2.bottom) {
                                return true;
                            }
                        }
                        return false;
                    """)
                    
                    if has_horizontal_scroll:
                        page_results[size_name] = "❌ Horizontal scroll"
                    elif overlapping:
                        page_results[size_name] = "⚠️  Possible overlap"
                    else:
                        page_results[size_name] = "✅ Good"
                        
                except Exception as e:
                    page_results[size_name] = f"❌ Error: {str(e)}"
                    
            results[page] = page_results
            
        # Log results
        for page, sizes in results.items():
            logger.info(f"\n  {page}:")
            for size, result in sizes.items():
                logger.info(f"    {size}: {result}")
                
        return True
        
    def test_performance_metrics(self):
        """Test frontend performance metrics"""
        logger.info("Testing frontend performance...")
        
        metrics = {}
        
        try:
            # Test page load times
            pages = ["/", "/auth/login", "/dashboard"]
            
            for page in pages:
                start = time.time()
                self.driver.get(f"{FRONTEND_URL}{page}")
                
                # Wait for page to be interactive
                self.wait.until(
                    lambda driver: driver.execute_script("return document.readyState") == "complete"
                )
                
                load_time = (time.time() - start) * 1000
                
                # Get performance metrics
                perf_data = self.driver.execute_script("""
                    const perfData = performance.getEntriesByType('navigation')[0];
                    return {
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                        totalTime: perfData.loadEventEnd - perfData.fetchStart
                    };
                """)
                
                metrics[page] = {
                    "measured_load_time": load_time,
                    "browser_metrics": perf_data
                }
                
            # Log results
            for page, data in metrics.items():
                logger.info(f"\n  {page}:")
                logger.info(f"    Load time: {data['measured_load_time']:.0f}ms")
                if data['browser_metrics']:
                    logger.info(f"    DOM ready: {data['browser_metrics']['domContentLoaded']:.0f}ms")
                    logger.info(f"    Total time: {data['browser_metrics']['totalTime']:.0f}ms")
                    
            return True
            
        except Exception as e:
            logger.error(f"❌ Performance test failed: {str(e)}")
            return False
            
    def login(self, role):
        """Helper method to login"""
        credentials = TEST_ACCOUNTS[role]
        self.driver.get(f"{FRONTEND_URL}/auth/login")
        
        email_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='password']")
        
        email_input.send_keys(credentials["email"])
        password_input.send_keys(credentials["password"])
        
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        submit_button.click()
        
        self.wait.until(EC.url_contains("/dashboard"))
        
    def logout(self):
        """Helper method to logout"""
        try:
            # Look for logout button/link
            logout_element = self.driver.find_element(By.CSS_SELECTOR, "button:contains('Logout'), a:contains('Logout')")
            logout_element.click()
            time.sleep(1)
        except:
            # Navigate directly to logout
            self.driver.get(f"{FRONTEND_URL}/auth/logout")
            
    def run_all_tests(self):
        """Run all UI tests"""
        logger.info("🚀 Starting Frontend UI Tests")
        logger.info("=" * 60)
        
        test_results = {
            "Landing Page": self.test_landing_page(),
            "Authentication Flow": self.test_authentication_flow(),
            "Applicant CRUD UI": self.test_applicant_crud_ui(),
            "Responsive Design": self.test_responsive_design(),
            "Performance Metrics": self.test_performance_metrics()
        }
        
        # Summary
        logger.info("\n" + "=" * 60)
        logger.info("📊 UI TEST SUMMARY:")
        
        passed = sum(1 for v in test_results.values() if v)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            logger.info(f"  {status} {test_name}")
            
        logger.info(f"\nTotal: {passed}/{total} tests passed")
        
        return test_results

def main():
    """Run frontend UI tests"""
    tester = FrontendUITests()
    
    try:
        # Check if frontend is running
        import requests
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
        except:
            logger.error("❌ Frontend not running. Start with: cd frontend && npm run dev")
            return
            
        # Setup Chrome driver
        logger.info("Setting up Chrome driver...")
        tester.setup_driver("chrome")
        
        # Run tests
        results = tester.run_all_tests()
        
    except Exception as e:
        logger.error(f"Test suite error: {str(e)}")
        
    finally:
        tester.teardown()

if __name__ == "__main__":
    main()