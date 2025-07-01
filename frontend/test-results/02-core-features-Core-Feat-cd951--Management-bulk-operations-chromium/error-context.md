# Test info

- Name: Core Feature Workflows >> Applicant Management >> bulk operations
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/02-core-features.spec.ts:173:9

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
  161 |       // Test filters
  162 |       await page.click('button:has-text("Filters")');
  163 |       await page.selectOption('select[name="income_range"]', '40000-60000');
  164 |       await page.selectOption('select[name="household_size"]', '3');
  165 |       await page.click('button:has-text("Apply Filters")');
  166 |       
  167 |       // Verify filtered results
  168 |       await page.waitForTimeout(500);
  169 |       const rowCount = await page.locator('tbody tr').count();
  170 |       expect(rowCount).toBeGreaterThan(0);
  171 |     });
  172 |
> 173 |     test('bulk operations', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  174 |       await page.goto('/dashboard/applicants');
  175 |       
  176 |       // Select multiple applicants
  177 |       await page.check('input[type="checkbox"]:nth-of-type(1)');
  178 |       await page.check('input[type="checkbox"]:nth-of-type(2)');
  179 |       await page.check('input[type="checkbox"]:nth-of-type(3)');
  180 |       
  181 |       // Perform bulk action
  182 |       await page.click('button:has-text("Bulk Actions")');
  183 |       await page.click('button:has-text("Export Selected")');
  184 |       
  185 |       // Verify export started
  186 |       await expect(page.locator('.toast-success')).toContainText('Export started');
  187 |     });
  188 |   });
  189 |
  190 |   test.describe('Project Management', () => {
  191 |     test.beforeEach(async ({ page }) => {
  192 |       await authHelper.login(testUsers.developer);
  193 |     });
  194 |
  195 |     test('create and edit project with all details', async ({ page }) => {
  196 |       // Create project
  197 |       const uniqueProject = {
  198 |         ...testProject,
  199 |         name: `Test Project ${Date.now()}`
  200 |       };
  201 |       await projectHelper.createProject(uniqueProject);
  202 |       
  203 |       // View project
  204 |       await projectHelper.viewProject(uniqueProject.name);
  205 |       
  206 |       // Edit project
  207 |       await page.click('a:has-text("Edit Project")');
  208 |       await page.fill('input[name="available_units"]', '30');
  209 |       await page.fill('textarea[name="description"]', 'Updated description with new amenities');
  210 |       await page.click('button:has-text("Save Changes")');
  211 |       await expect(page.locator('.toast-success')).toBeVisible();
  212 |       
  213 |       // Verify changes
  214 |       await page.reload();
  215 |       await expect(page.locator('text="30 units available"')).toBeVisible();
  216 |       await expect(page.locator('text="Updated description"')).toBeVisible();
  217 |     });
  218 |
  219 |     test('project visibility and publishing', async ({ page }) => {
  220 |       // Create draft project
  221 |       await page.goto('/dashboard/projects/new');
  222 |       await page.fill('input[name="name"]', 'Draft Project');
  223 |       await page.fill('textarea[name="description"]', 'This is a draft');
  224 |       await page.uncheck('input[name="is_published"]');
  225 |       await page.click('button[type="submit"]');
  226 |       
  227 |       // Verify draft status
  228 |       await page.goto('/dashboard/projects');
  229 |       await expect(page.locator('tr:has-text("Draft Project") .badge:has-text("Draft")')).toBeVisible();
  230 |       
  231 |       // Publish project
  232 |       await page.click('text="Draft Project"');
  233 |       await page.click('button:has-text("Publish Project")');
  234 |       await page.click('button:has-text("Confirm")');
  235 |       await expect(page.locator('.toast-success')).toContainText('published');
  236 |       
  237 |       // Verify published status
  238 |       await page.goto('/dashboard/projects');
  239 |       await expect(page.locator('tr:has-text("Draft Project") .badge:has-text("Published")')).toBeVisible();
  240 |     });
  241 |   });
  242 |
  243 |   test.describe('Application Process', () => {
  244 |     test('complete application workflow', async ({ page }) => {
  245 |       // 1. Applicant submits application
  246 |       await authHelper.login(testUsers.applicant);
  247 |       
  248 |       // Search for projects
  249 |       await page.goto('/dashboard/search');
  250 |       await page.fill('input[name="location"]', 'San Francisco');
  251 |       await page.click('button:has-text("Search")');
  252 |       
  253 |       // Select and apply to first project
  254 |       const projectCard = page.locator('.project-card').first();
  255 |       if (await projectCard.isVisible()) {
  256 |         await projectCard.click();
  257 |         
  258 |         // Fill application
  259 |         await page.click('button:has-text("Apply Now")');
  260 |         await page.fill('textarea[name="why_interested"]', 'Perfect location for my family');
  261 |         await page.fill('textarea[name="additional_info"]', 'Stable employment for 5 years');
  262 |         
  263 |         // Upload required documents
  264 |         await fileHelper.uploadFile('input[name="income_proof"]', 'income.pdf', 'Income verification');
  265 |         await fileHelper.uploadFile('input[name="id_proof"]', 'id.pdf', 'ID verification');
  266 |         
  267 |         await page.click('button:has-text("Submit Application")');
  268 |         await expect(page.locator('.toast-success')).toContainText('Application submitted');
  269 |         
  270 |         // Note application ID
  271 |         const appId = await page.locator('[data-testid="application-id"]').textContent();
  272 |         
  273 |         await authHelper.logout();
```