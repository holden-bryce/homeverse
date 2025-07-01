import { test, expect, Browser, Page, BrowserContext } from '@playwright/test';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: number;
  error?: string;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  percentile95: number;
  percentile99: number;
  requestsPerSecond: number;
  errors: { [key: string]: number };
}

class LoadTester {
  private metrics: PerformanceMetrics[] = [];
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async measureAPICall(
    page: Page,
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<PerformanceMetrics> {
    const startTime = performance.now();
    let statusCode = 0;
    let error: string | undefined;

    try {
      const response = await page.request[method.toLowerCase()](
        `${this.baseURL}${endpoint}`,
        { data: body }
      );
      statusCode = response.status();
      
      if (!response.ok()) {
        error = `HTTP ${statusCode}`;
      }
    } catch (e) {
      error = e.message;
    }

    const responseTime = performance.now() - startTime;
    const metric: PerformanceMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      timestamp: Date.now(),
      error
    };

    this.metrics.push(metric);
    return metric;
  }

  generateReport(): LoadTestResult {
    const successfulRequests = this.metrics.filter(m => !m.error).length;
    const failedRequests = this.metrics.filter(m => m.error).length;
    const responseTimes = this.metrics
      .filter(m => !m.error)
      .map(m => m.responseTime)
      .sort((a, b) => a - b);

    const errors = this.metrics
      .filter(m => m.error)
      .reduce((acc, m) => {
        acc[m.error!] = (acc[m.error!] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    const totalTime = (this.metrics[this.metrics.length - 1].timestamp - this.metrics[0].timestamp) / 1000;

    return {
      totalRequests: this.metrics.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
      minResponseTime: responseTimes[0] || 0,
      maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
      percentile95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      percentile99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      requestsPerSecond: this.metrics.length / totalTime,
      errors
    };
  }

  reset() {
    this.metrics = [];
  }
}

test.describe('Performance and Load Testing', () => {
  let loadTester: LoadTester;

  test.beforeEach(async ({ page }) => {
    loadTester = new LoadTester(process.env.API_URL || 'http://localhost:8000');
  });

  test.describe('API Endpoint Performance', () => {
    test('measure individual endpoint response times', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'staff@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard');

      const endpoints = [
        { path: '/api/v1/auth/me', method: 'GET', name: 'Get Current User' },
        { path: '/api/v1/applicants', method: 'GET', name: 'List Applicants' },
        { path: '/api/v1/projects', method: 'GET', name: 'List Projects' },
        { path: '/api/v1/applications', method: 'GET', name: 'List Applications' },
        { path: '/api/v1/analytics/heatmap', method: 'GET', name: 'Get Heatmap Data' },
        { path: '/api/v1/activities', method: 'GET', name: 'Get Activities' }
      ];

      console.log('\n=== API Endpoint Performance ===\n');
      
      for (const endpoint of endpoints) {
        const metric = await loadTester.measureAPICall(page, endpoint.path, endpoint.method);
        console.log(`${endpoint.name}: ${metric.responseTime.toFixed(2)}ms (${metric.statusCode})`);
        
        // Assert performance thresholds
        expect(metric.responseTime).toBeLessThan(1000); // All APIs should respond < 1s
        expect(metric.statusCode).toBe(200);
      }
    });
  });

  test.describe('Concurrent User Simulation', () => {
    test('simulate 10 concurrent users', async ({ browser }) => {
      const userCount = 10;
      const contexts: BrowserContext[] = [];
      const pages: Page[] = [];
      
      console.log(`\n=== Simulating ${userCount} Concurrent Users ===\n`);

      // Create browser contexts for each user
      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // Login all users concurrently
      const loginStart = performance.now();
      await Promise.all(pages.map(async (page, index) => {
        await page.goto('/auth/login');
        await page.fill('[name="email"]', `staff${index}@test.com`);
        await page.fill('[name="password"]', 'password123');
        await page.click('button:has-text("Sign In")');
        return page.waitForURL('/dashboard');
      }));
      const loginTime = performance.now() - loginStart;
      console.log(`All users logged in: ${loginTime.toFixed(2)}ms`);

      // Simulate concurrent operations
      const operations = [
        async (page: Page) => {
          await page.goto('/dashboard/applicants');
          await page.waitForSelector('tbody tr');
        },
        async (page: Page) => {
          await page.goto('/dashboard/projects');
          await page.waitForSelector('.project-card');
        },
        async (page: Page) => {
          await page.goto('/dashboard/map');
          await page.waitForSelector('.mapboxgl-map');
        },
        async (page: Page) => {
          await page.goto('/dashboard/analytics');
          await page.waitForSelector('canvas');
        },
        async (page: Page) => {
          await page.goto('/dashboard/applications');
          await page.waitForSelector('table');
        }
      ];

      // Execute random operations for each user
      const operationStart = performance.now();
      await Promise.all(pages.map(async (page, userIndex) => {
        const operation = operations[userIndex % operations.length];
        await operation(page);
      }));
      const operationTime = performance.now() - operationStart;
      console.log(`Concurrent operations completed: ${operationTime.toFixed(2)}ms`);

      // Cleanup
      await Promise.all(contexts.map(c => c.close()));

      // Assert performance
      expect(loginTime).toBeLessThan(10000); // 10 users should login within 10s
      expect(operationTime).toBeLessThan(15000); // Operations should complete within 15s
    });

    test('simulate 25 concurrent users with mixed operations', async ({ browser }) => {
      const userCount = 25;
      const testDuration = 30000; // 30 seconds
      const contexts: BrowserContext[] = [];
      const pages: Page[] = [];
      
      console.log(`\n=== Load Test: ${userCount} Users for ${testDuration/1000}s ===\n`);

      // Setup users
      for (let i = 0; i < userCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
        
        // Login
        await page.goto('/auth/login');
        await page.fill('[name="email"]', `test${i}@test.com`);
        await page.fill('[name="password"]', 'password123');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('/dashboard');
      }

      // Define user scenarios
      const scenarios = {
        applicantManager: async (page: Page) => {
          await loadTester.measureAPICall(page, '/api/v1/applicants', 'GET');
          await page.waitForTimeout(1000);
          
          // Create applicant
          const applicantData = {
            first_name: `Load${Date.now()}`,
            last_name: 'Test',
            email: `load${Date.now()}@test.com`,
            household_size: 2,
            annual_income: 50000
          };
          await loadTester.measureAPICall(page, '/api/v1/applicants', 'POST', applicantData);
        },
        
        projectBrowser: async (page: Page) => {
          await loadTester.measureAPICall(page, '/api/v1/projects', 'GET');
          await page.waitForTimeout(500);
          await loadTester.measureAPICall(page, '/api/v1/projects/1', 'GET');
        },
        
        applicationReviewer: async (page: Page) => {
          await loadTester.measureAPICall(page, '/api/v1/applications', 'GET');
          await page.waitForTimeout(2000);
        },
        
        analyticsViewer: async (page: Page) => {
          await loadTester.measureAPICall(page, '/api/v1/analytics/heatmap', 'GET');
          await page.waitForTimeout(1500);
        },
        
        reportGenerator: async (page: Page) => {
          await loadTester.measureAPICall(page, '/api/v1/lenders/portfolio', 'GET');
          await page.waitForTimeout(3000);
        }
      };

      const scenarioNames = Object.keys(scenarios);
      const endTime = Date.now() + testDuration;
      const userTasks: Promise<void>[] = [];

      // Run scenarios for each user
      pages.forEach((page, index) => {
        const scenarioName = scenarioNames[index % scenarioNames.length];
        const scenario = scenarios[scenarioName];
        
        const runScenario = async () => {
          while (Date.now() < endTime) {
            try {
              await scenario(page);
            } catch (error) {
              console.error(`User ${index} error:`, error.message);
            }
          }
        };
        
        userTasks.push(runScenario());
      });

      // Wait for all tasks to complete
      await Promise.all(userTasks);

      // Generate report
      const report = loadTester.generateReport();
      console.log('\n=== Load Test Results ===');
      console.log(`Total Requests: ${report.totalRequests}`);
      console.log(`Successful: ${report.successfulRequests} (${(report.successfulRequests/report.totalRequests*100).toFixed(1)}%)`);
      console.log(`Failed: ${report.failedRequests}`);
      console.log(`Requests/Second: ${report.requestsPerSecond.toFixed(2)}`);
      console.log(`\nResponse Times:`);
      console.log(`  Average: ${report.averageResponseTime.toFixed(2)}ms`);
      console.log(`  Min: ${report.minResponseTime.toFixed(2)}ms`);
      console.log(`  Max: ${report.maxResponseTime.toFixed(2)}ms`);
      console.log(`  95th Percentile: ${report.percentile95.toFixed(2)}ms`);
      console.log(`  99th Percentile: ${report.percentile99.toFixed(2)}ms`);
      
      if (Object.keys(report.errors).length > 0) {
        console.log(`\nErrors:`);
        Object.entries(report.errors).forEach(([error, count]) => {
          console.log(`  ${error}: ${count}`);
        });
      }

      // Cleanup
      await Promise.all(contexts.map(c => c.close()));

      // Assert SLAs
      expect(report.successfulRequests / report.totalRequests).toBeGreaterThan(0.95); // 95% success rate
      expect(report.averageResponseTime).toBeLessThan(500); // Average < 500ms
      expect(report.percentile95).toBeLessThan(1000); // 95th percentile < 1s
    });
  });

  test.describe('Database Performance Under Load', () => {
    test('bulk applicant creation performance', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'staff@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard');

      const batchSizes = [10, 25, 50, 100];
      
      console.log('\n=== Bulk Creation Performance ===\n');

      for (const batchSize of batchSizes) {
        loadTester.reset();
        const startTime = performance.now();
        
        const createPromises = [];
        for (let i = 0; i < batchSize; i++) {
          const applicantData = {
            first_name: `Bulk${i}`,
            last_name: `Test${batchSize}`,
            email: `bulk${i}_${Date.now()}@test.com`,
            household_size: 2,
            annual_income: 50000 + (i * 1000)
          };
          
          createPromises.push(
            loadTester.measureAPICall(page, '/api/v1/applicants', 'POST', applicantData)
          );
        }
        
        await Promise.all(createPromises);
        const totalTime = performance.now() - startTime;
        const report = loadTester.generateReport();
        
        console.log(`Batch Size ${batchSize}:`);
        console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);
        console.log(`  Average per Record: ${(totalTime / batchSize).toFixed(2)}ms`);
        console.log(`  Success Rate: ${(report.successfulRequests / batchSize * 100).toFixed(1)}%`);
        
        // Performance assertions
        expect(report.successfulRequests).toBe(batchSize);
        expect(totalTime / batchSize).toBeLessThan(200); // < 200ms per record
      }
    });

    test('search performance with large dataset', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'staff@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard');

      const searchQueries = [
        { query: 'John', expectedResults: 'multiple' },
        { query: 'john.doe@example.com', expectedResults: 'single' },
        { query: '50000', expectedResults: 'multiple' },
        { query: 'nonexistent@test.com', expectedResults: 'none' }
      ];

      console.log('\n=== Search Performance ===\n');

      for (const search of searchQueries) {
        const startTime = performance.now();
        
        await page.goto('/dashboard/applicants');
        await page.fill('[placeholder="Search applicants..."]', search.query);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500); // Wait for search to complete
        
        const searchTime = performance.now() - startTime;
        const resultCount = await page.locator('tbody tr').count();
        
        console.log(`Search "${search.query}":`);
        console.log(`  Time: ${searchTime.toFixed(2)}ms`);
        console.log(`  Results: ${resultCount}`);
        
        // Performance assertions
        expect(searchTime).toBeLessThan(2000); // Search should complete < 2s
      }
    });
  });

  test.describe('File Upload Performance', () => {
    test('concurrent file uploads', async ({ browser }) => {
      const fileCount = 5;
      const contexts: BrowserContext[] = [];
      const pages: Page[] = [];
      
      console.log(`\n=== Concurrent File Upload Test (${fileCount} files) ===\n`);

      // Create contexts
      for (let i = 0; i < fileCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
        
        await page.goto('/auth/login');
        await page.fill('[name="email"]', 'applicant@test.com');
        await page.fill('[name="password"]', 'password123');
        await page.click('button:has-text("Sign In")');
        await page.waitForURL('/dashboard');
      }

      // Prepare file uploads
      const uploadPromises = pages.map(async (page, index) => {
        await page.goto('/dashboard/documents');
        
        const fileName = `test-document-${index}.pdf`;
        const fileContent = Buffer.alloc(1024 * 1024 * 2); // 2MB file
        
        const startTime = performance.now();
        
        await page.setInputFiles('input[type="file"]', {
          name: fileName,
          mimeType: 'application/pdf',
          buffer: fileContent
        });
        
        await page.click('button:has-text("Upload")');
        await page.waitForSelector(`.file-list:has-text("${fileName}")`);
        
        const uploadTime = performance.now() - startTime;
        return { fileName, uploadTime };
      });

      const results = await Promise.all(uploadPromises);
      
      results.forEach(result => {
        console.log(`${result.fileName}: ${result.uploadTime.toFixed(2)}ms`);
      });
      
      const averageTime = results.reduce((sum, r) => sum + r.uploadTime, 0) / results.length;
      console.log(`\nAverage Upload Time: ${averageTime.toFixed(2)}ms`);

      // Cleanup
      await Promise.all(contexts.map(c => c.close()));

      // Assertions
      expect(averageTime).toBeLessThan(5000); // Average upload < 5s
      results.forEach(result => {
        expect(result.uploadTime).toBeLessThan(10000); // Each upload < 10s
      });
    });
  });

  test.describe('Map Performance', () => {
    test('map rendering with multiple markers', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'buyer@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard');

      console.log('\n=== Map Performance Test ===\n');

      const markerCounts = [10, 50, 100, 200];

      for (const count of markerCounts) {
        // Mock API to return specific number of projects
        await page.route('**/api/v1/projects/map', async route => {
          const projects = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `Project ${i + 1}`,
            latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
            total_units: 50,
            available_units: 25,
            min_rent: 1500 + (i * 10)
          }));
          
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(projects)
          });
        });

        const startTime = performance.now();
        await page.goto('/dashboard/map');
        
        // Wait for map to load
        await page.waitForSelector('.mapboxgl-map');
        await page.waitForTimeout(1000); // Wait for markers to render
        
        const loadTime = performance.now() - startTime;
        const markerElements = await page.locator('.mapboxgl-marker').count();
        
        console.log(`${count} markers:`);
        console.log(`  Load Time: ${loadTime.toFixed(2)}ms`);
        console.log(`  Rendered: ${markerElements}`);
        
        // Test interaction
        const interactionStart = performance.now();
        await page.click('.mapboxgl-ctrl-zoom-in');
        await page.waitForTimeout(500);
        await page.click('.mapboxgl-ctrl-zoom-out');
        const interactionTime = performance.now() - interactionStart;
        console.log(`  Interaction: ${interactionTime.toFixed(2)}ms`);
        
        // Assertions
        expect(loadTime).toBeLessThan(5000); // Map should load < 5s
        expect(markerElements).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Report Generation Performance', () => {
    test('generate large reports', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'manager@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard');

      const reportTypes = [
        { type: 'applicants', name: 'Applicant Report' },
        { type: 'projects', name: 'Project Report' },
        { type: 'cra_compliance', name: 'CRA Compliance Report' },
        { type: 'monthly_summary', name: 'Monthly Summary' }
      ];

      console.log('\n=== Report Generation Performance ===\n');

      for (const report of reportTypes) {
        await page.goto('/dashboard/reports');
        
        const startTime = performance.now();
        
        await page.selectOption('[name="report_type"]', report.type);
        await page.click('button:has-text("Generate Report")');
        
        // Wait for report to generate
        await page.waitForSelector('.report-preview', { timeout: 30000 });
        
        const generateTime = performance.now() - startTime;
        
        // Test download
        const downloadStart = performance.now();
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Download PDF")');
        const download = await downloadPromise;
        const downloadTime = performance.now() - downloadStart;
        
        console.log(`${report.name}:`);
        console.log(`  Generation: ${generateTime.toFixed(2)}ms`);
        console.log(`  Download: ${downloadTime.toFixed(2)}ms`);
        console.log(`  File Size: ${(await download.path() ? 'Generated' : 'Failed')}`);
        
        // Assertions
        expect(generateTime).toBeLessThan(10000); // Generation < 10s
        expect(downloadTime).toBeLessThan(5000); // Download < 5s
      }
    });
  });

  test.describe('Real-time Features Performance', () => {
    test('notification delivery latency', async ({ browser }) => {
      console.log('\n=== Real-time Notification Performance ===\n');
      
      // Create manager and applicant sessions
      const managerContext = await browser.newContext();
      const managerPage = await managerContext.newPage();
      
      const applicantContext = await browser.newContext();
      const applicantPage = await applicantContext.newPage();
      
      // Login both users
      await managerPage.goto('/auth/login');
      await managerPage.fill('[name="email"]', 'manager@test.com');
      await managerPage.fill('[name="password"]', 'password123');
      await managerPage.click('button:has-text("Sign In")');
      await managerPage.waitForURL('/dashboard');
      
      await applicantPage.goto('/auth/login');
      await applicantPage.fill('[name="email"]', 'applicant@test.com');
      await applicantPage.fill('[name="password"]', 'password123');
      await applicantPage.click('button:has-text("Sign In")');
      await applicantPage.waitForURL('/dashboard');
      
      // Applicant waits for notification
      const notificationPromise = applicantPage.waitForSelector('.notification-toast:has-text("Application status updated")', {
        timeout: 10000
      });
      
      // Manager approves application
      const approvalStart = performance.now();
      await managerPage.goto('/dashboard/applications');
      await managerPage.click('tbody tr:first-child a:has-text("View")');
      await managerPage.click('button:has-text("Approve")');
      await managerPage.fill('textarea[name="notes"]', 'Real-time test');
      await managerPage.click('button:has-text("Confirm")');
      
      // Wait for notification
      await notificationPromise;
      const notificationLatency = performance.now() - approvalStart;
      
      console.log(`Notification Latency: ${notificationLatency.toFixed(2)}ms`);
      
      // Cleanup
      await managerContext.close();
      await applicantContext.close();
      
      // Assertion
      expect(notificationLatency).toBeLessThan(3000); // Notification < 3s
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('memory leak detection during extended use', async ({ page }) => {
      await page.goto('/auth/login');
      await page.fill('[name="email"]', 'staff@test.com');
      await page.fill('[name="password"]', 'password123');
      await page.click('button:has-text("Sign In")');
      await page.waitForURL('/dashboard');

      console.log('\n=== Memory Usage Test ===\n');

      const iterations = 20;
      const memorySnapshots: number[] = [];

      for (let i = 0; i < iterations; i++) {
        // Navigate between heavy pages
        await page.goto('/dashboard/applicants');
        await page.waitForSelector('tbody tr');
        
        await page.goto('/dashboard/map');
        await page.waitForSelector('.mapboxgl-map');
        
        await page.goto('/dashboard/analytics');
        await page.waitForSelector('canvas');
        
        // Take memory snapshot
        const metrics = await page.evaluate(() => {
          if ('memory' in performance) {
            return (performance as any).memory.usedJSHeapSize;
          }
          return 0;
        });
        
        memorySnapshots.push(metrics);
        
        if (i % 5 === 0) {
          console.log(`Iteration ${i}: ${(metrics / 1024 / 1024).toFixed(2)} MB`);
        }
      }

      // Calculate memory growth
      const initialMemory = memorySnapshots[0];
      const finalMemory = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
      
      console.log(`\nMemory Growth: ${memoryGrowth.toFixed(2)}%`);
      
      // Assert no significant memory leak
      expect(memoryGrowth).toBeLessThan(50); // Less than 50% growth
    });
  });
});

