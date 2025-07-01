# Test info

- Name: Core Feature Workflows >> Authentication Flow >> password reset flow
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/02-core-features.spec.ts:57:9

# Error details

```
Error: page.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('a:has-text("Forgot password")')

    at /mnt/c/Users/12486/homeverse/frontend/tests/e2e/02-core-features.spec.ts:60:18
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { testUsers, testApplicant, testProject } from '../fixtures/users';
   3 | import { AuthHelper } from '../helpers/auth.helper';
   4 | import { ApplicantHelper } from '../helpers/applicant.helper';
   5 | import { ProjectHelper } from '../helpers/project.helper';
   6 | import { FileHelper } from '../helpers/file.helper';
   7 |
   8 | test.describe('Core Feature Workflows', () => {
   9 |   let authHelper: AuthHelper;
   10 |   let applicantHelper: ApplicantHelper;
   11 |   let projectHelper: ProjectHelper;
   12 |   let fileHelper: FileHelper;
   13 |
   14 |   test.beforeEach(async ({ page }) => {
   15 |     authHelper = new AuthHelper(page);
   16 |     applicantHelper = new ApplicantHelper(page);
   17 |     projectHelper = new ProjectHelper(page);
   18 |     fileHelper = new FileHelper(page);
   19 |   });
   20 |
   21 |   test.describe('Authentication Flow', () => {
   22 |     test('complete registration with email verification', async ({ page }) => {
   23 |       // 1. Navigate to registration
   24 |       await page.goto('/register');
   25 |       
   26 |       // 2. Fill registration form
   27 |       await page.fill('input[name="name"]', 'Test User');
   28 |       await page.fill('input[name="email"]', 'testuser@example.com');
   29 |       await page.fill('input[name="password"]', 'SecurePass123!');
   30 |       await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
   31 |       await page.selectOption('select[name="role"]', 'applicant');
   32 |       
   33 |       // 3. Accept terms
   34 |       await page.check('input[name="acceptTerms"]');
   35 |       
   36 |       // 4. Submit registration
   37 |       await page.click('button[type="submit"]');
   38 |       
   39 |       // 5. Verify email sent message
   40 |       await expect(page.locator('.alert-info')).toContainText('verification email');
   41 |       
   42 |       // 6. Simulate email verification (in real test, would click link in email)
   43 |       await page.goto('/verify-email?token=test-verification-token');
   44 |       await expect(page.locator('.alert-success')).toContainText('Email verified');
   45 |       
   46 |       // 7. Login with new credentials
   47 |       await page.goto('/login');
   48 |       await page.fill('input[name="email"]', 'testuser@example.com');
   49 |       await page.fill('input[name="password"]', 'SecurePass123!');
   50 |       await page.click('button[type="submit"]');
   51 |       
   52 |       // 8. Verify redirect to dashboard
   53 |       await page.waitForURL('/dashboard');
   54 |       await expect(page.locator('h1')).toContainText('Dashboard');
   55 |     });
   56 |
   57 |     test('password reset flow', async ({ page }) => {
   58 |       // 1. Go to login and click forgot password
   59 |       await page.goto('/login');
>  60 |       await page.click('a:has-text("Forgot password")');
      |                  ^ Error: page.click: Target page, context or browser has been closed
   61 |       
   62 |       // 2. Enter email
   63 |       await page.fill('input[name="email"]', 'developer@test.com');
   64 |       await page.click('button:has-text("Send Reset Link")');
   65 |       
   66 |       // 3. Verify success message
   67 |       await expect(page.locator('.alert-success')).toContainText('reset link');
   68 |       
   69 |       // 4. Simulate clicking reset link
   70 |       await page.goto('/reset-password?token=test-reset-token');
   71 |       
   72 |       // 5. Enter new password
   73 |       await page.fill('input[name="password"]', 'NewSecurePass123!');
   74 |       await page.fill('input[name="confirmPassword"]', 'NewSecurePass123!');
   75 |       await page.click('button:has-text("Reset Password")');
   76 |       
   77 |       // 6. Verify success and redirect
   78 |       await expect(page.locator('.alert-success')).toContainText('Password reset successful');
   79 |       await page.waitForURL('/login');
   80 |     });
   81 |
   82 |     test('session management and timeout', async ({ page, context }) => {
   83 |       // 1. Login
   84 |       await authHelper.login(testUsers.developer);
   85 |       
   86 |       // 2. Verify active session
   87 |       await page.goto('/dashboard');
   88 |       await expect(page.locator('h1')).toContainText('Dashboard');
   89 |       
   90 |       // 3. Simulate session timeout by clearing cookies
   91 |       await context.clearCookies();
   92 |       
   93 |       // 4. Try to access protected page
   94 |       await page.goto('/dashboard/projects');
   95 |       
   96 |       // 5. Verify redirect to login
   97 |       await page.waitForURL('/login');
   98 |       await expect(page.locator('.alert-warning')).toContainText('session expired');
   99 |     });
  100 |   });
  101 |
  102 |   test.describe('Applicant Management', () => {
  103 |     test.beforeEach(async ({ page }) => {
  104 |       await authHelper.login(testUsers.staff);
  105 |     });
  106 |
  107 |     test('complete CRUD operations', async ({ page }) => {
  108 |       // CREATE
  109 |       const uniqueApplicant = {
  110 |         ...testApplicant,
  111 |         email: `test-${Date.now()}@example.com`,
  112 |         first_name: 'Unique',
  113 |         last_name: 'Tester'
  114 |       };
  115 |       await applicantHelper.createApplicant(uniqueApplicant);
  116 |       
  117 |       // READ - List
  118 |       await page.goto('/dashboard/applicants');
  119 |       await expect(page.locator(`text="${uniqueApplicant.first_name} ${uniqueApplicant.last_name}"`)).toBeVisible();
  120 |       
  121 |       // READ - Detail
  122 |       await applicantHelper.viewApplicantDetails(`${uniqueApplicant.first_name} ${uniqueApplicant.last_name}`);
  123 |       await expect(page.locator('text="Personal Information"')).toBeVisible();
  124 |       await expect(page.locator(`text="${uniqueApplicant.email}"`)).toBeVisible();
  125 |       
  126 |       // UPDATE
  127 |       const applicantId = page.url().match(/applicants\/(\d+)/)?.[1];
  128 |       await applicantHelper.editApplicant(applicantId!, {
  129 |         phone: '555-9999',
  130 |         max_rent: 2500,
  131 |         additional_notes: 'Updated via test'
  132 |       });
  133 |       
  134 |       // Verify update
  135 |       await page.goto(`/dashboard/applicants/${applicantId}`);
  136 |       await expect(page.locator('text="555-9999"')).toBeVisible();
  137 |       await expect(page.locator('text="$2,500"')).toBeVisible();
  138 |       
  139 |       // DELETE
  140 |       await applicantHelper.deleteApplicant(`${uniqueApplicant.first_name} ${uniqueApplicant.last_name}`);
  141 |     });
  142 |
  143 |     test('search and filter functionality', async ({ page }) => {
  144 |       // Create test applicants
  145 |       const applicants = [
  146 |         { ...testApplicant, first_name: 'Search', last_name: 'TestOne', email: 'search1@test.com' },
  147 |         { ...testApplicant, first_name: 'Search', last_name: 'TestTwo', email: 'search2@test.com' },
  148 |         { ...testApplicant, first_name: 'Filter', last_name: 'TestThree', email: 'filter3@test.com' }
  149 |       ];
  150 |       
  151 |       for (const applicant of applicants) {
  152 |         await applicantHelper.createApplicant(applicant);
  153 |       }
  154 |       
  155 |       // Test search
  156 |       await applicantHelper.searchApplicant('Search');
  157 |       await expect(page.locator('text="Search TestOne"')).toBeVisible();
  158 |       await expect(page.locator('text="Search TestTwo"')).toBeVisible();
  159 |       await expect(page.locator('text="Filter TestThree"')).not.toBeVisible();
  160 |       
```