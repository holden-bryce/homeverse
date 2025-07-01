# Test info

- Name: Core Feature Workflows >> Communication Features >> in-app notifications
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/02-core-features.spec.ts:394:9

# Error details

```
Error: page.fill: Target page, context or browser has been closed
Call log:
  - waiting for locator('input[name="email"]')

    at AuthHelper.login (/mnt/c/Users/12486/homeverse/frontend/tests/helpers/auth.helper.ts:9:21)
    at /mnt/c/Users/12486/homeverse/frontend/tests/e2e/02-core-features.spec.ts:395:7
```

# Test source

```ts
   1 | import { Page, expect } from '@playwright/test';
   2 | import { TestUser } from '../fixtures/users';
   3 |
   4 | export class AuthHelper {
   5 |   constructor(private page: Page) {}
   6 |
   7 |   async login(user: TestUser) {
   8 |     await this.page.goto('/login');
>  9 |     await this.page.fill('input[name="email"]', user.email);
     |                     ^ Error: page.fill: Target page, context or browser has been closed
  10 |     await this.page.fill('input[name="password"]', user.password);
  11 |     await this.page.click('button[type="submit"]');
  12 |     
  13 |     // Wait for successful login redirect
  14 |     await this.page.waitForURL(/\/dashboard/);
  15 |     
  16 |     // Verify auth token is stored
  17 |     const cookies = await this.page.context().cookies();
  18 |     const authCookie = cookies.find(c => c.name === 'auth-token');
  19 |     expect(authCookie).toBeDefined();
  20 |   }
  21 |
  22 |   async logout() {
  23 |     // Click user menu
  24 |     await this.page.click('[data-testid="user-menu-button"]');
  25 |     
  26 |     // Click logout
  27 |     await this.page.click('[data-testid="logout-button"]');
  28 |     
  29 |     // Wait for redirect to home page
  30 |     await this.page.waitForURL('/');
  31 |     
  32 |     // Verify auth token is removed
  33 |     const cookies = await this.page.context().cookies();
  34 |     const authCookie = cookies.find(c => c.name === 'auth-token');
  35 |     expect(authCookie).toBeUndefined();
  36 |   }
  37 |
  38 |   async register(user: TestUser) {
  39 |     await this.page.goto('/register');
  40 |     
  41 |     // Fill registration form
  42 |     await this.page.fill('input[name="name"]', user.name);
  43 |     await this.page.fill('input[name="email"]', user.email);
  44 |     await this.page.fill('input[name="password"]', user.password);
  45 |     await this.page.fill('input[name="confirmPassword"]', user.password);
  46 |     
  47 |     // Select role if available
  48 |     if (await this.page.locator('select[name="role"]').isVisible()) {
  49 |       await this.page.selectOption('select[name="role"]', user.role);
  50 |     }
  51 |     
  52 |     // Submit form
  53 |     await this.page.click('button[type="submit"]');
  54 |     
  55 |     // Wait for success message or redirect
  56 |     await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
  57 |   }
  58 |
  59 |   async verifyRole(expectedRole: string) {
  60 |     // Check dashboard URL contains role
  61 |     const url = this.page.url();
  62 |     expect(url).toContain('/dashboard');
  63 |     
  64 |     // Check role-specific elements are visible
  65 |     switch (expectedRole) {
  66 |       case 'super_admin':
  67 |         await expect(this.page.locator('[data-testid="admin-menu"]')).toBeVisible();
  68 |         break;
  69 |       case 'company_admin':
  70 |         await expect(this.page.locator('[data-testid="company-settings"]')).toBeVisible();
  71 |         break;
  72 |       case 'manager':
  73 |         await expect(this.page.locator('[data-testid="manager-tools"]')).toBeVisible();
  74 |         break;
  75 |       case 'staff':
  76 |         await expect(this.page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
  77 |         break;
  78 |       case 'applicant':
  79 |         await expect(this.page.locator('[data-testid="housing-search"]')).toBeVisible();
  80 |         break;
  81 |     }
  82 |   }
  83 |
  84 |   async checkAccessDenied() {
  85 |     await expect(this.page.locator('text=/Access Denied|Unauthorized|403/')).toBeVisible();
  86 |   }
  87 | }
```