// Helper function to generate load test summary
export function generateLoadTestSummary(results: LoadTestResult[]): string {
  const summary = `
# Load Test Summary Report

## Test Configuration
- Test Duration: 30 seconds
- Concurrent Users: 25
- Target RPS: 50

## Results Summary

### Success Metrics
- Total Requests: ${results.reduce((sum, r) => sum + r.totalRequests, 0)}
- Success Rate: ${(results.reduce((sum, r) => sum + r.successfulRequests, 0) / results.reduce((sum, r) => sum + r.totalRequests, 0) * 100).toFixed(2)}%
- Average RPS: ${results.reduce((sum, r) => sum + r.requestsPerSecond, 0) / results.length}

### Response Time Metrics
- Average: ${results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length}ms
- 95th Percentile: ${Math.max(...results.map(r => r.percentile95))}ms
- 99th Percentile: ${Math.max(...results.map(r => r.percentile99))}ms

### Recommendations
${generateRecommendations(results)}

## Detailed Results
${results.map((r, i) => `
### Test Run ${i + 1}
- Requests: ${r.totalRequests}
- Success: ${r.successfulRequests}
- Failed: ${r.failedRequests}
- Avg Response: ${r.averageResponseTime.toFixed(2)}ms
- 95th %ile: ${r.percentile95.toFixed(2)}ms
`).join('\n')}
`;

  return summary;
}

function generateRecommendations(results: LoadTestResult[]): string {
  const recommendations: string[] = [];
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length;
  if (avgResponseTime > 500) {
    recommendations.push('- Consider optimizing database queries - average response time exceeds 500ms');
  }
  
  const failureRate = results.reduce((sum, r) => sum + r.failedRequests, 0) / results.reduce((sum, r) => sum + r.totalRequests, 0);
  if (failureRate > 0.05) {
    recommendations.push('- High failure rate detected - investigate error logs and increase server capacity');
  }
  
  const maxResponseTime = Math.max(...results.map(r => r.maxResponseTime));
  if (maxResponseTime > 5000) {
    recommendations.push('- Some requests taking >5s - implement request timeouts and optimize slow endpoints');
  }
  
  return recommendations.length > 0 ? recommendations.join('\n') : '- System performing within acceptable parameters';
}