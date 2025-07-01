# Test info

- Name: UI/UX Component Testing >> Accessibility Features >> color contrast compliance
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/04-ui-ux-components.spec.ts:185:9

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
  112 |     test('keyboard navigation', async ({ page }) => {
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
> 185 |     test('color contrast compliance', async ({ page }) => {
      |         ^ Error: browserType.launch: 
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
  275 |     test('loading spinners for actions', async ({ page }) => {
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
```