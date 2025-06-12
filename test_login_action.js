// Test server action login
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🚀 Testing Server Action Login...');
  
  // Navigate to login
  await page.goto('http://localhost:3001/auth/login');
  await page.waitForLoadState('networkidle');
  
  console.log('✅ Login page loaded');
  
  // Fill login form
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'password123');
  
  console.log('✅ Form filled');
  
  // Submit form (server action)
  await page.click('button[type="submit"]');
  
  console.log('⏳ Submitting via server action...');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  console.log('✅ Redirected to dashboard!');
  
  // Check dashboard content
  const pageContent = await page.textContent('body');
  if (pageContent.includes('Welcome')) {
    console.log('✅ Dashboard loaded with user data');
  }
  
  await browser.close();
})();