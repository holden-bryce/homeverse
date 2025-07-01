import { test, expect, Page } from '@playwright/test';
import { TEST_USERS } from '../fixtures/users';
import { login, logout, register } from '../helpers/auth.helper';
import { createApplicant, searchApplicants } from '../helpers/applicant.helper';
import { createProject, uploadProjectImage } from '../helpers/project.helper';
import { uploadDocument } from '../helpers/file.helper';
import { measurePerformance } from '../helpers/performance.helper';

test.describe('HomeVerse Comprehensive E2E Test Suite', () => {
  test.describe('Multi-Role User Journey Testing', () => {
    test.describe('Super Admin Journey', () => {
      test('complete system setup and user management', async ({ page }) => {
        // Login as super admin
        await login(page, 'admin@test.com', 'password123');
        
        // Navigate to admin dashboard
        await page.goto('/dashboard');
        await expect(page.locator('h1')).toContainText('Admin Dashboard');
        
        // Create new company
        await page.goto('/dashboard/admin/companies');
        await page.click('text=Create Company');
        await page.fill('[name="name"]', 'Test Housing Corp');
        await page.fill('[name="company_key"]', 'test-housing-corp');
        await page.selectOption('[name="plan"]', 'enterprise');
        await page.fill('[name="max_users"]', '50');
        await page.click('button[type="submit"]');
        await expect(page.locator('.toast-success')).toContainText('Company created');
        
        // Create users for the new company
        await page.goto('/dashboard/admin/users');
        await page.click('text=Create User');
        await page.fill('[name="email"]', 'manager@testhousing.com');
        await page.fill('[name="password"]', 'securePass123!');
        await page.selectOption('[name="role"]', 'manager');
        await page.selectOption('[name="company_key"]', 'test-housing-corp');
        await page.click('button[type="submit"]');
        await expect(page.locator('.toast-success')).toContainText('User created');
        
        // Verify audit log
        await page.goto('/dashboard/activities');
        await expect(page.locator('text=Created company Test Housing Corp')).toBeVisible();
        await expect(page.locator('text=Created user manager@testhousing.com')).toBeVisible();
      });
    });

    test.describe('Company Admin Journey', () => {
      test('organization setup and staff management', async ({ page }) => {
        await login(page, 'admin@test.com', 'password123');
        
        // Update company settings
        await page.goto('/dashboard/settings');
        await page.click('text=Company Settings');
        await page.fill('[name="company_name"]', 'HomeVerse Properties Inc.');
        await page.fill('[name="address"]', '123 Main St, San Francisco, CA 94105');
        await page.fill('[name="phone"]', '(415) 555-0123');
        await page.click('text=Save Company Settings');
        await expect(page.locator('.toast-success')).toContainText('Company settings updated');
        
        // Manage staff
        await page.goto('/dashboard/admin/users');
        const staffCount = await page.locator('tbody tr').count();
        expect(staffCount).toBeGreaterThan(0);
        
        // Update user permissions
        await page.click('tbody tr:first-child button:has-text("Edit")');
        await page.selectOption('[name="role"]', 'manager');
        await page.click('button:has-text("Update User")');
        await expect(page.locator('.toast-success')).toContainText('User updated');
      });
    });

    test.describe('Manager Journey', () => {
      test('project oversight and approval workflows', async ({ page }) => {
        await login(page, 'manager@test.com', 'password123');
        
        // Review pending applications
        await page.goto('/dashboard/applications');
        await page.click('text=Pending Review');
        
        // Review first application
        await page.click('tbody tr:first-child a:has-text("View")');
        await expect(page.locator('h1')).toContainText('Application Details');
        
        // Check applicant information
        await expect(page.locator('text=Applicant Information')).toBeVisible();
        await expect(page.locator('text=Income Verification')).toBeVisible();
        await expect(page.locator('text=Documents')).toBeVisible();
        
        // Approve application
        await page.click('button:has-text("Approve Application")');
        await page.fill('textarea[name="notes"]', 'Meets all criteria. Income verified.');
        await page.click('button:has-text("Confirm Approval")');
        await expect(page.locator('.toast-success')).toContainText('Application approved');
        
        // Generate report
        await page.goto('/dashboard/reports');
        await page.click('text=Generate Monthly Report');
        await page.selectOption('[name="report_type"]', 'applications');
        await page.click('button:has-text("Generate")');
        await expect(page.locator('text=Report generated')).toBeVisible();
      });
    });

    test.describe('Staff Journey', () => {
      test('daily operations and applicant data entry', async ({ page }) => {
        await login(page, 'staff@test.com', 'password123');
        
        // Create new applicant
        await page.goto('/dashboard/applicants/new');
        await page.fill('[name="first_name"]', 'John');
        await page.fill('[name="last_name"]', 'Doe');
        await page.fill('[name="email"]', 'john.doe@example.com');
        await page.fill('[name="phone"]', '(555) 123-4567');
        await page.fill('[name="date_of_birth"]', '1990-01-15');
        await page.fill('[name="household_size"]', '3');
        await page.fill('[name="annual_income"]', '65000');
        await page.selectOption('[name="employment_status"]', 'employed');
        await page.fill('[name="address"]', '456 Oak St, San Francisco, CA 94110');
        await page.click('button[type="submit"]');
        await expect(page.locator('.toast-success')).toContainText('Applicant created');
        
        // Update applicant status
        await page.goto('/dashboard/applicants');
        await page.fill('[placeholder="Search applicants..."]', 'John Doe');
        await page.keyboard.press('Enter');
        await page.click('text=John Doe');
        await page.click('text=Edit');
        await page.selectOption('[name="status"]', 'verified');
        await page.fill('[name="notes"]', 'Income documentation verified');
        await page.click('button:has-text("Update Applicant")');
        await expect(page.locator('.toast-success')).toContainText('Applicant updated');
      });
    });

    test.describe('Applicant Journey', () => {
      test('registration, profile completion, and application submission', async ({ page }) => {
        // Register new applicant
        await page.goto('/auth/register');
        await page.selectOption('[name="role"]', 'applicant');
        await page.fill('[name="email"]', 'newapplicant@example.com');
        await page.fill('[name="password"]', 'SecurePass123!');
        await page.fill('[name="confirmPassword"]', 'SecurePass123!');
        await page.fill('[name="company_key"]', 'affordable');
        await page.click('button:has-text("Register")');
        await expect(page).toHaveURL('/dashboard');
        
        // Complete profile
        await page.goto('/dashboard/profile');
        await page.fill('[name="first_name"]', 'Sarah');
        await page.fill('[name="last_name"]', 'Johnson');
        await page.fill('[name="phone"]', '(555) 987-6543');
        await page.fill('[name="date_of_birth"]', '1985-06-20');
        await page.fill('[name="household_size"]', '4');
        await page.fill('[name="annual_income"]', '55000');
        await page.selectOption('[name="employment_status"]', 'employed');
        await page.click('button:has-text("Save Profile")');
        await expect(page.locator('.toast-success')).toContainText('Profile updated');
        
        // Browse available housing
        await page.goto('/dashboard/search');
        await page.fill('[name="max_rent"]', '2000');
        await page.selectOption('[name="bedrooms"]', '2');
        await page.click('button:has-text("Search")');
        await expect(page.locator('.property-card')).toHaveCount(3);
        
        // Submit application
        await page.click('.property-card:first-child button:has-text("Apply")');
        await page.fill('textarea[name="why_interested"]', 'Perfect location for my family');
        await page.setInputFiles('input[type="file"]', 'tests/fixtures/sample-income.pdf');
        await page.click('button:has-text("Submit Application")');
        await expect(page.locator('.toast-success')).toContainText('Application submitted');
        
        // Track application status
        await page.goto('/dashboard/applications');
        await expect(page.locator('text=Pending Review')).toBeVisible();
      });
    });
  });

  test.describe('Core Feature Workflows', () => {
    test('authentication flow with email verification', async ({ page }) => {
      // Test rate limiting
      for (let i = 0; i < 4; i++) {
        await page.goto('/auth/register');
        await page.fill('[name="email"]', `test${i}@example.com`);
        await page.fill('[name="password"]', 'TestPass123!');
        await page.fill('[name="confirmPassword"]', 'TestPass123!');
        await page.click('button:has-text("Register")');
        
        if (i === 3) {
          await expect(page.locator('.toast-error')).toContainText('Rate limit exceeded');
        }
      }
      
      // Test login with wrong credentials
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'wrong@example.com');
      await page.fill('[name="password"]', 'wrongpass');
      await page.click('button:has-text("Sign In")');
      await expect(page.locator('.toast-error')).toContainText('Invalid credentials');
      
      // Test successful login and role redirect
      await login(page, 'developer@test.com', 'password123');
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Developer Dashboard');
      
      // Test logout
      await logout(page);
      await expect(page).toHaveURL('/');
    });

    test('complete applicant management CRUD', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      
      const applicantData = {
        first_name: 'Test',
        last_name: 'Applicant',
        email: 'test.applicant@example.com',
        phone: '(555) 111-2222',
        date_of_birth: '1988-03-25',
        household_size: '2',
        annual_income: '48000',
        employment_status: 'employed'
      };
      
      // Create
      const applicantId = await createApplicant(page, applicantData);
      expect(applicantId).toBeTruthy();
      
      // Read
      await page.goto(`/dashboard/applicants/${applicantId}`);
      await expect(page.locator('h1')).toContainText('Test Applicant');
      await expect(page.locator('text=$48,000')).toBeVisible();
      
      // Update
      await page.click('text=Edit');
      await page.fill('[name="annual_income"]', '52000');
      await page.click('button:has-text("Update Applicant")');
      await expect(page.locator('.toast-success')).toContainText('updated');
      
      // Search
      await page.goto('/dashboard/applicants');
      const results = await searchApplicants(page, 'Test Applicant');
      expect(results).toBeGreaterThan(0);
      
      // Delete
      await page.click(`[data-applicant-id="${applicantId}"] button:has-text("Delete")`);
      await page.click('button:has-text("Confirm Delete")');
      await expect(page.locator('.toast-success')).toContainText('deleted');
    });

    test('project management with image upload', async ({ page }) => {
      await login(page, 'developer@test.com', 'password123');
      
      // Create project
      const projectData = {
        name: 'Sunset Heights Apartments',
        description: 'Modern affordable housing complex',
        address: '789 Sunset Blvd, San Francisco, CA 94122',
        total_units: '50',
        affordable_units: '40',
        ami_levels: ['30', '50', '80'],
        min_income: '25000',
        max_income: '85000'
      };
      
      const projectId = await createProject(page, projectData);
      expect(projectId).toBeTruthy();
      
      // Upload images
      await uploadProjectImage(page, projectId, 'tests/fixtures/building1.jpg');
      await uploadProjectImage(page, projectId, 'tests/fixtures/building2.jpg');
      await expect(page.locator('.project-image')).toHaveCount(2);
      
      // Update project status
      await page.goto(`/dashboard/projects/${projectId}/edit`);
      await page.selectOption('[name="status"]', 'accepting_applications');
      await page.click('button:has-text("Update Project")');
      await expect(page.locator('.toast-success')).toContainText('Project updated');
    });

    test('application process with document upload', async ({ page }) => {
      await login(page, 'applicant@test.com', 'password123');
      
      // Find suitable project
      await page.goto('/dashboard/search');
      await page.fill('[name="max_rent"]', '1800');
      await page.click('button:has-text("Search")');
      await page.click('.property-card:first-child');
      
      // Start application
      await page.click('button:has-text("Apply Now")');
      
      // Fill application form
      await page.fill('[name="move_in_date"]', '2024-03-01');
      await page.fill('[name="current_address"]', '123 Current St, Oakland, CA 94612');
      await page.selectOption('[name="housing_reason"]', 'closer_to_work');
      await page.fill('textarea[name="additional_info"]', 'Stable employment for 5 years');
      
      // Upload documents
      await uploadDocument(page, 'income_proof', 'tests/fixtures/paystub.pdf');
      await uploadDocument(page, 'id_proof', 'tests/fixtures/drivers_license.pdf');
      await uploadDocument(page, 'employment_letter', 'tests/fixtures/employment.pdf');
      
      // Submit
      await page.click('button:has-text("Submit Application")');
      await expect(page.locator('.toast-success')).toContainText('Application submitted');
      
      // Verify in dashboard
      await page.goto('/dashboard/applications');
      await expect(page.locator('text=Sunset Heights Apartments')).toBeVisible();
      await expect(page.locator('text=Under Review')).toBeVisible();
    });

    test('email notification system', async ({ page }) => {
      // Login as manager to trigger notifications
      await login(page, 'manager@test.com', 'password123');
      
      // Approve an application (triggers email)
      await page.goto('/dashboard/applications');
      await page.click('text=Pending Review');
      await page.click('tbody tr:first-child a:has-text("View")');
      await page.click('button:has-text("Approve")');
      await page.fill('textarea[name="notes"]', 'Approved - meets all criteria');
      await page.click('button:has-text("Confirm")');
      
      // Verify notification was logged
      await page.goto('/dashboard/activities');
      await expect(page.locator('text=Email sent to applicant')).toBeVisible();
      
      // Check notification preferences
      await page.goto('/dashboard/settings');
      await page.click('text=Notifications');
      await expect(page.locator('[name="email_new_applications"]')).toBeChecked();
      await expect(page.locator('[name="email_status_updates"]')).toBeChecked();
    });
  });

  test.describe('Security Feature Validation', () => {
    test('rate limiting protection', async ({ page }) => {
      // Test login rate limiting (5 attempts per minute)
      for (let i = 0; i < 6; i++) {
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'test@example.com');
        await page.fill('[name="password"]', `wrong${i}`);
        await page.click('button:has-text("Sign In")');
        
        if (i === 5) {
          await expect(page.locator('.toast-error')).toContainText('Too many attempts');
        }
      }
      
      // Test API rate limiting
      await login(page, 'staff@test.com', 'password123');
      const responses = [];
      
      // Make rapid API calls
      for (let i = 0; i < 20; i++) {
        responses.push(page.goto('/dashboard/applicants'));
      }
      
      await Promise.all(responses);
      // Last request should be rate limited
      expect(page.url()).toContain('/dashboard/applicants');
    });

    test('PII encryption transparency', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      
      // Create applicant with PII
      await page.goto('/dashboard/applicants/new');
      const email = 'pii.test@example.com';
      const phone = '(555) 999-8888';
      
      await page.fill('[name="first_name"]', 'PII');
      await page.fill('[name="last_name"]', 'Test');
      await page.fill('[name="email"]', email);
      await page.fill('[name="phone"]', phone);
      await page.fill('[name="household_size"]', '1');
      await page.fill('[name="annual_income"]', '50000');
      await page.click('button[type="submit"]');
      
      // Verify PII is displayed correctly (decrypted transparently)
      await page.goto('/dashboard/applicants');
      await page.fill('[placeholder="Search applicants..."]', 'PII Test');
      await page.keyboard.press('Enter');
      await page.click('text=PII Test');
      
      await expect(page.locator(`text=${email}`)).toBeVisible();
      await expect(page.locator(`text=${phone}`)).toBeVisible();
    });

    test('role-based access control', async ({ page }) => {
      // Test staff cannot access admin features
      await login(page, 'staff@test.com', 'password123');
      await page.goto('/dashboard/admin/companies');
      await expect(page).toHaveURL('/dashboard'); // Redirected
      await expect(page.locator('.toast-error')).toContainText('Unauthorized');
      
      // Test applicant cannot access staff features  
      await logout(page);
      await login(page, 'applicant@test.com', 'password123');
      await page.goto('/dashboard/applicants');
      await expect(page).toHaveURL('/dashboard'); // Redirected
      
      // Test developer can only see their projects
      await logout(page);
      await login(page, 'developer@test.com', 'password123');
      await page.goto('/dashboard/projects');
      const projectCount = await page.locator('tbody tr').count();
      // Should only see projects from their company
      expect(projectCount).toBeGreaterThan(0);
      expect(projectCount).toBeLessThan(10);
    });

    test('CORS and security headers', async ({ page, context }) => {
      // Intercept response to check headers
      await page.route('**/*', route => {
        route.continue();
      });
      
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          const headers = response.headers();
          expect(headers['x-content-type-options']).toBe('nosniff');
          expect(headers['x-frame-options']).toBe('DENY');
          expect(headers['x-xss-protection']).toBe('1; mode=block');
        }
      });
      
      await login(page, 'staff@test.com', 'password123');
      await page.goto('/dashboard');
    });

    test('session management and timeout', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      
      // Verify session is active
      await page.goto('/dashboard/profile');
      await expect(page.locator('h1')).toContainText('Profile');
      
      // Simulate session timeout by clearing cookies
      await context.clearCookies();
      
      // Try to access protected route
      await page.goto('/dashboard/applicants');
      await expect(page).toHaveURL('/auth/login');
      await expect(page.locator('.toast-warning')).toContainText('Session expired');
    });
  });

  test.describe('UI/UX Component Testing', () => {
    test('mobile responsiveness', async ({ page }) => {
      // Test on mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Check mobile menu
      await expect(page.locator('.mobile-menu-button')).toBeVisible();
      await page.click('.mobile-menu-button');
      await expect(page.locator('.mobile-menu')).toBeVisible();
      
      // Navigate to login
      await page.click('text=Sign In');
      await expect(page).toHaveURL('/auth/login');
      
      // Check form is usable on mobile
      await page.fill('[name="email"]', 'staff@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      
      // Check dashboard on mobile
      await expect(page.locator('.mobile-dashboard-menu')).toBeVisible();
    });

    test('desktop browser compatibility', async ({ browserName }) => {
      await page.goto('/');
      
      // Check page loads correctly
      await expect(page.locator('h1')).toContainText('HomeVerse');
      
      // Test interactive elements
      await page.hover('.feature-card:first-child');
      await expect(page.locator('.feature-card:first-child')).toHaveClass(/hover:shadow-lg/);
      
      // Test form elements
      await page.goto('/contact');
      await page.fill('[name="name"]', `Test User ${browserName}`);
      await page.fill('[name="email"]', 'test@example.com');
      await page.selectOption('[name="department"]', 'support');
      await page.fill('textarea[name="message"]', 'Browser compatibility test');
      
      // Browser-specific checks
      if (browserName === 'webkit') {
        // Safari-specific tests
        await expect(page.locator('input[type="date"]')).toBeVisible();
      }
    });

    test('accessibility features', async ({ page }) => {
      await page.goto('/');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('a:focus')).toBeVisible();
      
      // Continue tabbing through main nav
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
        
        // Check focus indicators
        const outline = await focused.evaluate(el => 
          window.getComputedStyle(el).outline
        );
        expect(outline).toContain('2px');
      }
      
      // Test screen reader labels
      const images = page.locator('img');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        expect(alt).toBeTruthy();
      }
      
      // Test ARIA labels
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
      
      // Test form labels
      await page.goto('/auth/login');
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const label = page.locator(`label[for="${id}"]`);
        await expect(label).toBeVisible();
      }
    });

    test('loading states and skeleton components', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      
      // Intercept API calls to add delay
      await page.route('**/api/v1/applicants**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      // Navigate to applicants page
      await page.goto('/dashboard/applicants');
      
      // Check skeleton loaders appear
      await expect(page.locator('.skeleton-loader')).toBeVisible();
      await expect(page.locator('.skeleton-loader')).toHaveCount(5);
      
      // Wait for content to load
      await expect(page.locator('.skeleton-loader')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('tbody tr')).toBeVisible();
    });

    test('error handling and user feedback', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      
      // Test form validation errors
      await page.goto('/dashboard/applicants/new');
      await page.click('button[type="submit"]');
      
      // Check validation messages
      await expect(page.locator('text=First name is required')).toBeVisible();
      await expect(page.locator('text=Last name is required')).toBeVisible();
      await expect(page.locator('text=Email is required')).toBeVisible();
      
      // Test network error handling
      await page.route('**/api/v1/applicants', route => 
        route.fulfill({ status: 500, body: 'Server error' })
      );
      
      await page.fill('[name="first_name"]', 'Test');
      await page.fill('[name="last_name"]', 'User');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="household_size"]', '1');
      await page.fill('[name="annual_income"]', '50000');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('.toast-error')).toContainText('Something went wrong');
      
      // Test 404 page
      await page.goto('/dashboard/nonexistent');
      await expect(page.locator('h1')).toContainText('404');
      await expect(page.locator('text=Page not found')).toBeVisible();
      await page.click('text=Go to Dashboard');
      await expect(page).toHaveURL('/dashboard');
    });
  });

  test.describe('Integration & Performance Testing', () => {
    test('Supabase database operations under load', async ({ page }) => {
      await login(page, 'staff@test.com', 'password123');
      
      const operations = [];
      const startTime = Date.now();
      
      // Create 10 applicants concurrently
      for (let i = 0; i < 10; i++) {
        operations.push(createApplicant(page, {
          first_name: `Load${i}`,
          last_name: `Test${i}`,
          email: `load${i}@test.com`,
          phone: `(555) 000-${i.toString().padStart(4, '0')}`,
          household_size: '2',
          annual_income: '50000'
        }));
      }
      
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // All operations should succeed
      expect(results.every(id => id !== null)).toBeTruthy();
      
      // Should complete within reasonable time (< 10 seconds)
      expect(duration).toBeLessThan(10000);
      
      // Verify all were created
      await page.goto('/dashboard/applicants');
      await page.fill('[placeholder="Search applicants..."]', 'Load');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      const count = await page.locator('tbody tr').count();
      expect(count).toBe(10);
    });

    test('SendGrid email delivery', async ({ page, request }) => {
      // Create test endpoint to verify email sending
      await login(page, 'manager@test.com', 'password123');
      
      // Trigger email by approving application
      await page.goto('/dashboard/applications');
      await page.click('text=Pending Review');
      const applicantEmail = await page.locator('tbody tr:first-child td:nth-child(3)').textContent();
      
      await page.click('tbody tr:first-child a:has-text("View")');
      await page.click('button:has-text("Approve")');
      await page.fill('textarea[name="notes"]', 'Email test approval');
      await page.click('button:has-text("Confirm")');
      
      // Check API logs for email sent
      const response = await request.get('/api/v1/activities?type=email_sent');
      const activities = await response.json();
      const emailActivity = activities.find(a => 
        a.description.includes(applicantEmail) && 
        a.description.includes('Application approved')
      );
      
      expect(emailActivity).toBeTruthy();
    });

    test('Mapbox map rendering and interactions', async ({ page }) => {
      await login(page, 'buyer@test.com', 'password123');
      await page.goto('/dashboard/map');
      
      // Wait for map to load
      await page.waitForSelector('.mapboxgl-map', { timeout: 10000 });
      
      // Check map controls
      await expect(page.locator('.mapboxgl-ctrl-zoom-in')).toBeVisible();
      await expect(page.locator('.mapboxgl-ctrl-zoom-out')).toBeVisible();
      
      // Test zoom
      const initialZoom = await page.evaluate(() => 
        window.map?.getZoom() || 0
      );
      await page.click('.mapboxgl-ctrl-zoom-in');
      await page.waitForTimeout(500);
      const newZoom = await page.evaluate(() => 
        window.map?.getZoom() || 0
      );
      expect(newZoom).toBeGreaterThan(initialZoom);
      
      // Test marker interactions
      await page.waitForSelector('.mapboxgl-marker', { timeout: 10000 });
      const markers = page.locator('.mapboxgl-marker');
      const markerCount = await markers.count();
      expect(markerCount).toBeGreaterThan(0);
      
      // Click marker to show popup
      await markers.first().click();
      await expect(page.locator('.mapboxgl-popup')).toBeVisible();
      await expect(page.locator('.mapboxgl-popup-content')).toContainText('View Details');
    });

    test('file upload/download with various types', async ({ page }) => {
      await login(page, 'applicant@test.com', 'password123');
      await page.goto('/dashboard/documents');
      
      // Test different file types
      const fileTypes = [
        { name: 'document.pdf', type: 'application/pdf' },
        { name: 'image.jpg', type: 'image/jpeg' },
        { name: 'image.png', type: 'image/png' },
        { name: 'document.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
      ];
      
      for (const file of fileTypes) {
        await page.setInputFiles('input[type="file"]', {
          name: file.name,
          mimeType: file.type,
          buffer: Buffer.from('test content')
        });
        
        await page.click('button:has-text("Upload")');
        await expect(page.locator(`.file-list:has-text("${file.name}")`)).toBeVisible();
      }
      
      // Test file size limit
      await page.setInputFiles('input[type="file"]', {
        name: 'large.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.alloc(11 * 1024 * 1024) // 11MB
      });
      await page.click('button:has-text("Upload")');
      await expect(page.locator('.toast-error')).toContainText('File too large');
      
      // Test download
      await page.click('.file-list:first-child button:has-text("Download")');
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toBeTruthy();
    });

    test('concurrent user operations', async ({ browser }) => {
      const users = [
        { email: 'staff@test.com', role: 'staff' },
        { email: 'manager@test.com', role: 'manager' },
        { email: 'developer@test.com', role: 'developer' },
        { email: 'applicant@test.com', role: 'applicant' },
        { email: 'buyer@test.com', role: 'buyer' }
      ];
      
      const contexts = [];
      const pages = [];
      
      // Create contexts and pages for each user
      for (const user of users) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push({ page, user });
      }
      
      // Login all users concurrently
      await Promise.all(pages.map(async ({ page, user }) => {
        await login(page, user.email, 'password123');
      }));
      
      // Perform concurrent operations
      const operations = [
        // Staff creates applicant
        pages[0].page.goto('/dashboard/applicants/new').then(() =>
          createApplicant(pages[0].page, {
            first_name: 'Concurrent',
            last_name: 'Test1',
            email: 'concurrent1@test.com',
            household_size: '2',
            annual_income: '60000'
          })
        ),
        
        // Manager reviews applications
        pages[1].page.goto('/dashboard/applications'),
        
        // Developer creates project
        pages[2].page.goto('/dashboard/projects/new').then(() =>
          createProject(pages[2].page, {
            name: 'Concurrent Test Project',
            description: 'Testing concurrent operations',
            total_units: '20',
            affordable_units: '15'
          })
        ),
        
        // Applicant searches properties
        pages[3].page.goto('/dashboard/search'),
        
        // Buyer views map
        pages[4].page.goto('/dashboard/map')
      ];
      
      // Execute all operations
      const results = await Promise.allSettled(operations);
      
      // Verify all operations completed successfully
      expect(results.every(r => r.status === 'fulfilled')).toBeTruthy();
      
      // Cleanup
      await Promise.all(contexts.map(c => c.close()));
    });
  });

  test.describe('Performance Benchmarking', () => {
    test('measure page load times', async ({ page }) => {
      const metrics = await measurePerformance(page, [
        { name: 'Homepage', url: '/' },
        { name: 'Login', url: '/auth/login' },
        { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
        { name: 'Applicants List', url: '/dashboard/applicants', requiresAuth: true },
        { name: 'Projects Map', url: '/dashboard/map', requiresAuth: true }
      ]);
      
      // Generate performance report
      console.log('\n=== Performance Metrics ===');
      metrics.forEach(metric => {
        console.log(`${metric.name}:`);
        console.log(`  First Paint: ${metric.firstPaint}ms`);
        console.log(`  DOM Content Loaded: ${metric.domContentLoaded}ms`);
        console.log(`  Load Complete: ${metric.loadComplete}ms`);
        console.log(`  Largest Contentful Paint: ${metric.lcp}ms`);
      });
      
      // Assert performance thresholds
      metrics.forEach(metric => {
        expect(metric.firstPaint).toBeLessThan(1500);
        expect(metric.domContentLoaded).toBeLessThan(2000);
        expect(metric.loadComplete).toBeLessThan(3000);
        expect(metric.lcp).toBeLessThan(2500);
      });
    });
  });
});