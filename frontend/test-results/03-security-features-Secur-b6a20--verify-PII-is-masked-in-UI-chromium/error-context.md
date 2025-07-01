# Test info

- Name: Security Feature Validation >> PII Encryption >> verify PII is masked in UI
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/03-security-features.spec.ts:99:9

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
   2 | import { testUsers } from '../fixtures/users';
   3 | import { AuthHelper } from '../helpers/auth.helper';
   4 |
   5 | test.describe('Security Feature Validation', () => {
   6 |   let authHelper: AuthHelper;
   7 |
   8 |   test.beforeEach(async ({ page }) => {
   9 |     authHelper = new AuthHelper(page);
   10 |   });
   11 |
   12 |   test.describe('Rate Limiting', () => {
   13 |     test('login attempts rate limiting', async ({ page }) => {
   14 |       const invalidCredentials = {
   15 |         email: 'test@example.com',
   16 |         password: 'wrongpassword'
   17 |       };
   18 |
   19 |       // Attempt multiple failed logins
   20 |       for (let i = 0; i < 6; i++) {
   21 |         await page.goto('/login');
   22 |         await page.fill('input[name="email"]', invalidCredentials.email);
   23 |         await page.fill('input[name="password"]', invalidCredentials.password);
   24 |         await page.click('button[type="submit"]');
   25 |         
   26 |         if (i < 5) {
   27 |           // First 5 attempts should show invalid credentials
   28 |           await expect(page.locator('.alert-danger')).toContainText(/Invalid credentials/i);
   29 |         }
   30 |       }
   31 |
   32 |       // 6th attempt should be rate limited
   33 |       await expect(page.locator('.alert-danger')).toContainText(/Too many attempts|Rate limit/i);
   34 |       
   35 |       // Verify continued blocking
   36 |       await page.reload();
   37 |       await page.fill('input[name="email"]', invalidCredentials.email);
   38 |       await page.fill('input[name="password"]', invalidCredentials.password);
   39 |       await page.click('button[type="submit"]');
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
>  99 |     test('verify PII is masked in UI', async ({ page }) => {
      |         ^ Error: browserType.launch: 
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
  140 |     test('verify role restrictions are enforced', async ({ page }) => {
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
```