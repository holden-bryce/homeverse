# Test info

- Name: Integration & Performance Testing >> Supabase Integration >> database operations performance
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/05-integration-performance.spec.ts:16:9

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
   2 | import { testUsers, testApplicant, testProject } from '../fixtures/users';
   3 | import { AuthHelper } from '../helpers/auth.helper';
   4 | import { PerformanceHelper } from '../helpers/performance.helper';
   5 |
   6 | test.describe('Integration & Performance Testing', () => {
   7 |   let authHelper: AuthHelper;
   8 |   let performanceHelper: PerformanceHelper;
   9 |
   10 |   test.beforeEach(async ({ page }) => {
   11 |     authHelper = new AuthHelper(page);
   12 |     performanceHelper = new PerformanceHelper(page);
   13 |   });
   14 |
   15 |   test.describe('Supabase Integration', () => {
>  16 |     test('database operations performance', async ({ page }) => {
      |         ^ Error: browserType.launch: 
   17 |       await authHelper.login(testUsers.staff);
   18 |       
   19 |       const operations = {
   20 |         'List Applicants': async () => {
   21 |           await page.goto('/dashboard/applicants');
   22 |           await page.waitForSelector('tbody tr, .no-data');
   23 |         },
   24 |         'Create Applicant': async () => {
   25 |           await page.goto('/dashboard/applicants/new');
   26 |           await page.fill('input[name="first_name"]', `Perf${Date.now()}`);
   27 |           await page.fill('input[name="last_name"]', 'Test');
   28 |           await page.fill('input[name="email"]', `perf${Date.now()}@test.com`);
   29 |           await page.click('button[type="submit"]');
   30 |           await page.waitForURL('/dashboard/applicants');
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
```