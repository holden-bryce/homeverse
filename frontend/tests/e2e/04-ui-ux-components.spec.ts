import { test, expect, devices } from '@playwright/test';
import { testUsers } from '../fixtures/users';
import { AuthHelper } from '../helpers/auth.helper';

test.describe('UI/UX Component Testing', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Wide Screen', width: 2560, height: 1440 }
    ];

    for (const viewport of viewports) {
      test(`responsive layout on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Test landing page
        await page.goto('/');
        
        // Navigation should be accessible
        if (viewport.width < 768) {
          // Mobile menu
          await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
          await page.click('[data-testid="mobile-menu-toggle"]');
          await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
        } else {
          // Desktop menu
          await expect(page.locator('nav.desktop-nav')).toBeVisible();
          await expect(page.locator('[data-testid="mobile-menu-toggle"]')).not.toBeVisible();
        }
        
        // Test dashboard after login
        await authHelper.login(testUsers.developer);
        
        // Sidebar behavior
        if (viewport.width < 1024) {
          // Sidebar should be collapsible on smaller screens
          await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
        } else {
          // Sidebar should be visible by default on larger screens
          await expect(page.locator('.sidebar')).toBeVisible();
        }
        
        // Tables should be scrollable on mobile
        await page.goto('/dashboard/projects');
        if (viewport.width < 768) {
          const table = page.locator('.table-container');
          await expect(table).toHaveCSS('overflow-x', 'auto');
        }
        
        // Forms should stack on mobile
        await page.goto('/dashboard/projects/new');
        if (viewport.width < 768) {
          const formGroups = page.locator('.form-group');
          const firstGroup = formGroups.first();
          const secondGroup = formGroups.nth(1);
          
          const firstBox = await firstGroup.boundingBox();
          const secondBox = await secondGroup.boundingBox();
          
          if (firstBox && secondBox) {
            // Second element should be below first on mobile
            expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
          }
        }
      });
    }

    test('responsive images and media', async ({ page }) => {
      await page.goto('/');
      
      // Test different viewport sizes
      const sizes = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 1920, height: 1080, name: 'desktop' }
      ];
      
      for (const size of sizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        
        // Check hero image
        const heroImage = page.locator('.hero-image, [data-testid="hero-image"]').first();
        if (await heroImage.isVisible()) {
          const src = await heroImage.getAttribute('src');
          const srcset = await heroImage.getAttribute('srcset');
          
          // Should have responsive images
          if (srcset) {
            expect(srcset).toContain('w,');
          }
          
          // Image should fit viewport
          const box = await heroImage.boundingBox();
          if (box) {
            expect(box.width).toBeLessThanOrEqual(size.width);
          }
        }
      }
    });
  });

  test.describe('Accessibility Features', () => {
    test('keyboard navigation', async ({ page }) => {
      await page.goto('/login');
      
      // Tab through form elements
      await page.keyboard.press('Tab'); // Focus email
      await expect(page.locator('input[name="email"]')).toBeFocused();
      
      await page.keyboard.type('developer@test.com');
      await page.keyboard.press('Tab'); // Focus password
      await expect(page.locator('input[name="password"]')).toBeFocused();
      
      await page.keyboard.type('password123');
      await page.keyboard.press('Tab'); // Focus submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();
      
      await page.keyboard.press('Enter'); // Submit form
      await page.waitForURL('/dashboard');
      
      // Test dashboard navigation
      await page.keyboard.press('Tab'); // Should focus first interactive element
      
      // Navigate through menu items
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Verify focus indicator is visible
        const outline = await focusedElement.evaluate(el => 
          window.getComputedStyle(el).outline
        );
        expect(outline).not.toBe('none');
      }
    });

    test('screen reader compatibility', async ({ page }) => {
      await page.goto('/');
      
      // Check for proper ARIA labels
      const navigation = page.locator('nav');
      await expect(navigation).toHaveAttribute('aria-label', /navigation|menu/i);
      
      // Check heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1); // Should have exactly one h1
      
      // Check form labels
      await page.goto('/login');
      const emailInput = page.locator('input[name="email"]');
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();
      await expect(emailInput).toHaveAttribute('aria-label', /.+/);
      
      // Check image alt texts
      const images = page.locator('img');
      const imageCount = await images.count();
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
      
      // Check button accessibility
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    });

    test('color contrast compliance', async ({ page }) => {
      await page.goto('/');
      
      // This is a simplified contrast check
      // In a real scenario, you'd use axe-core or similar
      const elements = await page.$$eval('*', elements => {
        return elements.map(el => {
          const styles = window.getComputedStyle(el);
          const bg = styles.backgroundColor;
          const fg = styles.color;
          const fontSize = parseFloat(styles.fontSize);
          
          return {
            tag: el.tagName,
            bg,
            fg,
            fontSize,
            text: el.textContent?.trim().substring(0, 50)
          };
        }).filter(el => 
          el.bg !== 'rgba(0, 0, 0, 0)' && 
          el.fg !== 'rgba(0, 0, 0, 0)' &&
          el.text
        );
      });
      
      // Verify text is readable (basic check)
      for (const el of elements.slice(0, 10)) {
        if (el.fontSize < 14) {
          // Small text should have higher contrast
          expect(el.fg).not.toBe(el.bg);
        }
      }
    });

    test('focus management in modals', async ({ page }) => {
      await authHelper.login(testUsers.developer);
      await page.goto('/dashboard/projects');
      
      // Open a modal
      await page.click('button:has-text("New Project")');
      
      // Focus should be trapped in modal
      await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
      
      // First focusable element in modal should have focus
      await page.waitForTimeout(500); // Wait for focus
      const focusedElement = page.locator(':focus');
      const modal = page.locator('.modal, [role="dialog"]');
      
      // Tab through modal elements
      let focusInModal = true;
      for (let i = 0; i < 20 && focusInModal; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.locator(':focus').first();
        focusInModal = await focused.evaluate((el, modalEl) => {
          return modalEl.contains(el);
        }, await modal.elementHandle());
      }
      
      // Focus should cycle within modal
      expect(focusInModal).toBe(true);
      
      // ESC should close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Loading States and Skeleton Components', () => {
    test('skeleton loaders during data fetch', async ({ page }) => {
      // Intercept API calls to delay them
      await page.route('**/api/projects', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });
      
      await authHelper.login(testUsers.developer);
      await page.goto('/dashboard/projects');
      
      // Should show skeleton loaders
      await expect(page.locator('.skeleton, [data-testid="skeleton-loader"]')).toBeVisible();
      
      // Wait for real content
      await expect(page.locator('.project-card, tbody tr')).toBeVisible({ timeout: 5000 });
      
      // Skeleton should be gone
      await expect(page.locator('.skeleton, [data-testid="skeleton-loader"]')).not.toBeVisible();
    });

    test('loading spinners for actions', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/applicants/new');
      
      // Fill form
      await page.fill('input[name="first_name"]', 'Test');
      await page.fill('input[name="last_name"]', 'User');
      await page.fill('input[name="email"]', 'test@example.com');
      
      // Intercept submit to delay
      await page.route('**/api/applicants', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });
      
      // Submit and check for loading state
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Button should show loading state
      await expect(submitButton).toBeDisabled();
      await expect(submitButton).toContainText(/saving|loading|processing/i);
      
      // Should re-enable after completion
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
    });

    test('optimistic UI updates', async ({ page }) => {
      await authHelper.login(testUsers.developer);
      await page.goto('/dashboard/projects');
      
      // Find a project to update
      const projectRow = page.locator('tbody tr').first();
      await projectRow.click();
      
      // Edit project
      await page.click('button:has-text("Edit")');
      const availableUnitsInput = page.locator('input[name="available_units"]');
      await availableUnitsInput.clear();
      await availableUnitsInput.fill('50');
      
      // Save changes
      await page.click('button:has-text("Save")');
      
      // UI should update immediately (optimistically)
      await expect(page.locator('text="50 units"')).toBeVisible({ timeout: 1000 });
      
      // Even if API is slow
      await page.route('**/api/projects/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await route.continue();
      });
    });
  });

  test.describe('Error Handling and User Feedback', () => {
    test('form validation feedback', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/applicants/new');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show field-level errors
      await expect(page.locator('.error-message, .invalid-feedback').first()).toBeVisible();
      
      // Fill only some fields
      await page.fill('input[name="first_name"]', 'John');
      await page.click('button[type="submit"]');
      
      // Should update error states
      const firstNameError = page.locator('input[name="first_name"] ~ .error-message');
      await expect(firstNameError).not.toBeVisible();
      
      // Other errors should remain
      const lastNameError = page.locator('input[name="last_name"] ~ .error-message');
      await expect(lastNameError).toBeVisible();
    });

    test('network error handling', async ({ page }) => {
      await authHelper.login(testUsers.developer);
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/dashboard/projects');
      
      // Should show error message
      await expect(page.locator('.error-message, .alert-danger')).toBeVisible();
      await expect(page.locator('text=/failed|error|problem/i')).toBeVisible();
      
      // Should offer retry
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")');
      if (await retryButton.isVisible()) {
        // Restore network
        await page.unroute('**/api/**');
        await retryButton.click();
        
        // Should load successfully
        await expect(page.locator('.project-card, tbody tr')).toBeVisible();
      }
    });

    test('toast notifications', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Test different toast types
      await page.goto('/dashboard/applicants/new');
      
      // Success toast
      await page.fill('input[name="first_name"]', 'Test');
      await page.fill('input[name="last_name"]', 'User');
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.click('button[type="submit"]');
      
      const successToast = page.locator('.toast-success, .toast.success');
      await expect(successToast).toBeVisible();
      await expect(successToast).toContainText(/success|saved|created/i);
      
      // Auto-dismiss
      await expect(successToast).not.toBeVisible({ timeout: 6000 });
      
      // Error toast
      await page.route('**/api/applicants', route => 
        route.fulfill({ status: 400, body: JSON.stringify({ error: 'Validation failed' }) })
      );
      
      await page.click('button[type="submit"]');
      
      const errorToast = page.locator('.toast-error, .toast.error');
      await expect(errorToast).toBeVisible();
      await expect(errorToast).toContainText(/error|failed/i);
    });
  });

  test.describe('Interactive Components', () => {
    test('dropdown menus', async ({ page }) => {
      await authHelper.login(testUsers.manager);
      await page.goto('/dashboard');
      
      // User dropdown
      await page.click('[data-testid="user-menu-button"]');
      const dropdown = page.locator('[data-testid="user-menu-dropdown"]');
      await expect(dropdown).toBeVisible();
      
      // Click outside should close
      await page.click('body', { position: { x: 0, y: 0 } });
      await expect(dropdown).not.toBeVisible();
      
      // Keyboard navigation
      await page.click('[data-testid="user-menu-button"]');
      await page.keyboard.press('ArrowDown');
      await expect(page.locator(':focus')).toContainText(/profile|settings/i);
      
      await page.keyboard.press('Escape');
      await expect(dropdown).not.toBeVisible();
    });

    test('date pickers', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/applicants/new');
      
      const dateInput = page.locator('input[type="date"][name="date_of_birth"]');
      await dateInput.click();
      
      // Should open calendar
      if (await page.locator('.calendar, .date-picker').isVisible()) {
        // Select a date
        await page.click('.calendar-day:has-text("15")');
        
        // Value should be set
        const value = await dateInput.inputValue();
        expect(value).toContain('15');
      } else {
        // Native date picker
        await dateInput.fill('1990-01-15');
        const value = await dateInput.inputValue();
        expect(value).toBe('1990-01-15');
      }
    });

    test('autocomplete/search suggestions', async ({ page }) => {
      await authHelper.login(testUsers.applicant);
      await page.goto('/dashboard/search');
      
      const locationInput = page.locator('input[name="location"]');
      await locationInput.fill('San');
      
      // Should show suggestions
      await expect(page.locator('.suggestions, .autocomplete-results')).toBeVisible({ timeout: 2000 });
      
      // Select suggestion
      await page.click('text="San Francisco"');
      
      // Input should be updated
      await expect(locationInput).toHaveValue(/San Francisco/);
    });

    test('tabs and tab panels', async ({ page }) => {
      await authHelper.login(testUsers.developer);
      await page.goto('/dashboard/settings');
      
      // Check tab navigation
      const tabs = page.locator('[role="tab"]');
      const tabCount = await tabs.count();
      expect(tabCount).toBeGreaterThan(0);
      
      // Click through tabs
      for (let i = 0; i < Math.min(tabCount, 3); i++) {
        const tab = tabs.nth(i);
        await tab.click();
        
        // Tab should be selected
        await expect(tab).toHaveAttribute('aria-selected', 'true');
        
        // Panel should be visible
        const panelId = await tab.getAttribute('aria-controls');
        if (panelId) {
          await expect(page.locator(`#${panelId}`)).toBeVisible();
        }
      }
      
      // Keyboard navigation
      await tabs.first().focus();
      await page.keyboard.press('ArrowRight');
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('Real Device Testing', () => {
    test('touch interactions on mobile', async ({ browser }) => {
      const iPhone = devices['iPhone 12'];
      const context = await browser.newContext({
        ...iPhone,
        hasTouch: true
      });
      const page = await context.newPage();
      const auth = new AuthHelper(page);
      
      await auth.login(testUsers.developer);
      await page.goto('/dashboard/projects');
      
      // Test swipe gestures on tables
      const table = page.locator('.table-container');
      if (await table.isVisible()) {
        // Swipe to scroll horizontally
        await table.dispatchEvent('touchstart', { touches: [{ clientX: 300, clientY: 200 }] });
        await table.dispatchEvent('touchmove', { touches: [{ clientX: 100, clientY: 200 }] });
        await table.dispatchEvent('touchend');
        
        // Table should have scrolled
        const scrollLeft = await table.evaluate(el => el.scrollLeft);
        expect(scrollLeft).toBeGreaterThan(0);
      }
      
      // Test touch targets are large enough
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44 pixels (iOS guideline)
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      await context.close();
    });

    test('device orientation changes', async ({ browser }) => {
      const iPad = devices['iPad Pro'];
      const context = await browser.newContext({
        ...iPad,
        viewport: { width: 1024, height: 1366 } // Portrait
      });
      const page = await context.newPage();
      const auth = new AuthHelper(page);
      
      await auth.login(testUsers.developer);
      await page.goto('/dashboard');
      
      // Test portrait layout
      await expect(page.locator('.sidebar')).toBeVisible();
      
      // Switch to landscape
      await page.setViewportSize({ width: 1366, height: 1024 });
      
      // Layout should adapt
      await page.waitForTimeout(500); // Wait for resize
      await expect(page.locator('.sidebar')).toBeVisible();
      
      // Content area should be wider
      const contentArea = page.locator('.main-content');
      const box = await contentArea.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThan(800);
      }
      
      await context.close();
    });
  });
});