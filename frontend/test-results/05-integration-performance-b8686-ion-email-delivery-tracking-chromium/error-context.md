# Test info

- Name: Integration & Performance Testing >> SendGrid Email Integration >> email delivery tracking
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/05-integration-performance.spec.ts:131:9

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
   31 |         },
   32 |         'Search Applicants': async () => {
   33 |           await page.goto('/dashboard/applicants');
   34 |           await page.fill('input[placeholder*="Search"]', 'Test');
   35 |           await page.keyboard.press('Enter');
   36 |           await page.waitForTimeout(500);
   37 |         },
   38 |         'Filter Applicants': async () => {
   39 |           await page.goto('/dashboard/applicants');
   40 |           await page.click('button:has-text("Filters")');
   41 |           await page.selectOption('select[name="status"]', 'active');
   42 |           await page.click('button:has-text("Apply")');
   43 |           await page.waitForTimeout(500);
   44 |         }
   45 |       };
   46 |       
   47 |       const metrics: Record<string, number> = {};
   48 |       
   49 |       for (const [operation, action] of Object.entries(operations)) {
   50 |         const time = await performanceHelper.measureApiResponse(action);
   51 |         metrics[operation] = time;
   52 |         
   53 |         // Operations should complete within reasonable time
   54 |         expect(time).toBeLessThan(3000); // 3 seconds max
   55 |       }
   56 |       
   57 |       console.log('Database Operation Performance:', metrics);
   58 |     });
   59 |
   60 |     test('real-time subscriptions', async ({ page }) => {
   61 |       // Open two browser tabs
   62 |       const page1 = page;
   63 |       const context = page.context();
   64 |       const page2 = await context.newPage();
   65 |       
   66 |       // Login in both tabs
   67 |       const auth1 = new AuthHelper(page1);
   68 |       const auth2 = new AuthHelper(page2);
   69 |       
   70 |       await auth1.login(testUsers.staff);
   71 |       await auth2.login(testUsers.manager);
   72 |       
   73 |       // Navigate to applicants list in both
   74 |       await page1.goto('/dashboard/applicants');
   75 |       await page2.goto('/dashboard/applicants');
   76 |       
   77 |       // Count initial applicants in page2
   78 |       const initialCount = await page2.locator('tbody tr').count();
   79 |       
   80 |       // Create applicant in page1
   81 |       await page1.goto('/dashboard/applicants/new');
   82 |       const uniqueName = `Realtime${Date.now()}`;
   83 |       await page1.fill('input[name="first_name"]', uniqueName);
   84 |       await page1.fill('input[name="last_name"]', 'Test');
   85 |       await page1.fill('input[name="email"]', `${uniqueName}@test.com`);
   86 |       await page1.click('button[type="submit"]');
   87 |       
   88 |       // Check if page2 receives update (within 5 seconds)
   89 |       await page2.waitForTimeout(2000);
   90 |       const newCount = await page2.locator('tbody tr').count();
   91 |       
   92 |       // Should see the new applicant
   93 |       expect(newCount).toBe(initialCount + 1);
   94 |       await expect(page2.locator(`text="${uniqueName}"`)).toBeVisible();
   95 |       
   96 |       await page2.close();
   97 |     });
   98 |
   99 |     test('file storage integration', async ({ page }) => {
  100 |       await authHelper.login(testUsers.staff);
  101 |       await page.goto('/dashboard/documents');
  102 |       
  103 |       // Upload file to Supabase storage
  104 |       const fileName = `test-${Date.now()}.pdf`;
  105 |       await page.click('button:has-text("Upload")');
  106 |       await page.setInputFiles('input[type="file"]', {
  107 |         name: fileName,
  108 |         mimeType: 'application/pdf',
  109 |         buffer: Buffer.from('Test PDF content for Supabase storage')
  110 |       });
  111 |       await page.selectOption('select[name="document_type"]', 'other');
  112 |       await page.click('button:has-text("Confirm Upload")');
  113 |       
  114 |       // Verify upload success
  115 |       await expect(page.locator('.toast-success')).toBeVisible();
  116 |       
  117 |       // Verify file appears in list
  118 |       await expect(page.locator(`text="${fileName}"`)).toBeVisible();
  119 |       
  120 |       // Download file
  121 |       const downloadPromise = page.waitForEvent('download');
  122 |       await page.click(`tr:has-text("${fileName}") button:has-text("Download")`);
  123 |       const download = await downloadPromise;
  124 |       
  125 |       // Verify download
  126 |       expect(download.suggestedFilename()).toBe(fileName);
  127 |     });
  128 |   });
  129 |
  130 |   test.describe('SendGrid Email Integration', () => {
> 131 |     test('email delivery tracking', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  132 |       await authHelper.login(testUsers.staff);
  133 |       
  134 |       // Send test email
  135 |       await page.goto('/dashboard/communications');
  136 |       await page.click('button:has-text("New Email")');
  137 |       
  138 |       const testEmail = `test${Date.now()}@example.com`;
  139 |       await page.fill('input[name="to"]', testEmail);
  140 |       await page.fill('input[name="subject"]', 'Integration Test Email');
  141 |       await page.fill('textarea[name="body"]', 'This is a test email from integration tests.');
  142 |       
  143 |       await page.click('button:has-text("Send")');
  144 |       
  145 |       // Should show success
  146 |       await expect(page.locator('.toast-success')).toContainText(/sent|queued/i);
  147 |       
  148 |       // Check email status
  149 |       await page.click('a:has-text("View Sent")');
  150 |       await expect(page.locator(`td:has-text("${testEmail}")`)).toBeVisible();
  151 |       
  152 |       // Status should update (delivered, opened, etc)
  153 |       const statusCell = page.locator(`tr:has-text("${testEmail}") td.status`);
  154 |       const status = await statusCell.textContent();
  155 |       expect(['queued', 'sent', 'delivered']).toContain(status?.toLowerCase());
  156 |     });
  157 |
  158 |     test('email template processing', async ({ page }) => {
  159 |       await authHelper.login(testUsers.manager);
  160 |       
  161 |       // Use email template
  162 |       await page.goto('/dashboard/communications/templates');
  163 |       await page.click('text="Application Approved"');
  164 |       
  165 |       // Verify template variables
  166 |       await expect(page.locator('text="{{applicant_name}}"')).toBeVisible();
  167 |       await expect(page.locator('text="{{project_name}}"')).toBeVisible();
  168 |       
  169 |       // Send with template
  170 |       await page.click('button:has-text("Use Template")');
  171 |       await page.fill('input[name="applicant_name"]', 'John Doe');
  172 |       await page.fill('input[name="project_name"]', 'Green Valley Apartments');
  173 |       await page.fill('input[name="to"]', 'john.doe@example.com');
  174 |       
  175 |       // Preview should show processed template
  176 |       await page.click('button:has-text("Preview")');
  177 |       await expect(page.locator('.preview-content')).toContainText('John Doe');
  178 |       await expect(page.locator('.preview-content')).toContainText('Green Valley Apartments');
  179 |       
  180 |       // Send
  181 |       await page.click('button:has-text("Send")');
  182 |       await expect(page.locator('.toast-success')).toBeVisible();
  183 |     });
  184 |   });
  185 |
  186 |   test.describe('Mapbox Integration', () => {
  187 |     test('map rendering performance', async ({ page }) => {
  188 |       await authHelper.login(testUsers.lender);
  189 |       
  190 |       const startTime = Date.now();
  191 |       await page.goto('/dashboard/map');
  192 |       
  193 |       // Wait for map to load
  194 |       await page.waitForSelector('.mapboxgl-map', { timeout: 10000 });
  195 |       
  196 |       const mapLoadTime = Date.now() - startTime;
  197 |       expect(mapLoadTime).toBeLessThan(5000); // Map should load within 5 seconds
  198 |       
  199 |       // Verify map controls
  200 |       await expect(page.locator('.mapboxgl-ctrl-zoom-in')).toBeVisible();
  201 |       await expect(page.locator('.mapboxgl-ctrl-zoom-out')).toBeVisible();
  202 |       
  203 |       // Test map interactions
  204 |       await page.click('.mapboxgl-ctrl-zoom-in');
  205 |       await page.waitForTimeout(500);
  206 |       
  207 |       // Pan map
  208 |       await page.mouse.move(400, 300);
  209 |       await page.mouse.down();
  210 |       await page.mouse.move(500, 400);
  211 |       await page.mouse.up();
  212 |       
  213 |       // Markers should be visible
  214 |       await expect(page.locator('.mapboxgl-marker').first()).toBeVisible();
  215 |     });
  216 |
  217 |     test('project location clustering', async ({ page }) => {
  218 |       await authHelper.login(testUsers.developer);
  219 |       await page.goto('/dashboard/map');
  220 |       
  221 |       // Wait for map and clusters
  222 |       await page.waitForSelector('.mapboxgl-map');
  223 |       await page.waitForTimeout(2000); // Wait for markers to load
  224 |       
  225 |       // Look for cluster markers
  226 |       const clusters = page.locator('.marker-cluster');
  227 |       if (await clusters.count() > 0) {
  228 |         // Click on a cluster
  229 |         await clusters.first().click();
  230 |         
  231 |         // Map should zoom in
```