import { Page, expect } from '@playwright/test';

export class ProjectHelper {
  constructor(private page: Page) {}

  async createProject(projectData: any) {
    await this.page.goto('/dashboard/projects/new');
    
    // Fill basic information
    await this.page.fill('input[name="name"]', projectData.name);
    await this.page.fill('textarea[name="description"]', projectData.description);
    
    // Fill location
    await this.page.fill('input[name="address"]', projectData.address);
    await this.page.fill('input[name="city"]', projectData.city);
    await this.page.selectOption('select[name="state"]', projectData.state);
    await this.page.fill('input[name="zip_code"]', projectData.zip_code);
    
    // Fill unit information
    await this.page.fill('input[name="total_units"]', projectData.total_units.toString());
    await this.page.fill('input[name="available_units"]', projectData.available_units.toString());
    
    // Fill income requirements
    await this.page.fill('input[name="ami_percentage"]', projectData.ami_percentage.toString());
    await this.page.fill('input[name="min_income"]', projectData.min_income.toString());
    await this.page.fill('input[name="max_income"]', projectData.max_income.toString());
    
    // Fill other details
    await this.page.fill('input[name="application_fee"]', projectData.application_fee.toString());
    await this.page.fill('input[name="security_deposit"]', projectData.security_deposit.toString());
    await this.page.fill('input[name="application_deadline"]', projectData.application_deadline);
    await this.page.fill('input[name="move_in_date"]', projectData.move_in_date);
    
    // Contact information
    await this.page.fill('input[name="contact_email"]', projectData.contact_email);
    await this.page.fill('input[name="contact_phone"]', projectData.contact_phone);
    
    // Submit
    await this.page.click('button[type="submit"]');
    await expect(this.page.locator('.toast-success')).toBeVisible();
    await this.page.waitForURL('/dashboard/projects');
  }

  async viewProject(projectName: string) {
    await this.page.goto('/dashboard/projects');
    await this.page.click(`text="${projectName}"`);
    await this.page.waitForURL(/\/dashboard\/projects\/\d+/);
    await expect(this.page.locator('h1')).toContainText(projectName);
  }

  async applyToProject(projectName: string, applicationData: any) {
    await this.viewProject(projectName);
    
    // Click apply button
    await this.page.click('button:has-text("Apply Now")');
    
    // Fill application form
    await this.page.fill('textarea[name="cover_letter"]', applicationData.cover_letter || 'I am interested in this property.');
    
    // Upload documents if provided
    if (applicationData.documents) {
      for (const doc of applicationData.documents) {
        await this.page.setInputFiles('input[type="file"]', doc);
      }
    }
    
    // Submit application
    await this.page.click('button:has-text("Submit Application")');
    await expect(this.page.locator('.toast-success')).toBeVisible();
  }

  async reviewApplications(projectName: string) {
    await this.viewProject(projectName);
    await this.page.click('a:has-text("View Applications")');
    await this.page.waitForURL(/\/dashboard\/projects\/\d+\/applications/);
  }

  async approveApplication(applicantName: string) {
    await this.page.click(`tr:has-text("${applicantName}") button:has-text("Approve")`);
    await this.page.click('button:has-text("Confirm")');
    await expect(this.page.locator('.toast-success')).toContainText('approved');
  }

  async rejectApplication(applicantName: string, reason: string) {
    await this.page.click(`tr:has-text("${applicantName}") button:has-text("Reject")`);
    await this.page.fill('textarea[name="rejection_reason"]', reason);
    await this.page.click('button:has-text("Confirm Rejection")');
    await expect(this.page.locator('.toast-success')).toContainText('rejected');
  }
}