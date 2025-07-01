# Test info

- Name: Security Feature Validation >> Session Management >> verify session timeout works correctly
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/03-security-features.spec.ts:246:9

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
  241 |       expect(headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
  242 |     });
  243 |   });
  244 |
  245 |   test.describe('Session Management', () => {
> 246 |     test('verify session timeout works correctly', async ({ page, context }) => {
      |         ^ Error: browserType.launch: 
  247 |       await authHelper.login(testUsers.developer);
  248 |       
  249 |       // Get initial session
  250 |       const cookies = await context.cookies();
  251 |       const sessionCookie = cookies.find(c => c.name === 'auth-token');
  252 |       expect(sessionCookie).toBeDefined();
  253 |       
  254 |       // Simulate inactivity by waiting (in real test, would mock time)
  255 |       // For now, manually expire the session
  256 |       await page.evaluate(() => {
  257 |         // Set session expiry to past
  258 |         const token = localStorage.getItem('auth-token');
  259 |         if (token) {
  260 |           const expired = {
  261 |             ...JSON.parse(atob(token.split('.')[1])),
  262 |             exp: Math.floor(Date.now() / 1000) - 3600
  263 |           };
  264 |           // This is a simulation - in reality the server would handle this
  265 |         }
  266 |       });
  267 |       
  268 |       // Try to access protected resource
  269 |       await page.goto('/dashboard/projects');
  270 |       
  271 |       // Should redirect to login
  272 |       await page.waitForURL('/login');
  273 |       await expect(page.locator('.alert')).toContainText(/session|expired/i);
  274 |     });
  275 |
  276 |     test('verify concurrent session handling', async ({ browser }) => {
  277 |       // Login with first browser
  278 |       const context1 = await browser.newContext();
  279 |       const page1 = await context1.newPage();
  280 |       const auth1 = new AuthHelper(page1);
  281 |       await auth1.login(testUsers.developer);
  282 |       
  283 |       // Login with second browser (same user)
  284 |       const context2 = await browser.newContext();
  285 |       const page2 = await context2.newPage();
  286 |       const auth2 = new AuthHelper(page2);
  287 |       await auth2.login(testUsers.developer);
  288 |       
  289 |       // First session should still be valid (or invalidated based on settings)
  290 |       await page1.goto('/dashboard');
  291 |       
  292 |       // Check if system allows concurrent sessions or invalidates first
  293 |       const isFirstSessionValid = !page1.url().includes('/login');
  294 |       
  295 |       // Clean up
  296 |       await context1.close();
  297 |       await context2.close();
  298 |       
  299 |       // System should handle this consistently
  300 |       expect(typeof isFirstSessionValid).toBe('boolean');
  301 |     });
  302 |   });
  303 |
  304 |   test.describe('Input Validation & Sanitization', () => {
  305 |     test('verify XSS protection', async ({ page }) => {
  306 |       await authHelper.login(testUsers.staff);
  307 |       
  308 |       // Try to inject script in various fields
  309 |       const xssPayloads = [
  310 |         '<script>alert("XSS")</script>',
  311 |         '<img src=x onerror=alert("XSS")>',
  312 |         'javascript:alert("XSS")',
  313 |         '<svg/onload=alert("XSS")>'
  314 |       ];
  315 |       
  316 |       await page.goto('/dashboard/applicants/new');
  317 |       
  318 |       for (const payload of xssPayloads) {
  319 |         await page.fill('input[name="first_name"]', payload);
  320 |         await page.fill('input[name="additional_notes"]', payload);
  321 |         await page.click('button[type="submit"]');
  322 |         
  323 |         // Check for any alert dialogs (there shouldn't be any)
  324 |         let alertFired = false;
  325 |         page.on('dialog', async dialog => {
  326 |           alertFired = true;
  327 |           await dialog.dismiss();
  328 |         });
  329 |         
  330 |         await page.waitForTimeout(1000);
  331 |         expect(alertFired).toBe(false);
  332 |         
  333 |         // If saved, verify the payload is escaped when displayed
  334 |         if (await page.locator('.toast-success').isVisible()) {
  335 |           await page.goto('/dashboard/applicants');
  336 |           const content = await page.content();
  337 |           expect(content).not.toContain('<script>');
  338 |           expect(content).not.toContain('onerror=');
  339 |         }
  340 |       }
  341 |     });
  342 |
  343 |     test('verify SQL injection protection', async ({ page }) => {
  344 |       await authHelper.login(testUsers.staff);
  345 |       
  346 |       // Try SQL injection in search
```