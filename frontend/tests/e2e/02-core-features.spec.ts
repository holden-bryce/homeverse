import { test, expect } from '@playwright/test';
import { testUsers, testApplicant, testProject } from '../fixtures/users';
import { AuthHelper } from '../helpers/auth.helper';
import { ApplicantHelper } from '../helpers/applicant.helper';
import { ProjectHelper } from '../helpers/project.helper';
import { FileHelper } from '../helpers/file.helper';

test.describe('Core Feature Workflows', () => {
  let authHelper: AuthHelper;
  let applicantHelper: ApplicantHelper;
  let projectHelper: ProjectHelper;
  let fileHelper: FileHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    applicantHelper = new ApplicantHelper(page);
    projectHelper = new ProjectHelper(page);
    fileHelper = new FileHelper(page);
  });

  test.describe('Authentication Flow', () => {
    test('complete registration with email verification', async ({ page }) => {
      // 1. Navigate to registration
      await page.goto('/register');
      
      // 2. Fill registration form
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', 'testuser@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
      await page.selectOption('select[name="role"]', 'applicant');
      
      // 3. Accept terms
      await page.check('input[name="acceptTerms"]');
      
      // 4. Submit registration
      await page.click('button[type="submit"]');
      
      // 5. Verify email sent message
      await expect(page.locator('.alert-info')).toContainText('verification email');
      
      // 6. Simulate email verification (in real test, would click link in email)
      await page.goto('/verify-email?token=test-verification-token');
      await expect(page.locator('.alert-success')).toContainText('Email verified');
      
      // 7. Login with new credentials
      await page.goto('/login');
      await page.fill('input[name="email"]', 'testuser@example.com');
      await page.fill('input[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');
      
      // 8. Verify redirect to dashboard
      await page.waitForURL('/dashboard');
      await expect(page.locator('h1')).toContainText('Dashboard');
    });

    test('password reset flow', async ({ page }) => {
      // 1. Go to login and click forgot password
      await page.goto('/login');
      await page.click('a:has-text("Forgot password")');
      
      // 2. Enter email
      await page.fill('input[name="email"]', 'developer@test.com');
      await page.click('button:has-text("Send Reset Link")');
      
      // 3. Verify success message
      await expect(page.locator('.alert-success')).toContainText('reset link');
      
      // 4. Simulate clicking reset link
      await page.goto('/reset-password?token=test-reset-token');
      
      // 5. Enter new password
      await page.fill('input[name="password"]', 'NewSecurePass123!');
      await page.fill('input[name="confirmPassword"]', 'NewSecurePass123!');
      await page.click('button:has-text("Reset Password")');
      
      // 6. Verify success and redirect
      await expect(page.locator('.alert-success')).toContainText('Password reset successful');
      await page.waitForURL('/login');
    });

    test('session management and timeout', async ({ page, context }) => {
      // 1. Login
      await authHelper.login(testUsers.developer);
      
      // 2. Verify active session
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // 3. Simulate session timeout by clearing cookies
      await context.clearCookies();
      
      // 4. Try to access protected page
      await page.goto('/dashboard/projects');
      
      // 5. Verify redirect to login
      await page.waitForURL('/login');
      await expect(page.locator('.alert-warning')).toContainText('session expired');
    });
  });

  test.describe('Applicant Management', () => {
    test.beforeEach(async ({ page }) => {
      await authHelper.login(testUsers.staff);
    });

    test('complete CRUD operations', async ({ page }) => {
      // CREATE
      const uniqueApplicant = {
        ...testApplicant,
        email: `test-${Date.now()}@example.com`,
        first_name: 'Unique',
        last_name: 'Tester'
      };
      await applicantHelper.createApplicant(uniqueApplicant);
      
      // READ - List
      await page.goto('/dashboard/applicants');
      await expect(page.locator(`text="${uniqueApplicant.first_name} ${uniqueApplicant.last_name}"`)).toBeVisible();
      
      // READ - Detail
      await applicantHelper.viewApplicantDetails(`${uniqueApplicant.first_name} ${uniqueApplicant.last_name}`);
      await expect(page.locator('text="Personal Information"')).toBeVisible();
      await expect(page.locator(`text="${uniqueApplicant.email}"`)).toBeVisible();
      
      // UPDATE
      const applicantId = page.url().match(/applicants\/(\d+)/)?.[1];
      await applicantHelper.editApplicant(applicantId!, {
        phone: '555-9999',
        max_rent: 2500,
        additional_notes: 'Updated via test'
      });
      
      // Verify update
      await page.goto(`/dashboard/applicants/${applicantId}`);
      await expect(page.locator('text="555-9999"')).toBeVisible();
      await expect(page.locator('text="$2,500"')).toBeVisible();
      
      // DELETE
      await applicantHelper.deleteApplicant(`${uniqueApplicant.first_name} ${uniqueApplicant.last_name}`);
    });

    test('search and filter functionality', async ({ page }) => {
      // Create test applicants
      const applicants = [
        { ...testApplicant, first_name: 'Search', last_name: 'TestOne', email: 'search1@test.com' },
        { ...testApplicant, first_name: 'Search', last_name: 'TestTwo', email: 'search2@test.com' },
        { ...testApplicant, first_name: 'Filter', last_name: 'TestThree', email: 'filter3@test.com' }
      ];
      
      for (const applicant of applicants) {
        await applicantHelper.createApplicant(applicant);
      }
      
      // Test search
      await applicantHelper.searchApplicant('Search');
      await expect(page.locator('text="Search TestOne"')).toBeVisible();
      await expect(page.locator('text="Search TestTwo"')).toBeVisible();
      await expect(page.locator('text="Filter TestThree"')).not.toBeVisible();
      
      // Test filters
      await page.click('button:has-text("Filters")');
      await page.selectOption('select[name="income_range"]', '40000-60000');
      await page.selectOption('select[name="household_size"]', '3');
      await page.click('button:has-text("Apply Filters")');
      
      // Verify filtered results
      await page.waitForTimeout(500);
      const rowCount = await page.locator('tbody tr').count();
      expect(rowCount).toBeGreaterThan(0);
    });

    test('bulk operations', async ({ page }) => {
      await page.goto('/dashboard/applicants');
      
      // Select multiple applicants
      await page.check('input[type="checkbox"]:nth-of-type(1)');
      await page.check('input[type="checkbox"]:nth-of-type(2)');
      await page.check('input[type="checkbox"]:nth-of-type(3)');
      
      // Perform bulk action
      await page.click('button:has-text("Bulk Actions")');
      await page.click('button:has-text("Export Selected")');
      
      // Verify export started
      await expect(page.locator('.toast-success')).toContainText('Export started');
    });
  });

  test.describe('Project Management', () => {
    test.beforeEach(async ({ page }) => {
      await authHelper.login(testUsers.developer);
    });

    test('create and edit project with all details', async ({ page }) => {
      // Create project
      const uniqueProject = {
        ...testProject,
        name: `Test Project ${Date.now()}`
      };
      await projectHelper.createProject(uniqueProject);
      
      // View project
      await projectHelper.viewProject(uniqueProject.name);
      
      // Edit project
      await page.click('a:has-text("Edit Project")');
      await page.fill('input[name="available_units"]', '30');
      await page.fill('textarea[name="description"]', 'Updated description with new amenities');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('.toast-success')).toBeVisible();
      
      // Verify changes
      await page.reload();
      await expect(page.locator('text="30 units available"')).toBeVisible();
      await expect(page.locator('text="Updated description"')).toBeVisible();
    });

    test('project visibility and publishing', async ({ page }) => {
      // Create draft project
      await page.goto('/dashboard/projects/new');
      await page.fill('input[name="name"]', 'Draft Project');
      await page.fill('textarea[name="description"]', 'This is a draft');
      await page.uncheck('input[name="is_published"]');
      await page.click('button[type="submit"]');
      
      // Verify draft status
      await page.goto('/dashboard/projects');
      await expect(page.locator('tr:has-text("Draft Project") .badge:has-text("Draft")')).toBeVisible();
      
      // Publish project
      await page.click('text="Draft Project"');
      await page.click('button:has-text("Publish Project")');
      await page.click('button:has-text("Confirm")');
      await expect(page.locator('.toast-success')).toContainText('published');
      
      // Verify published status
      await page.goto('/dashboard/projects');
      await expect(page.locator('tr:has-text("Draft Project") .badge:has-text("Published")')).toBeVisible();
    });
  });

  test.describe('Application Process', () => {
    test('complete application workflow', async ({ page }) => {
      // 1. Applicant submits application
      await authHelper.login(testUsers.applicant);
      
      // Search for projects
      await page.goto('/dashboard/search');
      await page.fill('input[name="location"]', 'San Francisco');
      await page.click('button:has-text("Search")');
      
      // Select and apply to first project
      const projectCard = page.locator('.project-card').first();
      if (await projectCard.isVisible()) {
        await projectCard.click();
        
        // Fill application
        await page.click('button:has-text("Apply Now")');
        await page.fill('textarea[name="why_interested"]', 'Perfect location for my family');
        await page.fill('textarea[name="additional_info"]', 'Stable employment for 5 years');
        
        // Upload required documents
        await fileHelper.uploadFile('input[name="income_proof"]', 'income.pdf', 'Income verification');
        await fileHelper.uploadFile('input[name="id_proof"]', 'id.pdf', 'ID verification');
        
        await page.click('button:has-text("Submit Application")');
        await expect(page.locator('.toast-success')).toContainText('Application submitted');
        
        // Note application ID
        const appId = await page.locator('[data-testid="application-id"]').textContent();
        
        await authHelper.logout();
        
        // 2. Staff reviews application
        await authHelper.login(testUsers.staff);
        await page.goto('/dashboard/applications');
        
        // Find and open application
        await page.click(`tr:has-text("${appId}")`);
        
        // Verify documents
        await page.click('tab:has-text("Documents")');
        await expect(page.locator('text="income.pdf"')).toBeVisible();
        await expect(page.locator('text="id.pdf"')).toBeVisible();
        
        // Add notes
        await page.fill('textarea[name="staff_notes"]', 'All documents verified. Income meets requirements.');
        await page.click('button:has-text("Save Notes")');
        
        // Mark as reviewed
        await page.click('button:has-text("Mark as Reviewed")');
        await expect(page.locator('.toast-success')).toBeVisible();
        
        await authHelper.logout();
        
        // 3. Manager approves application
        await authHelper.login(testUsers.manager);
        await page.goto('/dashboard/applications/pending-approval');
        
        // Find reviewed application
        await page.click(`tr:has-text("${appId}")`);
        
        // Review staff notes
        await expect(page.locator('text="All documents verified"')).toBeVisible();
        
        // Approve
        await page.click('button:has-text("Approve Application")');
        await page.fill('textarea[name="approval_notes"]', 'Approved for unit 2B');
        await page.click('button:has-text("Confirm Approval")');
        await expect(page.locator('.toast-success')).toContainText('approved');
        
        await authHelper.logout();
        
        // 4. Applicant checks status
        await authHelper.login(testUsers.applicant);
        await page.goto('/dashboard/applications');
        
        // Verify approved status
        await expect(page.locator(`tr:has-text("${appId}") .badge:has-text("Approved")`)).toBeVisible();
        
        // View approval details
        await page.click(`tr:has-text("${appId}")`);
        await expect(page.locator('text="Approved for unit 2B"')).toBeVisible();
      }
    });
  });

  test.describe('File Management', () => {
    test.beforeEach(async ({ page }) => {
      await authHelper.login(testUsers.staff);
    });

    test('upload and download documents', async ({ page }) => {
      await page.goto('/dashboard/documents');
      
      // Upload various file types
      const testFiles = [
        { name: 'test.pdf', type: 'application/pdf', content: 'PDF content' },
        { name: 'test.jpg', type: 'image/jpeg', content: 'JPEG content' },
        { name: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content: 'DOCX content' }
      ];
      
      for (const file of testFiles) {
        await page.click('button:has-text("Upload Document")');
        await fileHelper.uploadFile('input[type="file"]', file.name, file.content);
        await page.selectOption('select[name="document_type"]', 'other');
        await page.click('button:has-text("Upload")');
        await expect(page.locator('.toast-success')).toBeVisible();
      }
      
      // Verify files are listed
      for (const file of testFiles) {
        await expect(page.locator(`text="${file.name}"`)).toBeVisible();
      }
      
      // Download and verify
      const downloadContent = await fileHelper.downloadFile('tr:has-text("test.pdf") button:has-text("Download")');
      expect(downloadContent).toBeTruthy();
    });

    test('file encryption verification', async ({ page }) => {
      await page.goto('/dashboard/documents/upload');
      await fileHelper.verifyFileEncryption('input[type="file"]');
    });
  });

  test.describe('Communication Features', () => {
    test('email notifications workflow', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Send notification to applicant
      await page.goto('/dashboard/communications');
      await page.click('button:has-text("New Message")');
      
      // Select template
      await page.selectOption('select[name="template"]', 'application_update');
      
      // Customize message
      await page.fill('input[name="recipient"]', 'applicant@test.com');
      await page.fill('input[name="subject"]', 'Application Status Update');
      const message = await page.locator('textarea[name="message"]').inputValue();
      await page.fill('textarea[name="message"]', message.replace('[NAME]', 'John Doe'));
      
      // Send
      await page.click('button:has-text("Send Message")');
      await expect(page.locator('.toast-success')).toContainText('Message sent');
      
      // Verify in sent messages
      await page.click('tab:has-text("Sent")');
      await expect(page.locator('text="Application Status Update"')).toBeVisible();
    });

    test('in-app notifications', async ({ page }) => {
      await authHelper.login(testUsers.applicant);
      
      // Check notification bell
      const notificationCount = await page.locator('[data-testid="notification-count"]').textContent();
      
      // Open notifications
      await page.click('[data-testid="notification-bell"]');
      await expect(page.locator('.notification-dropdown')).toBeVisible();
      
      // Mark as read
      await page.click('.notification-item:first-child button:has-text("Mark as read")');
      
      // Verify count updated
      const newCount = await page.locator('[data-testid="notification-count"]').textContent();
      expect(parseInt(newCount || '0')).toBeLessThan(parseInt(notificationCount || '0'));
    });
  });
});