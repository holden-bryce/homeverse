# Test info

- Name: Security Feature Validation >> Role-Based Access Control >> verify role restrictions are enforced
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/03-security-features.spec.ts:140:9

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
   40 |       await expect(page.locator('.alert-danger')).toContainText(/Too many attempts|Rate limit/i);
   41 |     });
   42 |
   43 |     test('API endpoint rate limiting', async ({ page }) => {
   44 |       await authHelper.login(testUsers.staff);
   45 |       
   46 |       // Make multiple rapid API calls
   47 |       const promises = [];
   48 |       for (let i = 0; i < 20; i++) {
   49 |         promises.push(
   50 |           page.evaluate(async () => {
   51 |             const response = await fetch('/api/applicants', {
   52 |               headers: {
   53 |                 'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
   54 |               }
   55 |             });
   56 |             return response.status;
   57 |           })
   58 |         );
   59 |       }
   60 |
   61 |       const results = await Promise.all(promises);
   62 |       
   63 |       // Some requests should be rate limited (429 status)
   64 |       const rateLimited = results.filter(status => status === 429);
   65 |       expect(rateLimited.length).toBeGreaterThan(0);
   66 |     });
   67 |   });
   68 |
   69 |   test.describe('PII Encryption', () => {
   70 |     test('verify PII data is encrypted in transit', async ({ page }) => {
   71 |       await authHelper.login(testUsers.staff);
   72 |       
   73 |       // Monitor network requests
   74 |       const requests: any[] = [];
   75 |       page.on('request', request => {
   76 |         if (request.url().includes('/api/')) {
   77 |           requests.push({
   78 |             url: request.url(),
   79 |             method: request.method(),
   80 |             postData: request.postData()
   81 |           });
   82 |         }
   83 |       });
   84 |
   85 |       // Create applicant with PII
   86 |       await page.goto('/dashboard/applicants/new');
   87 |       await page.fill('input[name="first_name"]', 'John');
   88 |       await page.fill('input[name="last_name"]', 'Doe');
   89 |       await page.fill('input[name="ssn_last_four"]', '1234');
   90 |       await page.fill('input[name="date_of_birth"]', '1990-01-01');
   91 |       await page.click('button[type="submit"]');
   92 |
   93 |       // Check that SSN is not sent in plain text
   94 |       const createRequest = requests.find(r => r.method === 'POST' && r.url.includes('/applicants'));
   95 |       expect(createRequest).toBeDefined();
   96 |       expect(createRequest.postData).not.toContain('1234'); // SSN should be encrypted
   97 |     });
   98 |
   99 |     test('verify PII is masked in UI', async ({ page }) => {
  100 |       await authHelper.login(testUsers.staff);
  101 |       
  102 |       // View applicant details
  103 |       await page.goto('/dashboard/applicants');
  104 |       await page.click('tbody tr:first-child');
  105 |       
  106 |       // Check SSN is masked
  107 |       const ssnElement = await page.locator('[data-testid="ssn-display"]');
  108 |       if (await ssnElement.isVisible()) {
  109 |         const ssnText = await ssnElement.textContent();
  110 |         expect(ssnText).toMatch(/\*{3,}[0-9]{4}$/); // Should show ***1234 format
  111 |       }
  112 |       
  113 |       // Check other PII has show/hide toggle
  114 |       const showPIIButton = page.locator('button:has-text("Show PII")');
  115 |       if (await showPIIButton.isVisible()) {
  116 |         // PII should be hidden by default
  117 |         const dobElement = await page.locator('[data-testid="dob-display"]');
  118 |         expect(await dobElement.textContent()).toMatch(/\*{6,}/);
  119 |         
  120 |         // Click to show PII
  121 |         await showPIIButton.click();
  122 |         
  123 |         // Verify audit log entry is created
  124 |         await page.waitForTimeout(1000);
  125 |         const auditResponse = await page.evaluate(async () => {
  126 |           const response = await fetch('/api/audit-logs/recent', {
  127 |             headers: {
  128 |               'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
  129 |             }
  130 |           });
  131 |           return response.json();
  132 |         });
  133 |         
  134 |         expect(auditResponse.some((log: any) => log.action === 'view_pii')).toBeTruthy();
  135 |       }
  136 |     });
  137 |   });
  138 |
  139 |   test.describe('Role-Based Access Control', () => {
> 140 |     test('verify role restrictions are enforced', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  141 |       const roleTests = [
  142 |         {
  143 |           user: testUsers.applicant,
  144 |           allowedPaths: ['/dashboard', '/dashboard/search', '/dashboard/applications', '/dashboard/profile'],
  145 |           deniedPaths: ['/dashboard/applicants', '/dashboard/admin', '/dashboard/reports']
  146 |         },
  147 |         {
  148 |           user: testUsers.staff,
  149 |           allowedPaths: ['/dashboard', '/dashboard/applicants', '/dashboard/documents'],
  150 |           deniedPaths: ['/dashboard/admin', '/dashboard/settings/company']
  151 |         },
  152 |         {
  153 |           user: testUsers.manager,
  154 |           allowedPaths: ['/dashboard', '/dashboard/applicants', '/dashboard/reports', '/dashboard/analytics'],
  155 |           deniedPaths: ['/dashboard/admin']
  156 |         }
  157 |       ];
  158 |
  159 |       for (const roleTest of roleTests) {
  160 |         // Login as user
  161 |         await authHelper.login(roleTest.user);
  162 |         
  163 |         // Test allowed paths
  164 |         for (const path of roleTest.allowedPaths) {
  165 |           await page.goto(path);
  166 |           await expect(page).not.toHaveURL('/403');
  167 |           await expect(page.locator('text=/Access Denied|Unauthorized/')).not.toBeVisible();
  168 |         }
  169 |         
  170 |         // Test denied paths
  171 |         for (const path of roleTest.deniedPaths) {
  172 |           await page.goto(path);
  173 |           const url = page.url();
  174 |           expect(url).toMatch(/403|login|dashboard$/); // Should redirect or show 403
  175 |         }
  176 |         
  177 |         await authHelper.logout();
  178 |       }
  179 |     });
  180 |
  181 |     test('verify API endpoint authorization', async ({ page }) => {
  182 |       // Test staff cannot access admin endpoints
  183 |       await authHelper.login(testUsers.staff);
  184 |       
  185 |       const adminResponse = await page.evaluate(async () => {
  186 |         const response = await fetch('/api/admin/users', {
  187 |           headers: {
  188 |             'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
  189 |           }
  190 |         });
  191 |         return {
  192 |           status: response.status,
  193 |           statusText: response.statusText
  194 |         };
  195 |       });
  196 |       
  197 |       expect(adminResponse.status).toBe(403);
  198 |       
  199 |       // Test applicant cannot access staff endpoints
  200 |       await authHelper.logout();
  201 |       await authHelper.login(testUsers.applicant);
  202 |       
  203 |       const staffResponse = await page.evaluate(async () => {
  204 |         const response = await fetch('/api/applicants/all', {
  205 |           headers: {
  206 |             'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
  207 |           }
  208 |         });
  209 |         return {
  210 |           status: response.status,
  211 |           statusText: response.statusText
  212 |         };
  213 |       });
  214 |       
  215 |       expect(staffResponse.status).toBe(403);
  216 |     });
  217 |   });
  218 |
  219 |   test.describe('CORS Configuration', () => {
  220 |     test('verify CORS headers are properly set', async ({ page }) => {
  221 |       const response = await page.request.get('http://localhost:8000/api/health', {
  222 |         headers: {
  223 |           'Origin': 'http://localhost:3000'
  224 |         }
  225 |       });
  226 |       
  227 |       const headers = response.headers();
  228 |       expect(headers['access-control-allow-origin']).toBe('http://localhost:3000');
  229 |       expect(headers['access-control-allow-credentials']).toBe('true');
  230 |     });
  231 |
  232 |     test('verify CORS blocks unauthorized origins', async ({ page }) => {
  233 |       const response = await page.request.get('http://localhost:8000/api/health', {
  234 |         headers: {
  235 |           'Origin': 'http://malicious-site.com'
  236 |         },
  237 |         failOnStatusCode: false
  238 |       });
  239 |       
  240 |       const headers = response.headers();
```