import { test, expect } from '@playwright/test';

test.describe('Debug Helper - Check Environment', () => {
  test('verify servers are running', async ({ page }) => {
    // Check backend
    const backendResponse = await page.request.get('http://localhost:8000/health');
    console.log('Backend status:', backendResponse.status());
    expect(backendResponse.ok()).toBeTruthy();

    // Check frontend
    await page.goto('http://localhost:3000');
    await expect(page).toHaveURL('http://localhost:3000/');
    console.log('Frontend loaded successfully');

    // Take screenshot
    await page.screenshot({ path: 'tests/debug-frontend.png' });
  });

  test('check login page elements', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Debug: log all visible text
    const visibleText = await page.textContent('body');
    console.log('Page text:', visibleText?.substring(0, 200));

    // Check for common login elements with multiple possible selectors
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      '#email',
      '[data-testid="email-input"]'
    ];

    let emailFound = false;
    for (const selector of emailSelectors) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        console.log(`Found email input with selector: ${selector}`);
        emailFound = true;
        break;
      }
    }

    if (!emailFound) {
      // Log all inputs on the page
      const inputs = await page.locator('input').all();
      console.log(`Found ${inputs.length} input elements`);
      for (let i = 0; i < inputs.length; i++) {
        const attrs = await inputs[i].evaluate(el => ({
          name: el.getAttribute('name'),
          type: el.getAttribute('type'),
          placeholder: el.getAttribute('placeholder'),
          id: el.id
        }));
        console.log(`Input ${i}:`, attrs);
      }
    }

    expect(emailFound).toBeTruthy();
  });

  test('check actual login flow', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Try to find and fill email
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('developer@test.com');
    
    // Try to find and fill password
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('password123');
    
    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();
    
    // Wait for navigation or error
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('After login URL:', currentUrl);
    
    // Check if we're logged in
    if (currentUrl.includes('/dashboard')) {
      console.log('Login successful!');
    } else {
      // Check for error messages
      const errorText = await page.locator('.error, .alert-danger, [role="alert"]').textContent().catch(() => null);
      console.log('Error message:', errorText);
    }
  });
});