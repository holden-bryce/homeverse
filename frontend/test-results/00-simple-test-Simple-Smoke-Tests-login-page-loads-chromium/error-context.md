# Test info

- Name: Simple Smoke Tests >> login page loads
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/00-simple-test.spec.ts:16:7

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
   3 | test.describe('Simple Smoke Tests', () => {
   4 |   test('frontend is accessible', async ({ page }) => {
   5 |     await page.goto('/');
   6 |     await expect(page).toHaveURL('http://localhost:3000/');
   7 |     
   8 |     // Check for HomeVerse in title or page
   9 |     const title = await page.title();
  10 |     console.log('Page title:', title);
  11 |     
  12 |     // Take screenshot
  13 |     await page.screenshot({ path: 'homepage.png' });
  14 |   });
  15 |
> 16 |   test('login page loads', async ({ page }) => {
     |       ^ Error: browserType.launch: 
  17 |     await page.goto('/login');
  18 |     
  19 |     // Wait for page to load
  20 |     await page.waitForLoadState('networkidle');
  21 |     
  22 |     // Check URL
  23 |     expect(page.url()).toContain('/login');
  24 |     
  25 |     // Look for login form elements
  26 |     const emailInput = await page.locator('input[type="email"]').count();
  27 |     const passwordInput = await page.locator('input[type="password"]').count();
  28 |     const submitButton = await page.locator('button[type="submit"]').count();
  29 |     
  30 |     console.log('Found elements:', {
  31 |       emailInputs: emailInput,
  32 |       passwordInputs: passwordInput,
  33 |       submitButtons: submitButton
  34 |     });
  35 |     
  36 |     expect(emailInput).toBeGreaterThan(0);
  37 |     expect(passwordInput).toBeGreaterThan(0);
  38 |   });
  39 | });
```