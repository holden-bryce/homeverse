# Test info

- Name: UI/UX Component Testing >> Interactive Components >> dropdown menus
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/04-ui-ux-components.spec.ts:411:9

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
  311 |       await page.click('button:has-text("Edit")');
  312 |       const availableUnitsInput = page.locator('input[name="available_units"]');
  313 |       await availableUnitsInput.clear();
  314 |       await availableUnitsInput.fill('50');
  315 |       
  316 |       // Save changes
  317 |       await page.click('button:has-text("Save")');
  318 |       
  319 |       // UI should update immediately (optimistically)
  320 |       await expect(page.locator('text="50 units"')).toBeVisible({ timeout: 1000 });
  321 |       
  322 |       // Even if API is slow
  323 |       await page.route('**/api/projects/*', async route => {
  324 |         await new Promise(resolve => setTimeout(resolve, 3000));
  325 |         await route.continue();
  326 |       });
  327 |     });
  328 |   });
  329 |
  330 |   test.describe('Error Handling and User Feedback', () => {
  331 |     test('form validation feedback', async ({ page }) => {
  332 |       await authHelper.login(testUsers.staff);
  333 |       await page.goto('/dashboard/applicants/new');
  334 |       
  335 |       // Submit empty form
  336 |       await page.click('button[type="submit"]');
  337 |       
  338 |       // Should show field-level errors
  339 |       await expect(page.locator('.error-message, .invalid-feedback').first()).toBeVisible();
  340 |       
  341 |       // Fill only some fields
  342 |       await page.fill('input[name="first_name"]', 'John');
  343 |       await page.click('button[type="submit"]');
  344 |       
  345 |       // Should update error states
  346 |       const firstNameError = page.locator('input[name="first_name"] ~ .error-message');
  347 |       await expect(firstNameError).not.toBeVisible();
  348 |       
  349 |       // Other errors should remain
  350 |       const lastNameError = page.locator('input[name="last_name"] ~ .error-message');
  351 |       await expect(lastNameError).toBeVisible();
  352 |     });
  353 |
  354 |     test('network error handling', async ({ page }) => {
  355 |       await authHelper.login(testUsers.developer);
  356 |       
  357 |       // Simulate network failure
  358 |       await page.route('**/api/**', route => route.abort());
  359 |       
  360 |       await page.goto('/dashboard/projects');
  361 |       
  362 |       // Should show error message
  363 |       await expect(page.locator('.error-message, .alert-danger')).toBeVisible();
  364 |       await expect(page.locator('text=/failed|error|problem/i')).toBeVisible();
  365 |       
  366 |       // Should offer retry
  367 |       const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
  368 |       if (await retryButton.isVisible()) {
  369 |         // Restore network
  370 |         await page.unroute('**/api/**');
  371 |         await retryButton.click();
  372 |         
  373 |         // Should load successfully
  374 |         await expect(page.locator('.project-card, tbody tr')).toBeVisible();
  375 |       }
  376 |     });
  377 |
  378 |     test('toast notifications', async ({ page }) => {
  379 |       await authHelper.login(testUsers.staff);
  380 |       
  381 |       // Test different toast types
  382 |       await page.goto('/dashboard/applicants/new');
  383 |       
  384 |       // Success toast
  385 |       await page.fill('input[name="first_name"]', 'Test');
  386 |       await page.fill('input[name="last_name"]', 'User');
  387 |       await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
  388 |       await page.click('button[type="submit"]');
  389 |       
  390 |       const successToast = page.locator('.toast-success, .toast.success');
  391 |       await expect(successToast).toBeVisible();
  392 |       await expect(successToast).toContainText(/success|saved|created/i);
  393 |       
  394 |       // Auto-dismiss
  395 |       await expect(successToast).not.toBeVisible({ timeout: 6000 });
  396 |       
  397 |       // Error toast
  398 |       await page.route('**/api/applicants', route => 
  399 |         route.fulfill({ status: 400, body: JSON.stringify({ error: 'Validation failed' }) })
  400 |       );
  401 |       
  402 |       await page.click('button[type="submit"]');
  403 |       
  404 |       const errorToast = page.locator('.toast-error, .toast.error');
  405 |       await expect(errorToast).toBeVisible();
  406 |       await expect(errorToast).toContainText(/error|failed/i);
  407 |     });
  408 |   });
  409 |
  410 |   test.describe('Interactive Components', () => {
> 411 |     test('dropdown menus', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  412 |       await authHelper.login(testUsers.manager);
  413 |       await page.goto('/dashboard');
  414 |       
  415 |       // User dropdown
  416 |       await page.click('[data-testid="user-menu-button"]');
  417 |       const dropdown = page.locator('[data-testid="user-menu-dropdown"]');
  418 |       await expect(dropdown).toBeVisible();
  419 |       
  420 |       // Click outside should close
  421 |       await page.click('body', { position: { x: 0, y: 0 } });
  422 |       await expect(dropdown).not.toBeVisible();
  423 |       
  424 |       // Keyboard navigation
  425 |       await page.click('[data-testid="user-menu-button"]');
  426 |       await page.keyboard.press('ArrowDown');
  427 |       await expect(page.locator(':focus')).toContainText(/profile|settings/i);
  428 |       
  429 |       await page.keyboard.press('Escape');
  430 |       await expect(dropdown).not.toBeVisible();
  431 |     });
  432 |
  433 |     test('date pickers', async ({ page }) => {
  434 |       await authHelper.login(testUsers.staff);
  435 |       await page.goto('/dashboard/applicants/new');
  436 |       
  437 |       const dateInput = page.locator('input[type="date"][name="date_of_birth"]');
  438 |       await dateInput.click();
  439 |       
  440 |       // Should open calendar
  441 |       if (await page.locator('.calendar, .date-picker').isVisible()) {
  442 |         // Select a date
  443 |         await page.click('.calendar-day:has-text("15")');
  444 |         
  445 |         // Value should be set
  446 |         const value = await dateInput.inputValue();
  447 |         expect(value).toContain('15');
  448 |       } else {
  449 |         // Native date picker
  450 |         await dateInput.fill('1990-01-15');
  451 |         const value = await dateInput.inputValue();
  452 |         expect(value).toBe('1990-01-15');
  453 |       }
  454 |     });
  455 |
  456 |     test('autocomplete/search suggestions', async ({ page }) => {
  457 |       await authHelper.login(testUsers.applicant);
  458 |       await page.goto('/dashboard/search');
  459 |       
  460 |       const locationInput = page.locator('input[name="location"]');
  461 |       await locationInput.fill('San');
  462 |       
  463 |       // Should show suggestions
  464 |       await expect(page.locator('.suggestions, .autocomplete-results')).toBeVisible({ timeout: 2000 });
  465 |       
  466 |       // Select suggestion
  467 |       await page.click('text="San Francisco"');
  468 |       
  469 |       // Input should be updated
  470 |       await expect(locationInput).toHaveValue(/San Francisco/);
  471 |     });
  472 |
  473 |     test('tabs and tab panels', async ({ page }) => {
  474 |       await authHelper.login(testUsers.developer);
  475 |       await page.goto('/dashboard/settings');
  476 |       
  477 |       // Check tab navigation
  478 |       const tabs = page.locator('[role="tab"]');
  479 |       const tabCount = await tabs.count();
  480 |       expect(tabCount).toBeGreaterThan(0);
  481 |       
  482 |       // Click through tabs
  483 |       for (let i = 0; i < Math.min(tabCount, 3); i++) {
  484 |         const tab = tabs.nth(i);
  485 |         await tab.click();
  486 |         
  487 |         // Tab should be selected
  488 |         await expect(tab).toHaveAttribute('aria-selected', 'true');
  489 |         
  490 |         // Panel should be visible
  491 |         const panelId = await tab.getAttribute('aria-controls');
  492 |         if (panelId) {
  493 |           await expect(page.locator(`#${panelId}`)).toBeVisible();
  494 |         }
  495 |       }
  496 |       
  497 |       // Keyboard navigation
  498 |       await tabs.first().focus();
  499 |       await page.keyboard.press('ArrowRight');
  500 |       await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  501 |     });
  502 |   });
  503 |
  504 |   test.describe('Real Device Testing', () => {
  505 |     test('touch interactions on mobile', async ({ browser }) => {
  506 |       const iPhone = devices['iPhone 12'];
  507 |       const context = await browser.newContext({
  508 |         ...iPhone,
  509 |         hasTouch: true
  510 |       });
  511 |       const page = await context.newPage();
```