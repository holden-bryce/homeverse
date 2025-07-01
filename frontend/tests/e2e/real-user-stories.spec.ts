import { test, expect } from '@playwright/test';

test.describe('Real User Stories', () => {
  // Slow down tests to human speed
  test.use({ 
    launchOptions: { slowMo: 500 },
    video: 'on',
    screenshot: 'only-on-failure'
  });

  test('New user finds affordable housing - complete journey', async ({ page }) => {
    // 1. User lands on homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('📍 User lands on homepage');
    
    // User takes time to read
    await page.waitForTimeout(2000);
    
    // 2. User explores the site
    await page.click('text=About');
    await page.waitForTimeout(1000);
    console.log('📍 User reads about the company');
    
    // 3. User decides to search for housing
    await page.click('text=Find Housing');
    console.log('📍 User clicks Find Housing');
    
    // 4. User tries to search without logging in
    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
    console.log('📍 User redirected to login');
    
    // 5. User doesn't have account, clicks register
    await page.click('text=Sign up');
    console.log('📍 User decides to register');
    
    // 6. User fills registration form (like a real person)
    await page.fill('input[name="name"]', 'Sarah Johnson');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="email"]', `sarah.johnson.${Date.now()}@example.com`);
    await page.waitForTimeout(500);
    
    // User types password slowly
    const password = 'MySecurePass123!';
    const passwordInput = page.locator('input[name="password"]');
    for (const char of password) {
      await passwordInput.type(char);
      await page.waitForTimeout(100);
    }
    
    // Confirm password
    await page.fill('input[name="confirmPassword"]', password);
    
    // Check terms
    await page.check('input[type="checkbox"]');
    
    // Submit
    await page.click('button[type="submit"]');
    console.log('📍 User submits registration');
    
    // 7. User completes profile
    await page.waitForURL(/dashboard|profile/);
    console.log('📍 User reaches dashboard');
    
    // Fill housing preferences
    await page.fill('input[name="annual_income"]', '45000');
    await page.fill('input[name="household_size"]', '3');
    await page.selectOption('select[name="preferred_bedrooms"]', '2');
    
    // 8. User searches for housing
    await page.click('text=Search Properties');
    await page.fill('input[name="location"]', 'San Francisco');
    await page.fill('input[name="max_rent"]', '2000');
    await page.click('button:has-text("Search")');
    console.log('📍 User searches for housing');
    
    // 9. User views results
    await page.waitForSelector('.property-card, .project-card');
    const results = await page.locator('.property-card, .project-card').count();
    console.log(`📍 User sees ${results} properties`);
    
    // 10. User clicks on a property
    if (results > 0) {
      await page.locator('.property-card, .project-card').first().click();
      console.log('📍 User views property details');
      
      // Read details
      await page.waitForTimeout(3000);
      
      // Apply
      await page.click('button:has-text("Apply")');
      console.log('📍 User applies to property');
    }
  });

  test('Returning user checks application status', async ({ page }) => {
    // Simulate mobile user
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 1. User opens app on phone
    await page.goto('/');
    console.log('📱 User opens app on mobile');
    
    // 2. Login
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'applicant@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    console.log('📱 User logs in');
    
    // 3. Check notifications
    const notificationBell = page.locator('[data-testid="notification-bell"], .notification-icon');
    if (await notificationBell.isVisible()) {
      await notificationBell.click();
      console.log('📱 User checks notifications');
      await page.waitForTimeout(2000);
    }
    
    // 4. Navigate to applications
    await page.click('text=My Applications');
    console.log('📱 User views applications');
    
    // 5. Check status
    const applications = await page.locator('.application-item, tr').count();
    console.log(`📱 User has ${applications} applications`);
  });

  test('User encounters and recovers from errors', async ({ page }) => {
    // Test error handling
    await page.goto('/login');
    
    // 1. Wrong password
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // User sees error
    await expect(page.locator('.error, .alert-danger')).toBeVisible();
    console.log('❌ User sees login error');
    
    // 2. User tries forgot password
    await page.click('text=Forgot password');
    console.log('🔄 User clicks forgot password');
    
    // 3. Network error simulation
    await page.route('**/api/**', route => route.abort());
    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button[type="submit"]');
    
    // User sees network error
    await expect(page.locator('text=/error|failed|try again/i')).toBeVisible();
    console.log('❌ User sees network error');
    
    // Restore network
    await page.unroute('**/api/**');
  });

  test('Security: User tries malicious actions', async ({ page }) => {
    await page.goto('/login');
    
    // 1. SQL injection attempt
    await page.fill('input[type="email"]', "admin' OR '1'='1");
    await page.fill('input[type="password"]', "' OR '1'='1");
    await page.click('button[type="submit"]');
    
    // Should show normal error, not SQL error
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('text=/SQL|syntax|database/i')).not.toBeVisible();
    console.log('✅ SQL injection blocked');
    
    // 2. XSS attempt
    await page.goto('/register');
    await page.fill('input[name="name"]', '<script>alert("XSS")</script>');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // No alert should appear
    let alertFired = false;
    page.on('dialog', () => { alertFired = true; });
    await page.waitForTimeout(2000);
    expect(alertFired).toBe(false);
    console.log('✅ XSS attempt blocked');
    
    // 3. Rate limiting test
    for (let i = 0; i < 10; i++) {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'wrong');
      await page.click('button[type="submit"]');
    }
    
    // Should see rate limit error
    await expect(page.locator('text=/too many|rate limit|try later/i')).toBeVisible();
    console.log('✅ Rate limiting works');
  });

  test('Performance: User on slow connection', async ({ page }) => {
    // Simulate slow 3G
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    console.log(`🐌 Page loaded in ${loadTime}ms on slow connection`);
    
    // Should show loading states
    await expect(page.locator('.skeleton, .loading')).toBeVisible();
    
    // Should eventually load
    await expect(page.locator('h1')).toBeVisible({ timeout: 30000 });
  });
});