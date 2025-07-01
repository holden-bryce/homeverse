import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export class FileHelper {
  constructor(private page: Page) {}

  async uploadFile(selector: string, fileName: string, content?: string) {
    // Create temporary file if content is provided
    let filePath = fileName;
    
    if (content) {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, content);
    }
    
    // Upload file
    await this.page.setInputFiles(selector, filePath);
    
    // Clean up temp file
    if (content && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async downloadFile(downloadTriggerSelector: string): Promise<string> {
    // Start waiting for download
    const downloadPromise = this.page.waitForEvent('download');
    
    // Trigger download
    await this.page.click(downloadTriggerSelector);
    
    // Wait for download to complete
    const download = await downloadPromise;
    
    // Save to temp directory
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const filePath = path.join(tempDir, download.suggestedFilename());
    await download.saveAs(filePath);
    
    // Read and return content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Clean up
    fs.unlinkSync(filePath);
    
    return content;
  }

  async verifyFileEncryption(selector: string) {
    // Upload a test file with sensitive data
    const sensitiveData = 'SSN: 123-45-6789, Credit Card: 4111-1111-1111-1111';
    await this.uploadFile(selector, 'sensitive.txt', sensitiveData);
    
    // Wait for upload to complete
    await expect(this.page.locator('.upload-success')).toBeVisible();
    
    // Download the file back
    const downloadedContent = await this.downloadFile('button:has-text("Download")');
    
    // Verify content is encrypted (should not contain plain text sensitive data)
    expect(downloadedContent).not.toContain('123-45-6789');
    expect(downloadedContent).not.toContain('4111-1111-1111-1111');
  }

  async testFileTypeValidation(selector: string) {
    const testCases = [
      { file: 'document.pdf', shouldPass: true },
      { file: 'image.jpg', shouldPass: true },
      { file: 'spreadsheet.xlsx', shouldPass: true },
      { file: 'script.exe', shouldPass: false },
      { file: 'malware.bat', shouldPass: false },
    ];
    
    for (const testCase of testCases) {
      await this.uploadFile(selector, testCase.file, 'test content');
      
      if (testCase.shouldPass) {
        await expect(this.page.locator('.upload-success')).toBeVisible();
      } else {
        await expect(this.page.locator('.upload-error')).toBeVisible();
        await expect(this.page.locator('.upload-error')).toContainText(/file type|not allowed/i);
      }
      
      // Clear any messages
      await this.page.reload();
    }
  }

  async testFileSizeLimit(selector: string) {
    // Create a large file (over 10MB)
    const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
    await this.uploadFile(selector, 'large-file.txt', largeContent);
    
    // Verify error
    await expect(this.page.locator('.upload-error')).toBeVisible();
    await expect(this.page.locator('.upload-error')).toContainText(/size|too large|exceeds/i);
  }
}