# Test info

- Name: UI/UX Component Testing >> Loading States and Skeleton Components >> loading spinners for actions
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/04-ui-ux-components.spec.ts:275:9

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
  175 |       const buttons = page.locator('button');
  176 |       const buttonCount = await buttons.count();
  177 |       for (let i = 0; i < Math.min(buttonCount, 5); i++) {
  178 |         const button = buttons.nth(i);
  179 |         const text = await button.textContent();
  180 |         const ariaLabel = await button.getAttribute('aria-label');
  181 |         expect(text || ariaLabel).toBeTruthy();
  182 |       }
  183 |     });
  184 |
  185 |     test('color contrast compliance', async ({ page }) => {
  186 |       await page.goto('/');
  187 |       
  188 |       // This is a simplified contrast check
  189 |       // In a real scenario, you'd use axe-core or similar
  190 |       const elements = await page.$$eval('*', elements => {
  191 |         return elements.map(el => {
  192 |           const styles = window.getComputedStyle(el);
  193 |           const bg = styles.backgroundColor;
  194 |           const fg = styles.color;
  195 |           const fontSize = parseFloat(styles.fontSize);
  196 |           
  197 |           return {
  198 |             tag: el.tagName,
  199 |             bg,
  200 |             fg,
  201 |             fontSize,
  202 |             text: el.textContent?.trim().substring(0, 50)
  203 |           };
  204 |         }).filter(el => 
  205 |           el.bg !== 'rgba(0, 0, 0, 0)' && 
  206 |           el.fg !== 'rgba(0, 0, 0, 0)' &&
  207 |           el.text
  208 |         );
  209 |       });
  210 |       
  211 |       // Verify text is readable (basic check)
  212 |       for (const el of elements.slice(0, 10)) {
  213 |         if (el.fontSize < 14) {
  214 |           // Small text should have higher contrast
  215 |           expect(el.fg).not.toBe(el.bg);
  216 |         }
  217 |       }
  218 |     });
  219 |
  220 |     test('focus management in modals', async ({ page }) => {
  221 |       await authHelper.login(testUsers.developer);
  222 |       await page.goto('/dashboard/projects');
  223 |       
  224 |       // Open a modal
  225 |       await page.click('button:has-text("New Project")');
  226 |       
  227 |       // Focus should be trapped in modal
  228 |       await expect(page.locator('.modal, [role="dialog"]')).toBeVisible();
  229 |       
  230 |       // First focusable element in modal should have focus
  231 |       await page.waitForTimeout(500); // Wait for focus
  232 |       const focusedElement = page.locator(':focus');
  233 |       const modal = page.locator('.modal, [role="dialog"]');
  234 |       
  235 |       // Tab through modal elements
  236 |       let focusInModal = true;
  237 |       for (let i = 0; i < 20 && focusInModal; i++) {
  238 |         await page.keyboard.press('Tab');
  239 |         const focused = await page.locator(':focus').first();
  240 |         focusInModal = await focused.evaluate((el, modalEl) => {
  241 |           return modalEl.contains(el);
  242 |         }, await modal.elementHandle());
  243 |       }
  244 |       
  245 |       // Focus should cycle within modal
  246 |       expect(focusInModal).toBe(true);
  247 |       
  248 |       // ESC should close modal
  249 |       await page.keyboard.press('Escape');
  250 |       await expect(modal).not.toBeVisible();
  251 |     });
  252 |   });
  253 |
  254 |   test.describe('Loading States and Skeleton Components', () => {
  255 |     test('skeleton loaders during data fetch', async ({ page }) => {
  256 |       // Intercept API calls to delay them
  257 |       await page.route('**/api/projects', async route => {
  258 |         await new Promise(resolve => setTimeout(resolve, 2000));
  259 |         await route.continue();
  260 |       });
  261 |       
  262 |       await authHelper.login(testUsers.developer);
  263 |       await page.goto('/dashboard/projects');
  264 |       
  265 |       // Should show skeleton loaders
  266 |       await expect(page.locator('.skeleton, [data-testid="skeleton-loader"]')).toBeVisible();
  267 |       
  268 |       // Wait for real content
  269 |       await expect(page.locator('.project-card, tbody tr')).toBeVisible({ timeout: 5000 });
  270 |       
  271 |       // Skeleton should be gone
  272 |       await expect(page.locator('.skeleton, [data-testid="skeleton-loader"]')).not.toBeVisible();
  273 |     });
  274 |
> 275 |     test('loading spinners for actions', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  276 |       await authHelper.login(testUsers.staff);
  277 |       await page.goto('/dashboard/applicants/new');
  278 |       
  279 |       // Fill form
  280 |       await page.fill('input[name="first_name"]', 'Test');
  281 |       await page.fill('input[name="last_name"]', 'User');
  282 |       await page.fill('input[name="email"]', 'test@example.com');
  283 |       
  284 |       // Intercept submit to delay
  285 |       await page.route('**/api/applicants', async route => {
  286 |         await new Promise(resolve => setTimeout(resolve, 1000));
  287 |         await route.continue();
  288 |       });
  289 |       
  290 |       // Submit and check for loading state
  291 |       const submitButton = page.locator('button[type="submit"]');
  292 |       await submitButton.click();
  293 |       
  294 |       // Button should show loading state
  295 |       await expect(submitButton).toBeDisabled();
  296 |       await expect(submitButton).toContainText(/saving|loading|processing/i);
  297 |       
  298 |       // Should re-enable after completion
  299 |       await expect(submitButton).toBeEnabled({ timeout: 5000 });
  300 |     });
  301 |
  302 |     test('optimistic UI updates', async ({ page }) => {
  303 |       await authHelper.login(testUsers.developer);
  304 |       await page.goto('/dashboard/projects');
  305 |       
  306 |       // Find a project to update
  307 |       const projectRow = page.locator('tbody tr').first();
  308 |       await projectRow.click();
  309 |       
  310 |       // Edit project
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
```