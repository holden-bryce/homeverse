# Test info

- Name: Debug Helper - Check Environment >> check actual login flow
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/debug-helper.spec.ts:63:7

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
   2 |
   3 | test.describe('Debug Helper - Check Environment', () => {
   4 |   test('verify servers are running', async ({ page }) => {
   5 |     // Check backend
   6 |     const backendResponse = await page.request.get('http://localhost:8000/health');
   7 |     console.log('Backend status:', backendResponse.status());
   8 |     expect(backendResponse.ok()).toBeTruthy();
   9 |
  10 |     // Check frontend
  11 |     await page.goto('http://localhost:3000');
  12 |     await expect(page).toHaveURL('http://localhost:3000/');
  13 |     console.log('Frontend loaded successfully');
  14 |
  15 |     // Take screenshot
  16 |     await page.screenshot({ path: 'tests/debug-frontend.png' });
  17 |   });
  18 |
  19 |   test('check login page elements', async ({ page }) => {
  20 |     await page.goto('http://localhost:3000/login');
  21 |     
  22 |     // Debug: log all visible text
  23 |     const visibleText = await page.textContent('body');
  24 |     console.log('Page text:', visibleText?.substring(0, 200));
  25 |
  26 |     // Check for common login elements with multiple possible selectors
  27 |     const emailSelectors = [
  28 |       'input[name="email"]',
  29 |       'input[type="email"]',
  30 |       'input[placeholder*="email" i]',
  31 |       '#email',
  32 |       '[data-testid="email-input"]'
  33 |     ];
  34 |
  35 |     let emailFound = false;
  36 |     for (const selector of emailSelectors) {
  37 |       const element = page.locator(selector);
  38 |       if (await element.count() > 0) {
  39 |         console.log(`Found email input with selector: ${selector}`);
  40 |         emailFound = true;
  41 |         break;
  42 |       }
  43 |     }
  44 |
  45 |     if (!emailFound) {
  46 |       // Log all inputs on the page
  47 |       const inputs = await page.locator('input').all();
  48 |       console.log(`Found ${inputs.length} input elements`);
  49 |       for (let i = 0; i < inputs.length; i++) {
  50 |         const attrs = await inputs[i].evaluate(el => ({
  51 |           name: el.getAttribute('name'),
  52 |           type: el.getAttribute('type'),
  53 |           placeholder: el.getAttribute('placeholder'),
  54 |           id: el.id
  55 |         }));
  56 |         console.log(`Input ${i}:`, attrs);
  57 |       }
  58 |     }
  59 |
  60 |     expect(emailFound).toBeTruthy();
  61 |   });
  62 |
> 63 |   test('check actual login flow', async ({ page }) => {
     |       ^ Error: browserType.launch: 
  64 |     await page.goto('http://localhost:3000/login');
  65 |     
  66 |     // Wait for page to fully load
  67 |     await page.waitForLoadState('networkidle');
  68 |     
  69 |     // Try to find and fill email
  70 |     const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  71 |     await expect(emailInput).toBeVisible({ timeout: 10000 });
  72 |     await emailInput.fill('developer@test.com');
  73 |     
  74 |     // Try to find and fill password
  75 |     const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  76 |     await expect(passwordInput).toBeVisible({ timeout: 10000 });
  77 |     await passwordInput.fill('password123');
  78 |     
  79 |     // Find and click submit button
  80 |     const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
  81 |     await expect(submitButton).toBeVisible();
  82 |     await submitButton.click();
  83 |     
  84 |     // Wait for navigation or error
  85 |     await page.waitForTimeout(3000);
  86 |     
  87 |     const currentUrl = page.url();
  88 |     console.log('After login URL:', currentUrl);
  89 |     
  90 |     // Check if we're logged in
  91 |     if (currentUrl.includes('/dashboard')) {
  92 |       console.log('Login successful!');
  93 |     } else {
  94 |       // Check for error messages
  95 |       const errorText = await page.locator('.error, .alert-danger, [role="alert"]').textContent().catch(() => null);
  96 |       console.log('Error message:', errorText);
  97 |     }
  98 |   });
  99 | });
```