import { Page, expect } from '@playwright/test';

export class ApplicantHelper {
  constructor(private page: Page) {}

  async createApplicant(applicantData: any) {
    // Navigate to create applicant page
    await this.page.goto('/dashboard/applicants/new');
    
    // Fill personal information
    await this.page.fill('input[name="first_name"]', applicantData.first_name);
    await this.page.fill('input[name="last_name"]', applicantData.last_name);
    await this.page.fill('input[name="email"]', applicantData.email);
    await this.page.fill('input[name="phone"]', applicantData.phone);
    await this.page.fill('input[name="date_of_birth"]', applicantData.date_of_birth);
    await this.page.fill('input[name="ssn_last_four"]', applicantData.ssn_last_four);
    
    // Fill income information
    await this.page.fill('input[name="annual_income"]', applicantData.annual_income.toString());
    await this.page.fill('input[name="household_size"]', applicantData.household_size.toString());
    await this.page.check('input[name="has_dependents"]');
    
    // Fill employment information
    await this.page.selectOption('select[name="employment_status"]', applicantData.employment_status);
    await this.page.fill('input[name="employer_name"]', applicantData.employer_name);
    await this.page.fill('input[name="years_employed"]', applicantData.years_employed.toString());
    
    // Fill housing preferences
    await this.page.selectOption('select[name="credit_score_range"]', applicantData.credit_score_range);
    await this.page.fill('input[name="desired_location"]', applicantData.desired_location);
    await this.page.fill('input[name="max_rent"]', applicantData.max_rent.toString());
    await this.page.fill('input[name="move_in_date"]', applicantData.move_in_date);
    await this.page.selectOption('select[name="preferred_bedroom_count"]', applicantData.preferred_bedroom_count.toString());
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(this.page.locator('.toast-success')).toBeVisible();
    
    // Return to list page
    await this.page.waitForURL('/dashboard/applicants');
  }

  async searchApplicant(searchTerm: string) {
    await this.page.goto('/dashboard/applicants');
    await this.page.fill('input[placeholder*="Search"]', searchTerm);
    await this.page.keyboard.press('Enter');
    
    // Wait for results to update
    await this.page.waitForTimeout(500);
  }

  async viewApplicantDetails(applicantName: string) {
    await this.searchApplicant(applicantName);
    
    // Click on the applicant row
    await this.page.click(`tr:has-text("${applicantName}")`);
    
    // Wait for detail page
    await this.page.waitForURL(/\/dashboard\/applicants\/\d+/);
    
    // Verify details are visible
    await expect(this.page.locator('h1:has-text("Applicant Details")')).toBeVisible();
  }

  async editApplicant(applicantId: string, updates: any) {
    await this.page.goto(`/dashboard/applicants/${applicantId}/edit`);
    
    // Update fields
    for (const [field, value] of Object.entries(updates)) {
      const input = this.page.locator(`input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`);
      
      if (await input.getAttribute('type') === 'checkbox') {
        if (value) {
          await input.check();
        } else {
          await input.uncheck();
        }
      } else if (await input.evaluate(el => el.tagName) === 'SELECT') {
        await input.selectOption(value as string);
      } else {
        await input.fill(value.toString());
      }
    }
    
    // Save changes
    await this.page.click('button:has-text("Save Changes")');
    
    // Wait for success message
    await expect(this.page.locator('.toast-success')).toBeVisible();
  }

  async deleteApplicant(applicantName: string) {
    await this.viewApplicantDetails(applicantName);
    
    // Click delete button
    await this.page.click('button:has-text("Delete")');
    
    // Confirm deletion
    await this.page.click('button:has-text("Confirm Delete")');
    
    // Wait for redirect to list
    await this.page.waitForURL('/dashboard/applicants');
    
    // Verify applicant is removed
    await expect(this.page.locator(`text="${applicantName}"`)).not.toBeVisible();
  }

  async verifyApplicantCount(expectedCount: number) {
    await this.page.goto('/dashboard/applicants');
    const rows = await this.page.locator('tbody tr').count();
    expect(rows).toBe(expectedCount);
  }
}