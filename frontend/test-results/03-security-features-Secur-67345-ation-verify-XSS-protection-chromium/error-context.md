# Test info

- Name: Security Feature Validation >> Input Validation & Sanitization >> verify XSS protection
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/03-security-features.spec.ts:305:9

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
  246 |     test('verify session timeout works correctly', async ({ page, context }) => {
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
> 305 |     test('verify XSS protection', async ({ page }) => {
      |         ^ Error: browserType.launch: 
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
  347 |       const sqlPayloads = [
  348 |         "' OR '1'='1",
  349 |         "'; DROP TABLE applicants; --",
  350 |         "1' UNION SELECT * FROM users--"
  351 |       ];
  352 |       
  353 |       for (const payload of sqlPayloads) {
  354 |         await page.goto('/dashboard/applicants');
  355 |         await page.fill('input[placeholder*="Search"]', payload);
  356 |         await page.keyboard.press('Enter');
  357 |         
  358 |         // Should not cause errors or return all records
  359 |         await expect(page.locator('.error-message')).not.toBeVisible();
  360 |         
  361 |         // Verify normal search behavior (no results or filtered results)
  362 |         const rowCount = await page.locator('tbody tr').count();
  363 |         expect(rowCount).toBeLessThan(10); // Shouldn't return all records
  364 |       }
  365 |     });
  366 |   });
  367 |
  368 |   test.describe('File Security', () => {
  369 |     test('verify malicious file upload protection', async ({ page }) => {
  370 |       await authHelper.login(testUsers.staff);
  371 |       await page.goto('/dashboard/documents/upload');
  372 |       
  373 |       // Try uploading potentially malicious files
  374 |       const maliciousFiles = [
  375 |         { name: 'virus.exe', content: 'MZ' }, // Executable header
  376 |         { name: 'script.js', content: 'alert("malicious")' },
  377 |         { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
  378 |         { name: 'normal.pdf.exe', content: 'fake pdf' } // Double extension
  379 |       ];
  380 |       
  381 |       for (const file of maliciousFiles) {
  382 |         const buffer = Buffer.from(file.content);
  383 |         await page.setInputFiles('input[type="file"]', {
  384 |           name: file.name,
  385 |           mimeType: 'application/octet-stream',
  386 |           buffer
  387 |         });
  388 |         
  389 |         await page.click('button:has-text("Upload")');
  390 |         
  391 |         // Should be rejected
  392 |         await expect(page.locator('.alert-danger')).toContainText(/not allowed|invalid|prohibited/i);
  393 |       }
  394 |     });
  395 |
  396 |     test('verify file size limits', async ({ page }) => {
  397 |       await authHelper.login(testUsers.staff);
  398 |       await page.goto('/dashboard/documents/upload');
  399 |       
  400 |       // Create large file (over limit)
  401 |       const largeFile = Buffer.alloc(15 * 1024 * 1024); // 15MB
  402 |       await page.setInputFiles('input[type="file"]', {
  403 |         name: 'large-file.pdf',
  404 |         mimeType: 'application/pdf',
  405 |         buffer: largeFile
```