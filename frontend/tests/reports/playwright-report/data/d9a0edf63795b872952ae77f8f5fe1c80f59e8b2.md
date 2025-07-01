# Test info

- Name: Multi-Role User Journeys >> Staff Journey >> complete staff workflow
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/01-user-journeys.spec.ts:148:9

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
   63 |     test('complete company admin workflow', async ({ page }) => {
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
> 148 |     test('complete staff workflow', async ({ page }) => {
      |         ^ Error: browserType.launch: 
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
  164 |       await expect(page.locator('.toast-success')).toBeVisible();
  165 |
  166 |       // 5. Process documents
  167 |       await page.goto('/dashboard/documents');
  168 |       await page.click('button:has-text("Upload Document")');
  169 |       await page.setInputFiles('input[type="file"]', {
  170 |         name: 'income-verification.pdf',
  171 |         mimeType: 'application/pdf',
  172 |         buffer: Buffer.from('Income verification document')
  173 |       });
  174 |       await page.selectOption('select[name="document_type"]', 'income_verification');
  175 |       await page.click('button:has-text("Upload")');
  176 |       await expect(page.locator('.toast-success')).toBeVisible();
  177 |
  178 |       // 6. Send communication
  179 |       await page.goto('/dashboard/communications');
  180 |       await page.click('button:has-text("New Message")');
  181 |       await page.fill('input[name="recipient"]', 'john.doe@example.com');
  182 |       await page.fill('input[name="subject"]', 'Application Update');
  183 |       await page.fill('textarea[name="message"]', 'Your application has been received and is under review.');
  184 |       await page.click('button:has-text("Send")');
  185 |       await expect(page.locator('.toast-success')).toBeVisible();
  186 |
  187 |       // 7. Logout
  188 |       await authHelper.logout();
  189 |     });
  190 |   });
  191 |
  192 |   test.describe('Applicant Journey', () => {
  193 |     test('complete applicant workflow', async ({ page }) => {
  194 |       // 1. Register as new applicant
  195 |       await authHelper.register({
  196 |         name: 'New Applicant',
  197 |         email: 'newapplicant@test.com',
  198 |         password: 'Password123!',
  199 |         role: 'applicant'
  200 |       });
  201 |
  202 |       // 2. Login
  203 |       await authHelper.login({
  204 |         email: 'newapplicant@test.com',
  205 |         password: 'Password123!',
  206 |         role: 'applicant',
  207 |         name: 'New Applicant'
  208 |       });
  209 |
  210 |       // 3. Complete profile
  211 |       await page.goto('/dashboard/profile');
  212 |       await page.fill('input[name="phone"]', '555-1234');
  213 |       await page.fill('input[name="date_of_birth"]', '1985-06-15');
  214 |       await page.fill('input[name="annual_income"]', '45000');
  215 |       await page.fill('input[name="household_size"]', '2');
  216 |       await page.selectOption('select[name="employment_status"]', 'employed');
  217 |       await page.click('button:has-text("Save Profile")');
  218 |       await expect(page.locator('.toast-success')).toBeVisible();
  219 |
  220 |       // 4. Search for housing
  221 |       await page.goto('/dashboard/search');
  222 |       await page.fill('input[name="location"]', 'San Francisco');
  223 |       await page.fill('input[name="max_rent"]', '2000');
  224 |       await page.selectOption('select[name="bedrooms"]', '2');
  225 |       await page.click('button:has-text("Search")');
  226 |       
  227 |       // 5. View project details
  228 |       const firstProject = page.locator('.project-card').first();
  229 |       if (await firstProject.isVisible()) {
  230 |         await firstProject.click();
  231 |         await expect(page.locator('h1')).toBeVisible();
  232 |         
  233 |         // 6. Apply to project
  234 |         await page.click('button:has-text("Apply Now")');
  235 |         await page.fill('textarea[name="why_interested"]', 'This location is perfect for my commute.');
  236 |         await page.setInputFiles('input[name="income_docs"]', {
  237 |           name: 'paystub.pdf',
  238 |           mimeType: 'application/pdf',
  239 |           buffer: Buffer.from('Paystub document')
  240 |         });
  241 |         await page.click('button:has-text("Submit Application")');
  242 |         await expect(page.locator('.toast-success')).toBeVisible();
  243 |       }
  244 |
  245 |       // 7. Check application status
  246 |       await page.goto('/dashboard/applications');
  247 |       await expect(page.locator('table')).toBeVisible();
  248 |       await expect(page.locator('td:has-text("Pending")')).toBeVisible();
```