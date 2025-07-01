# Test info

- Name: Integration & Performance Testing >> Performance Benchmarks >> concurrent user load testing
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/05-integration-performance.spec.ts:281:9

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
  181 |       await page.click('button:has-text("Send")');
  182 |       await expect(page.locator('.toast-success')).toBeVisible();
  183 |     });
  184 |   });
  185 |
  186 |   test.describe('Mapbox Integration', () => {
  187 |     test('map rendering performance', async ({ page }) => {
  188 |       await authHelper.login(testUsers.lender);
  189 |       
  190 |       const startTime = Date.now();
  191 |       await page.goto('/dashboard/map');
  192 |       
  193 |       // Wait for map to load
  194 |       await page.waitForSelector('.mapboxgl-map', { timeout: 10000 });
  195 |       
  196 |       const mapLoadTime = Date.now() - startTime;
  197 |       expect(mapLoadTime).toBeLessThan(5000); // Map should load within 5 seconds
  198 |       
  199 |       // Verify map controls
  200 |       await expect(page.locator('.mapboxgl-ctrl-zoom-in')).toBeVisible();
  201 |       await expect(page.locator('.mapboxgl-ctrl-zoom-out')).toBeVisible();
  202 |       
  203 |       // Test map interactions
  204 |       await page.click('.mapboxgl-ctrl-zoom-in');
  205 |       await page.waitForTimeout(500);
  206 |       
  207 |       // Pan map
  208 |       await page.mouse.move(400, 300);
  209 |       await page.mouse.down();
  210 |       await page.mouse.move(500, 400);
  211 |       await page.mouse.up();
  212 |       
  213 |       // Markers should be visible
  214 |       await expect(page.locator('.mapboxgl-marker').first()).toBeVisible();
  215 |     });
  216 |
  217 |     test('project location clustering', async ({ page }) => {
  218 |       await authHelper.login(testUsers.developer);
  219 |       await page.goto('/dashboard/map');
  220 |       
  221 |       // Wait for map and clusters
  222 |       await page.waitForSelector('.mapboxgl-map');
  223 |       await page.waitForTimeout(2000); // Wait for markers to load
  224 |       
  225 |       // Look for cluster markers
  226 |       const clusters = page.locator('.marker-cluster');
  227 |       if (await clusters.count() > 0) {
  228 |         // Click on a cluster
  229 |         await clusters.first().click();
  230 |         
  231 |         // Map should zoom in
  232 |         await page.waitForTimeout(1000);
  233 |         
  234 |         // Should show individual markers or smaller clusters
  235 |         const markersAfterZoom = await page.locator('.mapboxgl-marker').count();
  236 |         expect(markersAfterZoom).toBeGreaterThan(0);
  237 |       }
  238 |       
  239 |       // Test filter interaction
  240 |       await page.selectOption('select[name="bedroom_filter"]', '2');
  241 |       await page.waitForTimeout(1000);
  242 |       
  243 |       // Markers should update
  244 |       const filteredMarkers = await page.locator('.mapboxgl-marker').count();
  245 |       expect(filteredMarkers).toBeGreaterThanOrEqual(0);
  246 |     });
  247 |   });
  248 |
  249 |   test.describe('Performance Benchmarks', () => {
  250 |     test('page load performance metrics', async ({ page }) => {
  251 |       const pages = [
  252 |         { name: 'Landing Page', url: '/' },
  253 |         { name: 'Login Page', url: '/login' },
  254 |         { name: 'Dashboard', url: '/dashboard', requiresAuth: true },
  255 |         { name: 'Applicants List', url: '/dashboard/applicants', requiresAuth: true },
  256 |         { name: 'Projects List', url: '/dashboard/projects', requiresAuth: true },
  257 |         { name: 'Analytics', url: '/dashboard/analytics', requiresAuth: true }
  258 |       ];
  259 |       
  260 |       const metrics: Record<string, any> = {};
  261 |       
  262 |       for (const pageInfo of pages) {
  263 |         if (pageInfo.requiresAuth && !page.url().includes('/dashboard')) {
  264 |           await authHelper.login(testUsers.developer);
  265 |         }
  266 |         
  267 |         const pageMetrics = await performanceHelper.measurePageLoad(
  268 |           pageInfo.requiresAuth ? pageInfo.url : `http://localhost:3000${pageInfo.url}`
  269 |         );
  270 |         
  271 |         metrics[pageInfo.name] = pageMetrics;
  272 |         
  273 |         // Assert performance thresholds
  274 |         await performanceHelper.assertPerformanceThresholds(pageMetrics);
  275 |       }
  276 |       
  277 |       // Generate report
  278 |       await performanceHelper.generatePerformanceReport(metrics);
  279 |     });
  280 |
> 281 |     test('concurrent user load testing', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  282 |       // Test with 10 concurrent users
  283 |       const scenario = async (page: any) => {
  284 |         const auth = new AuthHelper(page);
  285 |         await auth.login(testUsers.developer);
  286 |         
  287 |         // Perform typical user actions
  288 |         await page.goto('/dashboard/projects');
  289 |         await page.waitForSelector('tbody tr, .no-data');
  290 |         
  291 |         await page.goto('/dashboard/applicants');
  292 |         await page.waitForSelector('tbody tr, .no-data');
  293 |         
  294 |         await page.fill('input[placeholder*="Search"]', 'Test');
  295 |         await page.keyboard.press('Enter');
  296 |         await page.waitForTimeout(500);
  297 |         
  298 |         return true;
  299 |       };
  300 |       
  301 |       const results = await performanceHelper.testConcurrentUsers(scenario, 10);
  302 |       
  303 |       console.log('Concurrent User Test Results:');
  304 |       console.log(`Total Time: ${results.totalTime}ms`);
  305 |       console.log(`Average Time per User: ${results.averageTime}ms`);
  306 |       
  307 |       // Average time should be reasonable even with concurrent users
  308 |       expect(results.averageTime).toBeLessThan(10000); // 10 seconds max
  309 |     });
  310 |
  311 |     test('API endpoint performance', async ({ page }) => {
  312 |       await authHelper.login(testUsers.staff);
  313 |       
  314 |       const endpoints = [
  315 |         { name: 'List Applicants', url: '/api/applicants', method: 'GET' },
  316 |         { name: 'List Projects', url: '/api/projects', method: 'GET' },
  317 |         { name: 'Get Analytics', url: '/api/analytics/summary', method: 'GET' },
  318 |         { name: 'Search Applicants', url: '/api/applicants/search?q=test', method: 'GET' }
  319 |       ];
  320 |       
  321 |       for (const endpoint of endpoints) {
  322 |         const times = await performanceHelper.stressTest(async () => {
  323 |           const response = await page.evaluate(async ({ url, method }) => {
  324 |             const start = Date.now();
  325 |             const response = await fetch(`http://localhost:8000${url}`, {
  326 |               method,
  327 |               headers: {
  328 |                 'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
  329 |               }
  330 |             });
  331 |             const end = Date.now();
  332 |             return {
  333 |               status: response.status,
  334 |               time: end - start
  335 |             };
  336 |           }, endpoint);
  337 |           
  338 |           return response;
  339 |         }, 20); // 20 requests
  340 |         
  341 |         const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  342 |         const maxTime = Math.max(...times);
  343 |         const minTime = Math.min(...times);
  344 |         
  345 |         console.log(`${endpoint.name}:`);
  346 |         console.log(`  Average: ${avgTime.toFixed(2)}ms`);
  347 |         console.log(`  Min: ${minTime}ms`);
  348 |         console.log(`  Max: ${maxTime}ms`);
  349 |         
  350 |         // API responses should be fast
  351 |         expect(avgTime).toBeLessThan(500); // 500ms average
  352 |         expect(maxTime).toBeLessThan(2000); // 2s max
  353 |       }
  354 |     });
  355 |
  356 |     test('memory usage monitoring', async ({ page }) => {
  357 |       await authHelper.login(testUsers.developer);
  358 |       
  359 |       const memorySnapshots: number[] = [];
  360 |       
  361 |       // Take initial snapshot
  362 |       memorySnapshots.push(await performanceHelper.checkMemoryUsage());
  363 |       
  364 |       // Perform memory-intensive operations
  365 |       for (let i = 0; i < 5; i++) {
  366 |         // Load large data set
  367 |         await page.goto('/dashboard/applicants');
  368 |         await page.waitForSelector('tbody tr');
  369 |         
  370 |         // Open multiple modals
  371 |         await page.click('button:has-text("Filters")');
  372 |         await page.click('button:has-text("Export")');
  373 |         
  374 |         // Navigate to different pages
  375 |         await page.goto('/dashboard/projects');
  376 |         await page.goto('/dashboard/analytics');
  377 |         
  378 |         // Take snapshot
  379 |         memorySnapshots.push(await performanceHelper.checkMemoryUsage());
  380 |       }
  381 |       
```