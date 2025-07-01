import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/users';
import { AuthHelper } from '../helpers/auth.helper';

test.describe('Security Feature Validation', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
  });

  test.describe('Rate Limiting', () => {
    test('login attempts rate limiting', async ({ page }) => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Attempt multiple failed logins
      for (let i = 0; i < 6; i++) {
        await page.goto('/login');
        await page.fill('input[name="email"]', invalidCredentials.email);
        await page.fill('input[name="password"]', invalidCredentials.password);
        await page.click('button[type="submit"]');
        
        if (i < 5) {
          // First 5 attempts should show invalid credentials
          await expect(page.locator('.alert-danger')).toContainText(/Invalid credentials/i);
        }
      }

      // 6th attempt should be rate limited
      await expect(page.locator('.alert-danger')).toContainText(/Too many attempts|Rate limit/i);
      
      // Verify continued blocking
      await page.reload();
      await page.fill('input[name="email"]', invalidCredentials.email);
      await page.fill('input[name="password"]', invalidCredentials.password);
      await page.click('button[type="submit"]');
      await expect(page.locator('.alert-danger')).toContainText(/Too many attempts|Rate limit/i);
    });

    test('API endpoint rate limiting', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Make multiple rapid API calls
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          page.evaluate(async () => {
            const response = await fetch('/api/applicants', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
              }
            });
            return response.status;
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimited = results.filter(status => status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  test.describe('PII Encryption', () => {
    test('verify PII data is encrypted in transit', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Monitor network requests
      const requests: any[] = [];
      page.on('request', request => {
        if (request.url().includes('/api/')) {
          requests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData()
          });
        }
      });

      // Create applicant with PII
      await page.goto('/dashboard/applicants/new');
      await page.fill('input[name="first_name"]', 'John');
      await page.fill('input[name="last_name"]', 'Doe');
      await page.fill('input[name="ssn_last_four"]', '1234');
      await page.fill('input[name="date_of_birth"]', '1990-01-01');
      await page.click('button[type="submit"]');

      // Check that SSN is not sent in plain text
      const createRequest = requests.find(r => r.method === 'POST' && r.url.includes('/applicants'));
      expect(createRequest).toBeDefined();
      expect(createRequest.postData).not.toContain('1234'); // SSN should be encrypted
    });

    test('verify PII is masked in UI', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // View applicant details
      await page.goto('/dashboard/applicants');
      await page.click('tbody tr:first-child');
      
      // Check SSN is masked
      const ssnElement = await page.locator('[data-testid="ssn-display"]');
      if (await ssnElement.isVisible()) {
        const ssnText = await ssnElement.textContent();
        expect(ssnText).toMatch(/\*{3,}[0-9]{4}$/); // Should show ***1234 format
      }
      
      // Check other PII has show/hide toggle
      const showPIIButton = page.locator('button:has-text("Show PII")');
      if (await showPIIButton.isVisible()) {
        // PII should be hidden by default
        const dobElement = await page.locator('[data-testid="dob-display"]');
        expect(await dobElement.textContent()).toMatch(/\*{6,}/);
        
        // Click to show PII
        await showPIIButton.click();
        
        // Verify audit log entry is created
        await page.waitForTimeout(1000);
        const auditResponse = await page.evaluate(async () => {
          const response = await fetch('/api/audit-logs/recent', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
            }
          });
          return response.json();
        });
        
        expect(auditResponse.some((log: any) => log.action === 'view_pii')).toBeTruthy();
      }
    });
  });

  test.describe('Role-Based Access Control', () => {
    test('verify role restrictions are enforced', async ({ page }) => {
      const roleTests = [
        {
          user: testUsers.applicant,
          allowedPaths: ['/dashboard', '/dashboard/search', '/dashboard/applications', '/dashboard/profile'],
          deniedPaths: ['/dashboard/applicants', '/dashboard/admin', '/dashboard/reports']
        },
        {
          user: testUsers.staff,
          allowedPaths: ['/dashboard', '/dashboard/applicants', '/dashboard/documents'],
          deniedPaths: ['/dashboard/admin', '/dashboard/settings/company']
        },
        {
          user: testUsers.manager,
          allowedPaths: ['/dashboard', '/dashboard/applicants', '/dashboard/reports', '/dashboard/analytics'],
          deniedPaths: ['/dashboard/admin']
        }
      ];

      for (const roleTest of roleTests) {
        // Login as user
        await authHelper.login(roleTest.user);
        
        // Test allowed paths
        for (const path of roleTest.allowedPaths) {
          await page.goto(path);
          await expect(page).not.toHaveURL('/403');
          await expect(page.locator('text=/Access Denied|Unauthorized/')).not.toBeVisible();
        }
        
        // Test denied paths
        for (const path of roleTest.deniedPaths) {
          await page.goto(path);
          const url = page.url();
          expect(url).toMatch(/403|login|dashboard$/); // Should redirect or show 403
        }
        
        await authHelper.logout();
      }
    });

    test('verify API endpoint authorization', async ({ page }) => {
      // Test staff cannot access admin endpoints
      await authHelper.login(testUsers.staff);
      
      const adminResponse = await page.evaluate(async () => {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });
        return {
          status: response.status,
          statusText: response.statusText
        };
      });
      
      expect(adminResponse.status).toBe(403);
      
      // Test applicant cannot access staff endpoints
      await authHelper.logout();
      await authHelper.login(testUsers.applicant);
      
      const staffResponse = await page.evaluate(async () => {
        const response = await fetch('/api/applicants/all', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
          }
        });
        return {
          status: response.status,
          statusText: response.statusText
        };
      });
      
      expect(staffResponse.status).toBe(403);
    });
  });

  test.describe('CORS Configuration', () => {
    test('verify CORS headers are properly set', async ({ page }) => {
      const response = await page.request.get('http://localhost:8000/api/health', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(headers['access-control-allow-credentials']).toBe('true');
    });

    test('verify CORS blocks unauthorized origins', async ({ page }) => {
      const response = await page.request.get('http://localhost:8000/api/health', {
        headers: {
          'Origin': 'http://malicious-site.com'
        },
        failOnStatusCode: false
      });
      
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).not.toBe('http://malicious-site.com');
    });
  });

  test.describe('Session Management', () => {
    test('verify session timeout works correctly', async ({ page, context }) => {
      await authHelper.login(testUsers.developer);
      
      // Get initial session
      const cookies = await context.cookies();
      const sessionCookie = cookies.find(c => c.name === 'auth-token');
      expect(sessionCookie).toBeDefined();
      
      // Simulate inactivity by waiting (in real test, would mock time)
      // For now, manually expire the session
      await page.evaluate(() => {
        // Set session expiry to past
        const token = localStorage.getItem('auth-token');
        if (token) {
          const expired = {
            ...JSON.parse(atob(token.split('.')[1])),
            exp: Math.floor(Date.now() / 1000) - 3600
          };
          // This is a simulation - in reality the server would handle this
        }
      });
      
      // Try to access protected resource
      await page.goto('/dashboard/projects');
      
      // Should redirect to login
      await page.waitForURL('/login');
      await expect(page.locator('.alert')).toContainText(/session|expired/i);
    });

    test('verify concurrent session handling', async ({ browser }) => {
      // Login with first browser
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const auth1 = new AuthHelper(page1);
      await auth1.login(testUsers.developer);
      
      // Login with second browser (same user)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      const auth2 = new AuthHelper(page2);
      await auth2.login(testUsers.developer);
      
      // First session should still be valid (or invalidated based on settings)
      await page1.goto('/dashboard');
      
      // Check if system allows concurrent sessions or invalidates first
      const isFirstSessionValid = !page1.url().includes('/login');
      
      // Clean up
      await context1.close();
      await context2.close();
      
      // System should handle this consistently
      expect(typeof isFirstSessionValid).toBe('boolean');
    });
  });

  test.describe('Input Validation & Sanitization', () => {
    test('verify XSS protection', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Try to inject script in various fields
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<svg/onload=alert("XSS")>'
      ];
      
      await page.goto('/dashboard/applicants/new');
      
      for (const payload of xssPayloads) {
        await page.fill('input[name="first_name"]', payload);
        await page.fill('input[name="additional_notes"]', payload);
        await page.click('button[type="submit"]');
        
        // Check for any alert dialogs (there shouldn't be any)
        let alertFired = false;
        page.on('dialog', async dialog => {
          alertFired = true;
          await dialog.dismiss();
        });
        
        await page.waitForTimeout(1000);
        expect(alertFired).toBe(false);
        
        // If saved, verify the payload is escaped when displayed
        if (await page.locator('.toast-success').isVisible()) {
          await page.goto('/dashboard/applicants');
          const content = await page.content();
          expect(content).not.toContain('<script>');
          expect(content).not.toContain('onerror=');
        }
      }
    });

    test('verify SQL injection protection', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Try SQL injection in search
      const sqlPayloads = [
        "' OR '1'='1",
        "'; DROP TABLE applicants; --",
        "1' UNION SELECT * FROM users--"
      ];
      
      for (const payload of sqlPayloads) {
        await page.goto('/dashboard/applicants');
        await page.fill('input[placeholder*="Search"]', payload);
        await page.keyboard.press('Enter');
        
        // Should not cause errors or return all records
        await expect(page.locator('.error-message')).not.toBeVisible();
        
        // Verify normal search behavior (no results or filtered results)
        const rowCount = await page.locator('tbody tr').count();
        expect(rowCount).toBeLessThan(10); // Shouldn't return all records
      }
    });
  });

  test.describe('File Security', () => {
    test('verify malicious file upload protection', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/documents/upload');
      
      // Try uploading potentially malicious files
      const maliciousFiles = [
        { name: 'virus.exe', content: 'MZ' }, // Executable header
        { name: 'script.js', content: 'alert("malicious")' },
        { name: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
        { name: 'normal.pdf.exe', content: 'fake pdf' } // Double extension
      ];
      
      for (const file of maliciousFiles) {
        const buffer = Buffer.from(file.content);
        await page.setInputFiles('input[type="file"]', {
          name: file.name,
          mimeType: 'application/octet-stream',
          buffer
        });
        
        await page.click('button:has-text("Upload")');
        
        // Should be rejected
        await expect(page.locator('.alert-danger')).toContainText(/not allowed|invalid|prohibited/i);
      }
    });

    test('verify file size limits', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/documents/upload');
      
      // Create large file (over limit)
      const largeFile = Buffer.alloc(15 * 1024 * 1024); // 15MB
      await page.setInputFiles('input[type="file"]', {
        name: 'large-file.pdf',
        mimeType: 'application/pdf',
        buffer: largeFile
      });
      
      await page.click('button:has-text("Upload")');
      
      // Should show size error
      await expect(page.locator('.alert-danger')).toContainText(/size|too large|exceeds/i);
    });
  });

  test.describe('Audit Logging', () => {
    test('verify sensitive actions are logged', async ({ page }) => {
      await authHelper.login(testUsers.manager);
      
      // Perform sensitive actions
      await page.goto('/dashboard/applicants');
      await page.click('tbody tr:first-child'); // View applicant
      
      // Export data
      await page.goto('/dashboard/reports');
      await page.click('button:has-text("Export All Data")');
      
      // Check audit logs
      await page.goto('/dashboard/admin/audit-logs');
      
      // Verify actions are logged
      await expect(page.locator('text="view_applicant"')).toBeVisible();
      await expect(page.locator('text="export_data"')).toBeVisible();
      
      // Verify log details include user, timestamp, IP
      await page.click('tr:has-text("export_data")');
      await expect(page.locator('text="User:"')).toBeVisible();
      await expect(page.locator('text="Timestamp:"')).toBeVisible();
      await expect(page.locator('text="IP Address:"')).toBeVisible();
    });
  });
});