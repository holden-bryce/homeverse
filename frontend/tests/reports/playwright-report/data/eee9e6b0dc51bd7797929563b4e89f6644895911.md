# Test info

- Name: UI/UX Component Testing >> Accessibility Features >> keyboard navigation
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/04-ui-ux-components.spec.ts:112:9

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
   12 |   test.describe('Responsive Design', () => {
   13 |     const viewports = [
   14 |       { name: 'Mobile Portrait', width: 375, height: 667 },
   15 |       { name: 'Mobile Landscape', width: 667, height: 375 },
   16 |       { name: 'Tablet Portrait', width: 768, height: 1024 },
   17 |       { name: 'Tablet Landscape', width: 1024, height: 768 },
   18 |       { name: 'Desktop', width: 1920, height: 1080 },
   19 |       { name: 'Wide Screen', width: 2560, height: 1440 }
   20 |     ];
   21 |
   22 |     for (const viewport of viewports) {
   23 |       test(`responsive layout on ${viewport.name}`, async ({ page }) => {
   24 |         await page.setViewportSize({ width: viewport.width, height: viewport.height });
   25 |         
   26 |         // Test landing page
   27 |         await page.goto('/');
   28 |         
   29 |         // Navigation should be accessible
   30 |         if (viewport.width < 768) {
   31 |           // Mobile menu
   32 |           await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
   33 |           await page.click('[data-testid="mobile-menu-toggle"]');
   34 |           await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
   35 |         } else {
   36 |           // Desktop menu
   37 |           await expect(page.locator('nav.desktop-nav')).toBeVisible();
   38 |           await expect(page.locator('[data-testid="mobile-menu-toggle"]')).not.toBeVisible();
   39 |         }
   40 |         
   41 |         // Test dashboard after login
   42 |         await authHelper.login(testUsers.developer);
   43 |         
   44 |         // Sidebar behavior
   45 |         if (viewport.width < 1024) {
   46 |           // Sidebar should be collapsible on smaller screens
   47 |           await expect(page.locator('[data-testid="sidebar-toggle"]')).toBeVisible();
   48 |         } else {
   49 |           // Sidebar should be visible by default on larger screens
   50 |           await expect(page.locator('.sidebar')).toBeVisible();
   51 |         }
   52 |         
   53 |         // Tables should be scrollable on mobile
   54 |         await page.goto('/dashboard/projects');
   55 |         if (viewport.width < 768) {
   56 |           const table = page.locator('.table-container');
   57 |           await expect(table).toHaveCSS('overflow-x', 'auto');
   58 |         }
   59 |         
   60 |         // Forms should stack on mobile
   61 |         await page.goto('/dashboard/projects/new');
   62 |         if (viewport.width < 768) {
   63 |           const formGroups = page.locator('.form-group');
   64 |           const firstGroup = formGroups.first();
   65 |           const secondGroup = formGroups.nth(1);
   66 |           
   67 |           const firstBox = await firstGroup.boundingBox();
   68 |           const secondBox = await secondGroup.boundingBox();
   69 |           
   70 |           if (firstBox && secondBox) {
   71 |             // Second element should be below first on mobile
   72 |             expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height);
   73 |           }
   74 |         }
   75 |       });
   76 |     }
   77 |
   78 |     test('responsive images and media', async ({ page }) => {
   79 |       await page.goto('/');
   80 |       
   81 |       // Test different viewport sizes
   82 |       const sizes = [
   83 |         { width: 375, height: 667, name: 'mobile' },
   84 |         { width: 1920, height: 1080, name: 'desktop' }
   85 |       ];
   86 |       
   87 |       for (const size of sizes) {
   88 |         await page.setViewportSize({ width: size.width, height: size.height });
   89 |         
   90 |         // Check hero image
   91 |         const heroImage = page.locator('.hero-image, [data-testid="hero-image"]').first();
   92 |         if (await heroImage.isVisible()) {
   93 |           const src = await heroImage.getAttribute('src');
   94 |           const srcset = await heroImage.getAttribute('srcset');
   95 |           
   96 |           // Should have responsive images
   97 |           if (srcset) {
   98 |             expect(srcset).toContain('w,');
   99 |           }
  100 |           
  101 |           // Image should fit viewport
  102 |           const box = await heroImage.boundingBox();
  103 |           if (box) {
  104 |             expect(box.width).toBeLessThanOrEqual(size.width);
  105 |           }
  106 |         }
  107 |       }
  108 |     });
  109 |   });
  110 |
  111 |   test.describe('Accessibility Features', () => {
> 112 |     test('keyboard navigation', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  113 |       await page.goto('/login');
  114 |       
  115 |       // Tab through form elements
  116 |       await page.keyboard.press('Tab'); // Focus email
  117 |       await expect(page.locator('input[name="email"]')).toBeFocused();
  118 |       
  119 |       await page.keyboard.type('developer@test.com');
  120 |       await page.keyboard.press('Tab'); // Focus password
  121 |       await expect(page.locator('input[name="password"]')).toBeFocused();
  122 |       
  123 |       await page.keyboard.type('password123');
  124 |       await page.keyboard.press('Tab'); // Focus submit button
  125 |       await expect(page.locator('button[type="submit"]')).toBeFocused();
  126 |       
  127 |       await page.keyboard.press('Enter'); // Submit form
  128 |       await page.waitForURL('/dashboard');
  129 |       
  130 |       // Test dashboard navigation
  131 |       await page.keyboard.press('Tab'); // Should focus first interactive element
  132 |       
  133 |       // Navigate through menu items
  134 |       for (let i = 0; i < 5; i++) {
  135 |         await page.keyboard.press('Tab');
  136 |         const focusedElement = page.locator(':focus');
  137 |         await expect(focusedElement).toBeVisible();
  138 |         
  139 |         // Verify focus indicator is visible
  140 |         const outline = await focusedElement.evaluate(el => 
  141 |           window.getComputedStyle(el).outline
  142 |         );
  143 |         expect(outline).not.toBe('none');
  144 |       }
  145 |     });
  146 |
  147 |     test('screen reader compatibility', async ({ page }) => {
  148 |       await page.goto('/');
  149 |       
  150 |       // Check for proper ARIA labels
  151 |       const navigation = page.locator('nav');
  152 |       await expect(navigation).toHaveAttribute('aria-label', /navigation|menu/i);
  153 |       
  154 |       // Check heading hierarchy
  155 |       const h1Count = await page.locator('h1').count();
  156 |       expect(h1Count).toBe(1); // Should have exactly one h1
  157 |       
  158 |       // Check form labels
  159 |       await page.goto('/login');
  160 |       const emailInput = page.locator('input[name="email"]');
  161 |       const emailLabel = page.locator('label[for="email"]');
  162 |       await expect(emailLabel).toBeVisible();
  163 |       await expect(emailInput).toHaveAttribute('aria-label', /.+/);
  164 |       
  165 |       // Check image alt texts
  166 |       const images = page.locator('img');
  167 |       const imageCount = await images.count();
  168 |       for (let i = 0; i < imageCount; i++) {
  169 |         const img = images.nth(i);
  170 |         const alt = await img.getAttribute('alt');
  171 |         expect(alt).toBeTruthy();
  172 |       }
  173 |       
  174 |       // Check button accessibility
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
```