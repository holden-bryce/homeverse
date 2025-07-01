# Test info

- Name: Multi-Role User Journeys >> Company Admin Journey >> complete company admin workflow
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/01-user-journeys.spec.ts:63:9

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Please install them with the following command:      ║
║                                                      ║
║     sudo npx playwright install-deps                 ║
║                                                      ║
║ Alternatively, use apt:                              ║
║     sudo apt-get install libnss3\                    ║
║         libnspr4                                     ║
║                                                      ║
║ <3 Playwright Team                                   ║
╚══════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { testUsers, testApplicant, testProject } from '../fixtures/users';
   3 | import { AuthHelper } from '../helpers/auth.helper';
   4 | import { ApplicantHelper } from '../helpers/applicant.helper';
   5 | import { ProjectHelper } from '../helpers/project.helper';
   6 |
   7 | test.describe('Multi-Role User Journeys', () => {
   8 |   let authHelper: AuthHelper;
   9 |   let applicantHelper: ApplicantHelper;
   10 |   let projectHelper: ProjectHelper;
   11 |
   12 |   test.beforeEach(async ({ page }) => {
   13 |     authHelper = new AuthHelper(page);
   14 |     applicantHelper = new ApplicantHelper(page);
   15 |     projectHelper = new ProjectHelper(page);
   16 |   });
   17 |
   18 |   test.describe('Super Admin Journey', () => {
   19 |     test('complete super admin workflow', async ({ page }) => {
   20 |       // 1. Login as super admin
   21 |       await authHelper.login(testUsers.superAdmin);
   22 |       await authHelper.verifyRole('super_admin');
   23 |
   24 |       // 2. Create a new company
   25 |       await page.goto('/dashboard/admin/companies/new');
   26 |       await page.fill('input[name="name"]', 'Test Housing Corp');
   27 |       await page.fill('input[name="company_key"]', 'test-housing-corp');
   28 |       await page.selectOption('select[name="plan"]', 'professional');
   29 |       await page.fill('input[name="max_users"]', '20');
   30 |       await page.click('button[type="submit"]');
   31 |       await expect(page.locator('.toast-success')).toBeVisible();
   32 |
   33 |       // 3. Create company admin user
   34 |       await page.goto('/dashboard/admin/users/new');
   35 |       await page.fill('input[name="name"]', 'Test Company Admin');
   36 |       await page.fill('input[name="email"]', 'admin@test-housing.com');
   37 |       await page.selectOption('select[name="role"]', 'company_admin');
   38 |       await page.selectOption('select[name="company"]', 'Test Housing Corp');
   39 |       await page.click('button[type="submit"]');
   40 |       await expect(page.locator('.toast-success')).toBeVisible();
   41 |
   42 |       // 4. View system analytics
   43 |       await page.goto('/dashboard/admin/analytics');
   44 |       await expect(page.locator('h1:has-text("System Analytics")')).toBeVisible();
   45 |       await expect(page.locator('[data-testid="total-companies"]')).toBeVisible();
   46 |       await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
   47 |       await expect(page.locator('[data-testid="total-applicants"]')).toBeVisible();
   48 |
   49 |       // 5. Configure system settings
   50 |       await page.goto('/dashboard/admin/settings');
   51 |       await page.click('text="Security Settings"');
   52 |       await page.check('input[name="enforce_2fa"]');
   53 |       await page.fill('input[name="session_timeout"]', '30');
   54 |       await page.click('button:has-text("Save Settings")');
   55 |       await expect(page.locator('.toast-success')).toBeVisible();
   56 |
   57 |       // 6. Logout
   58 |       await authHelper.logout();
   59 |     });
   60 |   });
   61 |
   62 |   test.describe('Company Admin Journey', () => {
>  63 |     test('complete company admin workflow', async ({ page }) => {
      |         ^ Error: browserType.launch: 
   64 |       // 1. Login as company admin
   65 |       await authHelper.login(testUsers.companyAdmin);
   66 |       await authHelper.verifyRole('company_admin');
   67 |
   68 |       // 2. Set up company profile
   69 |       await page.goto('/dashboard/settings/company');
   70 |       await page.fill('textarea[name="description"]', 'Leading affordable housing developer');
   71 |       await page.fill('input[name="website"]', 'https://homeverse-test.com');
   72 |       await page.fill('input[name="phone"]', '555-0200');
   73 |       await page.click('button:has-text("Save Company Info")');
   74 |       await expect(page.locator('.toast-success')).toBeVisible();
   75 |
   76 |       // 3. Create team members
   77 |       const teamMembers = [
   78 |         { name: 'John Manager', email: 'john@homeverse-test.com', role: 'manager' },
   79 |         { name: 'Jane Staff', email: 'jane@homeverse-test.com', role: 'staff' },
   80 |       ];
   81 |
   82 |       for (const member of teamMembers) {
   83 |         await page.goto('/dashboard/team/new');
   84 |         await page.fill('input[name="name"]', member.name);
   85 |         await page.fill('input[name="email"]', member.email);
   86 |         await page.selectOption('select[name="role"]', member.role);
   87 |         await page.click('button[type="submit"]');
   88 |         await expect(page.locator('.toast-success')).toBeVisible();
   89 |       }
   90 |
   91 |       // 4. Configure permissions
   92 |       await page.goto('/dashboard/settings/permissions');
   93 |       await page.check('input[name="manager_can_approve"]');
   94 |       await page.check('input[name="staff_can_edit"]');
   95 |       await page.click('button:has-text("Update Permissions")');
   96 |       await expect(page.locator('.toast-success')).toBeVisible();
   97 |
   98 |       // 5. View company dashboard
   99 |       await page.goto('/dashboard');
  100 |       await expect(page.locator('[data-testid="company-overview"]')).toBeVisible();
  101 |       await expect(page.locator('[data-testid="team-summary"]')).toBeVisible();
  102 |
  103 |       // 6. Logout
  104 |       await authHelper.logout();
  105 |     });
  106 |   });
  107 |
  108 |   test.describe('Manager Journey', () => {
  109 |     test('complete manager workflow', async ({ page }) => {
  110 |       // 1. Login as manager
  111 |       await authHelper.login(testUsers.manager);
  112 |       await authHelper.verifyRole('manager');
  113 |
  114 |       // 2. Create a new project
  115 |       await projectHelper.createProject(testProject);
  116 |
  117 |       // 3. Review pending applications
  118 |       await page.goto('/dashboard/applications');
  119 |       await page.selectOption('select[name="status"]', 'pending');
  120 |       await page.click('button:has-text("Filter")');
  121 |
  122 |       // 4. Review and approve an application
  123 |       if (await page.locator('tbody tr').first().isVisible()) {
  124 |         await page.click('tbody tr:first-child');
  125 |         await page.click('button:has-text("Review Application")');
  126 |         
  127 |         // Add review notes
  128 |         await page.fill('textarea[name="review_notes"]', 'Meets all criteria. Recommended for approval.');
  129 |         await page.click('button:has-text("Approve")');
  130 |         await expect(page.locator('.toast-success')).toBeVisible();
  131 |       }
  132 |
  133 |       // 5. Generate reports
  134 |       await page.goto('/dashboard/reports');
  135 |       await page.click('button:has-text("Generate Monthly Report")');
  136 |       await expect(page.locator('.toast-success')).toContainText('Report generation started');
  137 |
  138 |       // 6. View team performance
  139 |       await page.goto('/dashboard/analytics/team');
  140 |       await expect(page.locator('[data-testid="team-metrics"]')).toBeVisible();
  141 |
  142 |       // 7. Logout
  143 |       await authHelper.logout();
  144 |     });
  145 |   });
  146 |
  147 |   test.describe('Staff Journey', () => {
  148 |     test('complete staff workflow', async ({ page }) => {
  149 |       // 1. Login as staff
  150 |       await authHelper.login(testUsers.staff);
  151 |       await authHelper.verifyRole('staff');
  152 |
  153 |       // 2. Create new applicant
  154 |       await applicantHelper.createApplicant(testApplicant);
  155 |
  156 |       // 3. Search and view applicant
  157 |       await applicantHelper.viewApplicantDetails('John Doe');
  158 |
  159 |       // 4. Update applicant information
  160 |       await page.click('a:has-text("Edit")');
  161 |       await page.fill('input[name="phone"]', '555-9999');
  162 |       await page.fill('textarea[name="additional_notes"]', 'Updated contact information');
  163 |       await page.click('button:has-text("Save Changes")');
```