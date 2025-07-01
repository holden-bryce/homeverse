import { test, expect } from '@playwright/test';
import { testUsers, testApplicant, testProject } from '../fixtures/users';
import { AuthHelper } from '../helpers/auth.helper';
import { PerformanceHelper } from '../helpers/performance.helper';

test.describe('Integration & Performance Testing', () => {
  let authHelper: AuthHelper;
  let performanceHelper: PerformanceHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    performanceHelper = new PerformanceHelper(page);
  });

  test.describe('Supabase Integration', () => {
    test('database operations performance', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      const operations = {
        'List Applicants': async () => {
          await page.goto('/dashboard/applicants');
          await page.waitForSelector('tbody tr, .no-data');
        },
        'Create Applicant': async () => {
          await page.goto('/dashboard/applicants/new');
          await page.fill('input[name="first_name"]', `Perf${Date.now()}`);
          await page.fill('input[name="last_name"]', 'Test');
          await page.fill('input[name="email"]', `perf${Date.now()}@test.com`);
          await page.click('button[type="submit"]');
          await page.waitForURL('/dashboard/applicants');
        },
        'Search Applicants': async () => {
          await page.goto('/dashboard/applicants');
          await page.fill('input[placeholder*="Search"]', 'Test');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        },
        'Filter Applicants': async () => {
          await page.goto('/dashboard/applicants');
          await page.click('button:has-text("Filters")');
          await page.selectOption('select[name="status"]', 'active');
          await page.click('button:has-text("Apply")');
          await page.waitForTimeout(500);
        }
      };
      
      const metrics: Record<string, number> = {};
      
      for (const [operation, action] of Object.entries(operations)) {
        const time = await performanceHelper.measureApiResponse(action);
        metrics[operation] = time;
        
        // Operations should complete within reasonable time
        expect(time).toBeLessThan(3000); // 3 seconds max
      }
      
      console.log('Database Operation Performance:', metrics);
    });

    test('real-time subscriptions', async ({ page }) => {
      // Open two browser tabs
      const page1 = page;
      const context = page.context();
      const page2 = await context.newPage();
      
      // Login in both tabs
      const auth1 = new AuthHelper(page1);
      const auth2 = new AuthHelper(page2);
      
      await auth1.login(testUsers.staff);
      await auth2.login(testUsers.manager);
      
      // Navigate to applicants list in both
      await page1.goto('/dashboard/applicants');
      await page2.goto('/dashboard/applicants');
      
      // Count initial applicants in page2
      const initialCount = await page2.locator('tbody tr').count();
      
      // Create applicant in page1
      await page1.goto('/dashboard/applicants/new');
      const uniqueName = `Realtime${Date.now()}`;
      await page1.fill('input[name="first_name"]', uniqueName);
      await page1.fill('input[name="last_name"]', 'Test');
      await page1.fill('input[name="email"]', `${uniqueName}@test.com`);
      await page1.click('button[type="submit"]');
      
      // Check if page2 receives update (within 5 seconds)
      await page2.waitForTimeout(2000);
      const newCount = await page2.locator('tbody tr').count();
      
      // Should see the new applicant
      expect(newCount).toBe(initialCount + 1);
      await expect(page2.locator(`text="${uniqueName}"`)).toBeVisible();
      
      await page2.close();
    });

    test('file storage integration', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/documents');
      
      // Upload file to Supabase storage
      const fileName = `test-${Date.now()}.pdf`;
      await page.click('button:has-text("Upload")');
      await page.setInputFiles('input[type="file"]', {
        name: fileName,
        mimeType: 'application/pdf',
        buffer: Buffer.from('Test PDF content for Supabase storage')
      });
      await page.selectOption('select[name="document_type"]', 'other');
      await page.click('button:has-text("Confirm Upload")');
      
      // Verify upload success
      await expect(page.locator('.toast-success')).toBeVisible();
      
      // Verify file appears in list
      await expect(page.locator(`text="${fileName}"`)).toBeVisible();
      
      // Download file
      const downloadPromise = page.waitForEvent('download');
      await page.click(`tr:has-text("${fileName}") button:has-text("Download")`);
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toBe(fileName);
    });
  });

  test.describe('SendGrid Email Integration', () => {
    test('email delivery tracking', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      // Send test email
      await page.goto('/dashboard/communications');
      await page.click('button:has-text("New Email")');
      
      const testEmail = `test${Date.now()}@example.com`;
      await page.fill('input[name="to"]', testEmail);
      await page.fill('input[name="subject"]', 'Integration Test Email');
      await page.fill('textarea[name="body"]', 'This is a test email from integration tests.');
      
      await page.click('button:has-text("Send")');
      
      // Should show success
      await expect(page.locator('.toast-success')).toContainText(/sent|queued/i);
      
      // Check email status
      await page.click('a:has-text("View Sent")');
      await expect(page.locator(`td:has-text("${testEmail}")`)).toBeVisible();
      
      // Status should update (delivered, opened, etc)
      const statusCell = page.locator(`tr:has-text("${testEmail}") td.status`);
      const status = await statusCell.textContent();
      expect(['queued', 'sent', 'delivered']).toContain(status?.toLowerCase());
    });

    test('email template processing', async ({ page }) => {
      await authHelper.login(testUsers.manager);
      
      // Use email template
      await page.goto('/dashboard/communications/templates');
      await page.click('text="Application Approved"');
      
      // Verify template variables
      await expect(page.locator('text="{{applicant_name}}"')).toBeVisible();
      await expect(page.locator('text="{{project_name}}"')).toBeVisible();
      
      // Send with template
      await page.click('button:has-text("Use Template")');
      await page.fill('input[name="applicant_name"]', 'John Doe');
      await page.fill('input[name="project_name"]', 'Green Valley Apartments');
      await page.fill('input[name="to"]', 'john.doe@example.com');
      
      // Preview should show processed template
      await page.click('button:has-text("Preview")');
      await expect(page.locator('.preview-content')).toContainText('John Doe');
      await expect(page.locator('.preview-content')).toContainText('Green Valley Apartments');
      
      // Send
      await page.click('button:has-text("Send")');
      await expect(page.locator('.toast-success')).toBeVisible();
    });
  });

  test.describe('Mapbox Integration', () => {
    test('map rendering performance', async ({ page }) => {
      await authHelper.login(testUsers.lender);
      
      const startTime = Date.now();
      await page.goto('/dashboard/map');
      
      // Wait for map to load
      await page.waitForSelector('.mapboxgl-map', { timeout: 10000 });
      
      const mapLoadTime = Date.now() - startTime;
      expect(mapLoadTime).toBeLessThan(5000); // Map should load within 5 seconds
      
      // Verify map controls
      await expect(page.locator('.mapboxgl-ctrl-zoom-in')).toBeVisible();
      await expect(page.locator('.mapboxgl-ctrl-zoom-out')).toBeVisible();
      
      // Test map interactions
      await page.click('.mapboxgl-ctrl-zoom-in');
      await page.waitForTimeout(500);
      
      // Pan map
      await page.mouse.move(400, 300);
      await page.mouse.down();
      await page.mouse.move(500, 400);
      await page.mouse.up();
      
      // Markers should be visible
      await expect(page.locator('.mapboxgl-marker').first()).toBeVisible();
    });

    test('project location clustering', async ({ page }) => {
      await authHelper.login(testUsers.developer);
      await page.goto('/dashboard/map');
      
      // Wait for map and clusters
      await page.waitForSelector('.mapboxgl-map');
      await page.waitForTimeout(2000); // Wait for markers to load
      
      // Look for cluster markers
      const clusters = page.locator('.marker-cluster');
      if (await clusters.count() > 0) {
        // Click on a cluster
        await clusters.first().click();
        
        // Map should zoom in
        await page.waitForTimeout(1000);
        
        // Should show individual markers or smaller clusters
        const markersAfterZoom = await page.locator('.mapboxgl-marker').count();
        expect(markersAfterZoom).toBeGreaterThan(0);
      }
      
      // Test filter interaction
      await page.selectOption('select[name="bedroom_filter"]', '2');
      await page.waitForTimeout(1000);
      
      // Markers should update
      const filteredMarkers = await page.locator('.mapboxgl-marker').count();
      expect(filteredMarkers).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Performance Benchmarks', () => {
    test('page load performance metrics', async ({ page }) => {
      const pages = [
        { name: 'Landing Page', url: '/' },
        { name: 'Login Page', url: '/login' },
        { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
        { name: 'Applicants List', url: '/dashboard/applicants', requiresAuth: true },
        { name: 'Projects List', url: '/dashboard/projects', requiresAuth: true },
        { name: 'Analytics', url: '/dashboard/analytics', requiresAuth: true }
      ];
      
      const metrics: Record<string, any> = {};
      
      for (const pageInfo of pages) {
        if (pageInfo.requiresAuth && !page.url().includes('/dashboard')) {
          await authHelper.login(testUsers.developer);
        }
        
        const pageMetrics = await performanceHelper.measurePageLoad(
          pageInfo.requiresAuth ? pageInfo.url : `http://localhost:3000${pageInfo.url}`
        );
        
        metrics[pageInfo.name] = pageMetrics;
        
        // Assert performance thresholds
        await performanceHelper.assertPerformanceThresholds(pageMetrics);
      }
      
      // Generate report
      await performanceHelper.generatePerformanceReport(metrics);
    });

    test('concurrent user load testing', async ({ page }) => {
      // Test with 10 concurrent users
      const scenario = async (page: any) => {
        const auth = new AuthHelper(page);
        await auth.login(testUsers.developer);
        
        // Perform typical user actions
        await page.goto('/dashboard/projects');
        await page.waitForSelector('tbody tr, .no-data');
        
        await page.goto('/dashboard/applicants');
        await page.waitForSelector('tbody tr, .no-data');
        
        await page.fill('input[placeholder*="Search"]', 'Test');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        return true;
      };
      
      const results = await performanceHelper.testConcurrentUsers(scenario, 10);
      
      console.log('Concurrent User Test Results:');
      console.log(`Total Time: ${results.totalTime}ms`);
      console.log(`Average Time per User: ${results.averageTime}ms`);
      
      // Average time should be reasonable even with concurrent users
      expect(results.averageTime).toBeLessThan(10000); // 10 seconds max
    });

    test('API endpoint performance', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      
      const endpoints = [
        { name: 'List Applicants', url: '/api/applicants', method: 'GET' },
        { name: 'List Projects', url: '/api/projects', method: 'GET' },
        { name: 'Get Analytics', url: '/api/analytics/summary', method: 'GET' },
        { name: 'Search Applicants', url: '/api/applicants/search?q=test', method: 'GET' }
      ];
      
      for (const endpoint of endpoints) {
        const times = await performanceHelper.stressTest(async () => {
          const response = await page.evaluate(async ({ url, method }) => {
            const start = Date.now();
            const response = await fetch(`http://localhost:8000${url}`, {
              method,
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
              }
            });
            const end = Date.now();
            return {
              status: response.status,
              time: end - start
            };
          }, endpoint);
          
          return response;
        }, 20); // 20 requests
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const maxTime = Math.max(...times);
        const minTime = Math.min(...times);
        
        console.log(`${endpoint.name}:`);
        console.log(`  Average: ${avgTime.toFixed(2)}ms`);
        console.log(`  Min: ${minTime}ms`);
        console.log(`  Max: ${maxTime}ms`);
        
        // API responses should be fast
        expect(avgTime).toBeLessThan(500); // 500ms average
        expect(maxTime).toBeLessThan(2000); // 2s max
      }
    });

    test('memory usage monitoring', async ({ page }) => {
      await authHelper.login(testUsers.developer);
      
      const memorySnapshots: number[] = [];
      
      // Take initial snapshot
      memorySnapshots.push(await performanceHelper.checkMemoryUsage());
      
      // Perform memory-intensive operations
      for (let i = 0; i < 5; i++) {
        // Load large data set
        await page.goto('/dashboard/applicants');
        await page.waitForSelector('tbody tr');
        
        // Open multiple modals
        await page.click('button:has-text("Filters")');
        await page.click('button:has-text("Export")');
        
        // Navigate to different pages
        await page.goto('/dashboard/projects');
        await page.goto('/dashboard/analytics');
        
        // Take snapshot
        memorySnapshots.push(await performanceHelper.checkMemoryUsage());
      }
      
      // Check for memory leaks
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log('Memory Usage:');
      console.log(`Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory increase should be reasonable (not a leak)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });

  test.describe('File Upload/Download Performance', () => {
    test('large file handling', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/documents');
      
      // Test various file sizes
      const fileSizes = [
        { size: 1, name: '1MB' },
        { size: 5, name: '5MB' },
        { size: 10, name: '10MB' }
      ];
      
      for (const fileInfo of fileSizes) {
        const fileName = `large-file-${fileInfo.name}.pdf`;
        const content = Buffer.alloc(fileInfo.size * 1024 * 1024); // Create buffer of specified size
        
        const startTime = Date.now();
        
        await page.click('button:has-text("Upload")');
        await page.setInputFiles('input[type="file"]', {
          name: fileName,
          mimeType: 'application/pdf',
          buffer: content
        });
        
        await page.click('button:has-text("Confirm")');
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 30000 });
        
        const uploadTime = Date.now() - startTime;
        
        console.log(`${fileInfo.name} Upload Time: ${uploadTime}ms`);
        
        // Upload should complete in reasonable time
        expect(uploadTime).toBeLessThan(fileInfo.size * 5000); // 5 seconds per MB max
      }
    });

    test('concurrent file operations', async ({ page }) => {
      await authHelper.login(testUsers.staff);
      await page.goto('/dashboard/documents');
      
      // Upload multiple files concurrently
      const uploadPromises = [];
      
      for (let i = 0; i < 5; i++) {
        uploadPromises.push(
          page.evaluate(async (index) => {
            const formData = new FormData();
            const content = new Blob([`Test file ${index} content`], { type: 'text/plain' });
            formData.append('file', content, `concurrent-${index}.txt`);
            formData.append('document_type', 'other');
            
            const start = Date.now();
            const response = await fetch('/api/documents/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
              },
              body: formData
            });
            const end = Date.now();
            
            return {
              index,
              success: response.ok,
              time: end - start
            };
          }, i)
        );
      }
      
      const results = await Promise.all(uploadPromises);
      
      // All uploads should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        console.log(`File ${result.index} upload time: ${result.time}ms`);
      });
      
      // Refresh to see uploaded files
      await page.reload();
      
      // Verify all files appear
      for (let i = 0; i < 5; i++) {
        await expect(page.locator(`text="concurrent-${i}.txt"`)).toBeVisible();
      }
    });
  });

  test.describe('Database Query Performance', () => {
    test('complex query performance', async ({ page }) => {
      await authHelper.login(testUsers.manager);
      
      // Test complex filtering and sorting
      await page.goto('/dashboard/applicants');
      
      // Apply multiple filters
      await page.click('button:has-text("Advanced Filters")');
      await page.selectOption('select[name="income_range"]', '40000-60000');
      await page.selectOption('select[name="household_size"]', '3');
      await page.selectOption('select[name="bedroom_preference"]', '2');
      await page.fill('input[name="location"]', 'San Francisco');
      await page.selectOption('select[name="sort_by"]', 'income_desc');
      
      const startTime = Date.now();
      await page.click('button:has-text("Apply Filters")');
      await page.waitForSelector('tbody tr, .no-results');
      const queryTime = Date.now() - startTime;
      
      console.log(`Complex query time: ${queryTime}ms`);
      expect(queryTime).toBeLessThan(2000); // 2 seconds max
      
      // Test pagination performance
      if (await page.locator('.pagination').isVisible()) {
        const pageStartTime = Date.now();
        await page.click('.pagination button:has-text("2")');
        await page.waitForSelector('tbody tr');
        const paginationTime = Date.now() - pageStartTime;
        
        console.log(`Pagination time: ${paginationTime}ms`);
        expect(paginationTime).toBeLessThan(1000); // 1 second max
      }
    });

    test('data export performance', async ({ page }) => {
      await authHelper.login(testUsers.manager);
      await page.goto('/dashboard/reports');
      
      // Test different export sizes
      const exportTests = [
        { type: 'summary', expectedTime: 2000 },
        { type: 'detailed', expectedTime: 5000 },
        { type: 'full', expectedTime: 10000 }
      ];
      
      for (const test of exportTests) {
        await page.selectOption('select[name="report_type"]', test.type);
        
        const downloadPromise = page.waitForEvent('download');
        const startTime = Date.now();
        
        await page.click('button:has-text("Generate Report")');
        
        const download = await downloadPromise;
        const exportTime = Date.now() - startTime;
        
        console.log(`${test.type} export time: ${exportTime}ms`);
        expect(exportTime).toBeLessThan(test.expectedTime);
        
        // Verify download
        expect(download.suggestedFilename()).toContain('.csv');
      }
    });
  });
});