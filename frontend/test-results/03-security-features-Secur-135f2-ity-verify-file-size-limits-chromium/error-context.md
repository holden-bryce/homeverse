# Test info

- Name: Security Feature Validation >> File Security >> verify file size limits
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/03-security-features.spec.ts:396:9

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
> 396 |     test('verify file size limits', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  397 |       await authHelper.login(testUsers.staff);
  398 |       await page.goto('/dashboard/documents/upload');
  399 |       
  400 |       // Create large file (over limit)
  401 |       const largeFile = Buffer.alloc(15 * 1024 * 1024); // 15MB
  402 |       await page.setInputFiles('input[type="file"]', {
  403 |         name: 'large-file.pdf',
  404 |         mimeType: 'application/pdf',
  405 |         buffer: largeFile
  406 |       });
  407 |       
  408 |       await page.click('button:has-text("Upload")');
  409 |       
  410 |       // Should show size error
  411 |       await expect(page.locator('.alert-danger')).toContainText(/size|too large|exceeds/i);
  412 |     });
  413 |   });
  414 |
  415 |   test.describe('Audit Logging', () => {
  416 |     test('verify sensitive actions are logged', async ({ page }) => {
  417 |       await authHelper.login(testUsers.manager);
  418 |       
  419 |       // Perform sensitive actions
  420 |       await page.goto('/dashboard/applicants');
  421 |       await page.click('tbody tr:first-child'); // View applicant
  422 |       
  423 |       // Export data
  424 |       await page.goto('/dashboard/reports');
  425 |       await page.click('button:has-text("Export All Data")');
  426 |       
  427 |       // Check audit logs
  428 |       await page.goto('/dashboard/admin/audit-logs');
  429 |       
  430 |       // Verify actions are logged
  431 |       await expect(page.locator('text="view_applicant"')).toBeVisible();
  432 |       await expect(page.locator('text="export_data"')).toBeVisible();
  433 |       
  434 |       // Verify log details include user, timestamp, IP
  435 |       await page.click('tr:has-text("export_data")');
  436 |       await expect(page.locator('text="User:"')).toBeVisible();
  437 |       await expect(page.locator('text="Timestamp:"')).toBeVisible();
  438 |       await expect(page.locator('text="IP Address:"')).toBeVisible();
  439 |     });
  440 |   });
  441 | });
```