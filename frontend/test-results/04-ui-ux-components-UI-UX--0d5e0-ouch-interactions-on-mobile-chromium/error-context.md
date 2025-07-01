# Test info

- Name: UI/UX Component Testing >> Real Device Testing >> touch interactions on mobile
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/04-ui-ux-components.spec.ts:505:9

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
  405 |       await expect(errorToast).toBeVisible();
  406 |       await expect(errorToast).toContainText(/error|failed/i);
  407 |     });
  408 |   });
  409 |
  410 |   test.describe('Interactive Components', () => {
  411 |     test('dropdown menus', async ({ page }) => {
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
> 505 |     test('touch interactions on mobile', async ({ browser }) => {
      |         ^ Error: browserType.launch: 
  506 |       const iPhone = devices['iPhone 12'];
  507 |       const context = await browser.newContext({
  508 |         ...iPhone,
  509 |         hasTouch: true
  510 |       });
  511 |       const page = await context.newPage();
  512 |       const auth = new AuthHelper(page);
  513 |       
  514 |       await auth.login(testUsers.developer);
  515 |       await page.goto('/dashboard/projects');
  516 |       
  517 |       // Test swipe gestures on tables
  518 |       const table = page.locator('.table-container');
  519 |       if (await table.isVisible()) {
  520 |         // Swipe to scroll horizontally
  521 |         await table.dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 200 }] });
  522 |         await table.dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 200 }] });
  523 |         await table.dispatchEvent('touchend');
  524 |         
  525 |         // Table should have scrolled
  526 |         const scrollLeft = await table.evaluate(el => el.scrollLeft);
  527 |         expect(scrollLeft).toBeGreaterThan(0);
  528 |       }
  529 |       
  530 |       // Test touch targets are large enough
  531 |       const buttons = page.locator('button');
  532 |       const buttonCount = await buttons.count();
  533 |       for (let i = 0; i < Math.min(buttonCount, 5); i++) {
  534 |         const button = buttons.nth(i);
  535 |         const box = await button.boundingBox();
  536 |         if (box) {
  537 |           // Touch targets should be at least 44x44 pixels (iOS guideline)
  538 |           expect(box.width).toBeGreaterThanOrEqual(44);
  539 |           expect(box.height).toBeGreaterThanOrEqual(44);
  540 |         }
  541 |       }
  542 |       
  543 |       await context.close();
  544 |     });
  545 |
  546 |     test('device orientation changes', async ({ browser }) => {
  547 |       const iPad = devices['iPad Pro'];
  548 |       const context = await browser.newContext({
  549 |         ...iPad,
  550 |         viewport: { width: 1024, height: 1366 } // Portrait
  551 |       });
  552 |       const page = await context.newPage();
  553 |       const auth = new AuthHelper(page);
  554 |       
  555 |       await auth.login(testUsers.developer);
  556 |       await page.goto('/dashboard');
  557 |       
  558 |       // Test portrait layout
  559 |       await expect(page.locator('.sidebar')).toBeVisible();
  560 |       
  561 |       // Switch to landscape
  562 |       await page.setViewportSize({ width: 1366, height: 1024 });
  563 |       
  564 |       // Layout should adapt
  565 |       await page.waitForTimeout(500); // Wait for resize
  566 |       await expect(page.locator('.sidebar')).toBeVisible();
  567 |       
  568 |       // Content area should be wider
  569 |       const contentArea = page.locator('.main-content');
  570 |       const box = await contentArea.boundingBox();
  571 |       if (box) {
  572 |         expect(box.width).toBeGreaterThan(800);
  573 |       }
  574 |       
  575 |       await context.close();
  576 |     });
  577 |   });
  578 | });
```