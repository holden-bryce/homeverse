import { Page, expect } from '@playwright/test';
import { TestUser } from '../fixtures/users';

export class AuthHelper {
  constructor(private page: Page) {}

  async login(user: TestUser) {
    await this.page.goto('/login');
    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for successful login redirect
    await this.page.waitForURL(/\/dashboard/);
    
    // Verify auth token is stored
    const cookies = await this.page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token');
    expect(authCookie).toBeDefined();
  }

  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu-button"]');
    
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for redirect to home page
    await this.page.waitForURL('/');
    
    // Verify auth token is removed
    const cookies = await this.page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token');
    expect(authCookie).toBeUndefined();
  }

  async register(user: TestUser) {
    await this.page.goto('/register');
    
    // Fill registration form
    await this.page.fill('input[name="name"]', user.name);
    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.fill('input[name="confirmPassword"]', user.password);
    
    // Select role if available
    if (await this.page.locator('select[name="role"]').isVisible()) {
      await this.page.selectOption('select[name="role"]', user.role);
    }
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await expect(this.page.locator('.toast-success')).toBeVisible({ timeout: 10000 });
  }

  async verifyRole(expectedRole: string) {
    // Check dashboard URL contains role
    const url = this.page.url();
    expect(url).toContain('/dashboard');
    
    // Check role-specific elements are visible
    switch (expectedRole) {
      case 'super_admin':
        await expect(this.page.locator('[data-testid="admin-menu"]')).toBeVisible();
        break;
      case 'company_admin':
        await expect(this.page.locator('[data-testid="company-settings"]')).toBeVisible();
        break;
      case 'manager':
        await expect(this.page.locator('[data-testid="manager-tools"]')).toBeVisible();
        break;
      case 'staff':
        await expect(this.page.locator('[data-testid="staff-dashboard"]')).toBeVisible();
        break;
      case 'applicant':
        await expect(this.page.locator('[data-testid="housing-search"]')).toBeVisible();
        break;
    }
  }

  async checkAccessDenied() {
    await expect(this.page.locator('text=/Access Denied|Unauthorized|403/')).toBeVisible();
  }
}