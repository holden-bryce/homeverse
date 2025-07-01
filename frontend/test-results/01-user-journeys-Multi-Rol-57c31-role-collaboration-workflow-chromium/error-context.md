# Test info

- Name: Multi-Role User Journeys >> cross-role collaboration workflow
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/01-user-journeys.spec.ts:262:7

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
  249 |
  250 |       // 8. Update preferences
  251 |       await page.goto('/dashboard/preferences');
  252 |       await page.check('input[name="email_notifications"]');
  253 |       await page.check('input[name="sms_notifications"]');
  254 |       await page.click('button:has-text("Save Preferences")');
  255 |       await expect(page.locator('.toast-success')).toBeVisible();
  256 |
  257 |       // 9. Logout
  258 |       await authHelper.logout();
  259 |     });
  260 |   });
  261 |
> 262 |   test('cross-role collaboration workflow', async ({ page }) => {
      |       ^ Error: browserType.launch: 
  263 |     // This test demonstrates how different roles interact
  264 |
  265 |     // 1. Staff creates applicant
  266 |     await authHelper.login(testUsers.staff);
  267 |     await applicantHelper.createApplicant({
  268 |       ...testApplicant,
  269 |       email: 'collab-test@example.com',
  270 |       first_name: 'Collab',
  271 |       last_name: 'Test'
  272 |     });
  273 |     await authHelper.logout();
  274 |
  275 |     // 2. Manager creates project
  276 |     await authHelper.login(testUsers.manager);
  277 |     await projectHelper.createProject({
  278 |       ...testProject,
  279 |       name: 'Collaboration Test Project'
  280 |     });
  281 |     await authHelper.logout();
  282 |
  283 |     // 3. Applicant applies to project
  284 |     await authHelper.login(testUsers.applicant);
  285 |     await projectHelper.applyToProject('Collaboration Test Project', {
  286 |       cover_letter: 'I am very interested in this property.'
  287 |     });
  288 |     await authHelper.logout();
  289 |
  290 |     // 4. Manager reviews and approves
  291 |     await authHelper.login(testUsers.manager);
  292 |     await projectHelper.reviewApplications('Collaboration Test Project');
  293 |     await projectHelper.approveApplication('Test Applicant');
  294 |     await authHelper.logout();
  295 |
  296 |     // 5. Company admin views reports
  297 |     await authHelper.login(testUsers.companyAdmin);
  298 |     await page.goto('/dashboard/reports');
  299 |     await expect(page.locator('[data-testid="recent-approvals"]')).toBeVisible();
  300 |     await authHelper.logout();
  301 |   });
  302 | });
```