import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Tests', () => {
  test('frontend is accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('http://localhost:3000/');
    
    // Check for HomeVerse in title or page
    const title = await page.title();
    console.log('Page title:', title);
    
    // Take screenshot
    await page.screenshot({ path: 'homepage.png' });
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check URL
    expect(page.url()).toContain('/login');
    
    // Look for login form elements
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log('Found elements:', {
      emailInputs: emailInput,
      passwordInputs: passwordInput,
      submitButtons: submitButton
    });
    
    expect(emailInput).toBeGreaterThan(0);
    expect(passwordInput).toBeGreaterThan(0);
  });
});