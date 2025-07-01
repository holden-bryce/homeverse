# Test info

- Name: Core Feature Workflows >> File Management >> file encryption verification
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/02-core-features.spec.ts:362:9

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
  274 |         
  275 |         // 2. Staff reviews application
  276 |         await authHelper.login(testUsers.staff);
  277 |         await page.goto('/dashboard/applications');
  278 |         
  279 |         // Find and open application
  280 |         await page.click(`tr:has-text("${appId}")`);
  281 |         
  282 |         // Verify documents
  283 |         await page.click('tab:has-text("Documents")');
  284 |         await expect(page.locator('text="income.pdf"')).toBeVisible();
  285 |         await expect(page.locator('text="id.pdf"')).toBeVisible();
  286 |         
  287 |         // Add notes
  288 |         await page.fill('textarea[name="staff_notes"]', 'All documents verified. Income meets requirements.');
  289 |         await page.click('button:has-text("Save Notes")');
  290 |         
  291 |         // Mark as reviewed
  292 |         await page.click('button:has-text("Mark as Reviewed")');
  293 |         await expect(page.locator('.toast-success')).toBeVisible();
  294 |         
  295 |         await authHelper.logout();
  296 |         
  297 |         // 3. Manager approves application
  298 |         await authHelper.login(testUsers.manager);
  299 |         await page.goto('/dashboard/applications/pending-approval');
  300 |         
  301 |         // Find reviewed application
  302 |         await page.click(`tr:has-text("${appId}")`);
  303 |         
  304 |         // Review staff notes
  305 |         await expect(page.locator('text="All documents verified"')).toBeVisible();
  306 |         
  307 |         // Approve
  308 |         await page.click('button:has-text("Approve Application")');
  309 |         await page.fill('textarea[name="approval_notes"]', 'Approved for unit 2B');
  310 |         await page.click('button:has-text("Confirm Approval")');
  311 |         await expect(page.locator('.toast-success')).toContainText('approved');
  312 |         
  313 |         await authHelper.logout();
  314 |         
  315 |         // 4. Applicant checks status
  316 |         await authHelper.login(testUsers.applicant);
  317 |         await page.goto('/dashboard/applications');
  318 |         
  319 |         // Verify approved status
  320 |         await expect(page.locator(`tr:has-text("${appId}") .badge:has-text("Approved")`)).toBeVisible();
  321 |         
  322 |         // View approval details
  323 |         await page.click(`tr:has-text("${appId}")`);
  324 |         await expect(page.locator('text="Approved for unit 2B"')).toBeVisible();
  325 |       }
  326 |     });
  327 |   });
  328 |
  329 |   test.describe('File Management', () => {
  330 |     test.beforeEach(async ({ page }) => {
  331 |       await authHelper.login(testUsers.staff);
  332 |     });
  333 |
  334 |     test('upload and download documents', async ({ page }) => {
  335 |       await page.goto('/dashboard/documents');
  336 |       
  337 |       // Upload various file types
  338 |       const testFiles = [
  339 |         { name: 'test.pdf', type: 'application/pdf', content: 'PDF content' },
  340 |         { name: 'test.jpg', type: 'image/jpeg', content: 'JPEG content' },
  341 |         { name: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content: 'DOCX content' }
  342 |       ];
  343 |       
  344 |       for (const file of testFiles) {
  345 |         await page.click('button:has-text("Upload Document")');
  346 |         await fileHelper.uploadFile('input[type="file"]', file.name, file.content);
  347 |         await page.selectOption('select[name="document_type"]', 'other');
  348 |         await page.click('button:has-text("Upload")');
  349 |         await expect(page.locator('.toast-success')).toBeVisible();
  350 |       }
  351 |       
  352 |       // Verify files are listed
  353 |       for (const file of testFiles) {
  354 |         await expect(page.locator(`text="${file.name}"`)).toBeVisible();
  355 |       }
  356 |       
  357 |       // Download and verify
  358 |       const downloadContent = await fileHelper.downloadFile('tr:has-text("test.pdf") button:has-text("Download")');
  359 |       expect(downloadContent).toBeTruthy();
  360 |     });
  361 |
> 362 |     test('file encryption verification', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  363 |       await page.goto('/dashboard/documents/upload');
  364 |       await fileHelper.verifyFileEncryption('input[type="file"]');
  365 |     });
  366 |   });
  367 |
  368 |   test.describe('Communication Features', () => {
  369 |     test('email notifications workflow', async ({ page }) => {
  370 |       await authHelper.login(testUsers.staff);
  371 |       
  372 |       // Send notification to applicant
  373 |       await page.goto('/dashboard/communications');
  374 |       await page.click('button:has-text("New Message")');
  375 |       
  376 |       // Select template
  377 |       await page.selectOption('select[name="template"]', 'application_update');
  378 |       
  379 |       // Customize message
  380 |       await page.fill('input[name="recipient"]', 'applicant@test.com');
  381 |       await page.fill('input[name="subject"]', 'Application Status Update');
  382 |       const message = await page.locator('textarea[name="message"]').inputValue();
  383 |       await page.fill('textarea[name="message"]', message.replace('[NAME]', 'John Doe'));
  384 |       
  385 |       // Send
  386 |       await page.click('button:has-text("Send Message")');
  387 |       await expect(page.locator('.toast-success')).toContainText('Message sent');
  388 |       
  389 |       // Verify in sent messages
  390 |       await page.click('tab:has-text("Sent")');
  391 |       await expect(page.locator('text="Application Status Update"')).toBeVisible();
  392 |     });
  393 |
  394 |     test('in-app notifications', async ({ page }) => {
  395 |       await authHelper.login(testUsers.applicant);
  396 |       
  397 |       // Check notification bell
  398 |       const notificationCount = await page.locator('[data-testid="notification-count"]').textContent();
  399 |       
  400 |       // Open notifications
  401 |       await page.click('[data-testid="notification-bell"]');
  402 |       await expect(page.locator('.notification-dropdown')).toBeVisible();
  403 |       
  404 |       // Mark as read
  405 |       await page.click('.notification-item:first-child button:has-text("Mark as read")');
  406 |       
  407 |       // Verify count updated
  408 |       const newCount = await page.locator('[data-testid="notification-count"]').textContent();
  409 |       expect(parseInt(newCount || '0')).toBeLessThan(parseInt(notificationCount || '0'));
  410 |     });
  411 |   });
  412 | });
```