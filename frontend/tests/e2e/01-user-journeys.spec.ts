import { test, expect } from '@playwright/test';
import { testUsers, testApplicant, testProject } from '../fixtures/users';
import { AuthHelper } from '../helpers/auth.helper';
import { ApplicantHelper } from '../helpers/applicant.helper';
import { ProjectHelper } from '../helpers/project.helper';

test.describe('Multi-Role User Journeys', () => {
  let authHelper: AuthHelper;
  let applicantHelper: ApplicantHelper;
  let projectHelper: ProjectHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    applicantHelper = new ApplicantHelper(page);
    projectHelper = new ProjectHelper(page);
  });

  test.describe('Super Admin Journey', () => {
    test('complete super admin workflow', async ({ page }) => {
      // 1. Login as super admin
      await authHelper.login(testUsers.superAdmin);
      await authHelper.verifyRole('super_admin');

      // 2. Create a new company
      await page.goto('/dashboard/admin/companies/new');
      await page.fill('input[name="name"]', 'Test Housing Corp');
      await page.fill('input[name="company_key"]', 'test-housing-corp');
      await page.selectOption('select[name="plan"]', 'professional');
      await page.fill('input[name="max_users"]', '20');
      await page.click('button[type="submit"]');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 3. Create company admin user
      await page.goto('/dashboard/admin/users/new');
      await page.fill('input[name="name"]', 'Test Company Admin');
      await page.fill('input[name="email"]', 'admin@test-housing.com');
      await page.selectOption('select[name="role"]', 'company_admin');
      await page.selectOption('select[name="company"]', 'Test Housing Corp');
      await page.click('button[type="submit"]');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 4. View system analytics
      await page.goto('/dashboard/admin/analytics');
      await expect(page.locator('h1:has-text("System Analytics")')).toBeVisible();
      await expect(page.locator('[data-testid="total-companies"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-applicants"]')).toBeVisible();

      // 5. Configure system settings
      await page.goto('/dashboard/admin/settings');
      await page.click('text="Security Settings"');
      await page.check('input[name="enforce_2fa"]');
      await page.fill('input[name="session_timeout"]', '30');
      await page.click('button:has-text("Save Settings")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 6. Logout
      await authHelper.logout();
    });
  });

  test.describe('Company Admin Journey', () => {
    test('complete company admin workflow', async ({ page }) => {
      // 1. Login as company admin
      await authHelper.login(testUsers.companyAdmin);
      await authHelper.verifyRole('company_admin');

      // 2. Set up company profile
      await page.goto('/dashboard/settings/company');
      await page.fill('textarea[name="description"]', 'Leading affordable housing developer');
      await page.fill('input[name="website"]', 'https://homeverse-test.com');
      await page.fill('input[name="phone"]', '555-0200');
      await page.click('button:has-text("Save Company Info")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 3. Create team members
      const teamMembers = [
        { name: 'John Manager', email: 'john@homeverse-test.com', role: 'manager' },
        { name: 'Jane Staff', email: 'jane@homeverse-test.com', role: 'staff' },
      ];

      for (const member of teamMembers) {
        await page.goto('/dashboard/team/new');
        await page.fill('input[name="name"]', member.name);
        await page.fill('input[name="email"]', member.email);
        await page.selectOption('select[name="role"]', member.role);
        await page.click('button[type="submit"]');
        await expect(page.locator('.toast-success')).toBeVisible();
      }

      // 4. Configure permissions
      await page.goto('/dashboard/settings/permissions');
      await page.check('input[name="manager_can_approve"]');
      await page.check('input[name="staff_can_edit"]');
      await page.click('button:has-text("Update Permissions")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 5. View company dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="company-overview"]')).toBeVisible();
      await expect(page.locator('[data-testid="team-summary"]')).toBeVisible();

      // 6. Logout
      await authHelper.logout();
    });
  });

  test.describe('Manager Journey', () => {
    test('complete manager workflow', async ({ page }) => {
      // 1. Login as manager
      await authHelper.login(testUsers.manager);
      await authHelper.verifyRole('manager');

      // 2. Create a new project
      await projectHelper.createProject(testProject);

      // 3. Review pending applications
      await page.goto('/dashboard/applications');
      await page.selectOption('select[name="status"]', 'pending');
      await page.click('button:has-text("Filter")');

      // 4. Review and approve an application
      if (await page.locator('tbody tr').first().isVisible()) {
        await page.click('tbody tr:first-child');
        await page.click('button:has-text("Review Application")');
        
        // Add review notes
        await page.fill('textarea[name="review_notes"]', 'Meets all criteria. Recommended for approval.');
        await page.click('button:has-text("Approve")');
        await expect(page.locator('.toast-success')).toBeVisible();
      }

      // 5. Generate reports
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Generate Monthly Report")');
      await expect(page.locator('.toast-success')).toContainText('Report generation started');

      // 6. View team performance
      await page.goto('/dashboard/analytics/team');
      await expect(page.locator('[data-testid="team-metrics"]')).toBeVisible();

      // 7. Logout
      await authHelper.logout();
    });
  });

  test.describe('Staff Journey', () => {
    test('complete staff workflow', async ({ page }) => {
      // 1. Login as staff
      await authHelper.login(testUsers.staff);
      await authHelper.verifyRole('staff');

      // 2. Create new applicant
      await applicantHelper.createApplicant(testApplicant);

      // 3. Search and view applicant
      await applicantHelper.viewApplicantDetails('John Doe');

      // 4. Update applicant information
      await page.click('a:has-text("Edit")');
      await page.fill('input[name="phone"]', '555-9999');
      await page.fill('textarea[name="additional_notes"]', 'Updated contact information');
      await page.click('button:has-text("Save Changes")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 5. Process documents
      await page.goto('/dashboard/documents');
      await page.click('button:has-text("Upload Document")');
      await page.setInputFiles('input[type="file"]', {
        name: 'income-verification.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Income verification document')
      });
      await page.selectOption('select[name="document_type"]', 'income_verification');
      await page.click('button:has-text("Upload")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 6. Send communication
      await page.goto('/dashboard/communications');
      await page.click('button:has-text("New Message")');
      await page.fill('input[name="recipient"]', 'john.doe@example.com');
      await page.fill('input[name="subject"]', 'Application Update');
      await page.fill('textarea[name="message"]', 'Your application has been received and is under review.');
      await page.click('button:has-text("Send")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 7. Logout
      await authHelper.logout();
    });
  });

  test.describe('Applicant Journey', () => {
    test('complete applicant workflow', async ({ page }) => {
      // 1. Register as new applicant
      await authHelper.register({
        name: 'New Applicant',
        email: 'newapplicant@test.com',
        password: 'Password123!',
        role: 'applicant'
      });

      // 2. Login
      await authHelper.login({
        email: 'newapplicant@test.com',
        password: 'Password123!',
        role: 'applicant',
        name: 'New Applicant'
      });

      // 3. Complete profile
      await page.goto('/dashboard/profile');
      await page.fill('input[name="phone"]', '555-1234');
      await page.fill('input[name="date_of_birth"]', '1985-06-15');
      await page.fill('input[name="annual_income"]', '45000');
      await page.fill('input[name="household_size"]', '2');
      await page.selectOption('select[name="employment_status"]', 'employed');
      await page.click('button:has-text("Save Profile")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 4. Search for housing
      await page.goto('/dashboard/search');
      await page.fill('input[name="location"]', 'San Francisco');
      await page.fill('input[name="max_rent"]', '2000');
      await page.selectOption('select[name="bedrooms"]', '2');
      await page.click('button:has-text("Search")');
      
      // 5. View project details
      const firstProject = page.locator('.project-card').first();
      if (await firstProject.isVisible()) {
        await firstProject.click();
        await expect(page.locator('h1')).toBeVisible();
        
        // 6. Apply to project
        await page.click('button:has-text("Apply Now")');
        await page.fill('textarea[name="why_interested"]', 'This location is perfect for my commute.');
        await page.setInputFiles('input[name="income_docs"]', {
          name: 'paystub.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('Paystub document')
        });
        await page.click('button:has-text("Submit Application")');
        await expect(page.locator('.toast-success')).toBeVisible();
      }

      // 7. Check application status
      await page.goto('/dashboard/applications');
      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('td:has-text("Pending")')).toBeVisible();

      // 8. Update preferences
      await page.goto('/dashboard/preferences');
      await page.check('input[name="email_notifications"]');
      await page.check('input[name="sms_notifications"]');
      await page.click('button:has-text("Save Preferences")');
      await expect(page.locator('.toast-success')).toBeVisible();

      // 9. Logout
      await authHelper.logout();
    });
  });

  test('cross-role collaboration workflow', async ({ page }) => {
    // This test demonstrates how different roles interact

    // 1. Staff creates applicant
    await authHelper.login(testUsers.staff);
    await applicantHelper.createApplicant({
      ...testApplicant,
      email: 'collab-test@example.com',
      first_name: 'Collab',
      last_name: 'Test'
    });
    await authHelper.logout();

    // 2. Manager creates project
    await authHelper.login(testUsers.manager);
    await projectHelper.createProject({
      ...testProject,
      name: 'Collaboration Test Project'
    });
    await authHelper.logout();

    // 3. Applicant applies to project
    await authHelper.login(testUsers.applicant);
    await projectHelper.applyToProject('Collaboration Test Project', {
      cover_letter: 'I am very interested in this property.'
    });
    await authHelper.logout();

    // 4. Manager reviews and approves
    await authHelper.login(testUsers.manager);
    await projectHelper.reviewApplications('Collaboration Test Project');
    await projectHelper.approveApplication('Test Applicant');
    await authHelper.logout();

    // 5. Company admin views reports
    await authHelper.login(testUsers.companyAdmin);
    await page.goto('/dashboard/reports');
    await expect(page.locator('[data-testid="recent-approvals"]')).toBeVisible();
    await authHelper.logout();
  });
});