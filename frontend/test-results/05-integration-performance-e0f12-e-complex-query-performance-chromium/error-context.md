# Test info

- Name: Integration & Performance Testing >> Database Query Performance >> complex query performance
- Location: /mnt/c/Users/12486/homeverse/frontend/tests/e2e/05-integration-performance.spec.ts:487:9

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
  387 |       console.log('Memory Usage:');
  388 |       console.log(`Initial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
  389 |       console.log(`Final: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
  390 |       console.log(`Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  391 |       
  392 |       // Memory increase should be reasonable (not a leak)
  393 |       expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
  394 |     });
  395 |   });
  396 |
  397 |   test.describe('File Upload/Download Performance', () => {
  398 |     test('large file handling', async ({ page }) => {
  399 |       await authHelper.login(testUsers.staff);
  400 |       await page.goto('/dashboard/documents');
  401 |       
  402 |       // Test various file sizes
  403 |       const fileSizes = [
  404 |         { size: 1, name: '1MB' },
  405 |         { size: 5, name: '5MB' },
  406 |         { size: 10, name: '10MB' }
  407 |       ];
  408 |       
  409 |       for (const fileInfo of fileSizes) {
  410 |         const fileName = `large-file-${fileInfo.name}.pdf`;
  411 |         const content = Buffer.alloc(fileInfo.size * 1024 * 1024); // Create buffer of specified size
  412 |         
  413 |         const startTime = Date.now();
  414 |         
  415 |         await page.click('button:has-text("Upload")');
  416 |         await page.setInputFiles('input[type="file"]', {
  417 |           name: fileName,
  418 |           mimeType: 'application/pdf',
  419 |           buffer: content
  420 |         });
  421 |         
  422 |         await page.click('button:has-text("Confirm")');
  423 |         await expect(page.locator('.toast-success')).toBeVisible({ timeout: 30000 });
  424 |         
  425 |         const uploadTime = Date.now() - startTime;
  426 |         
  427 |         console.log(`${fileInfo.name} Upload Time: ${uploadTime}ms`);
  428 |         
  429 |         // Upload should complete in reasonable time
  430 |         expect(uploadTime).toBeLessThan(fileInfo.size * 5000); // 5 seconds per MB max
  431 |       }
  432 |     });
  433 |
  434 |     test('concurrent file operations', async ({ page }) => {
  435 |       await authHelper.login(testUsers.staff);
  436 |       await page.goto('/dashboard/documents');
  437 |       
  438 |       // Upload multiple files concurrently
  439 |       const uploadPromises = [];
  440 |       
  441 |       for (let i = 0; i < 5; i++) {
  442 |         uploadPromises.push(
  443 |           page.evaluate(async (index) => {
  444 |             const formData = new FormData();
  445 |             const content = new Blob([`Test file ${index} content`], { type: 'text/plain' });
  446 |             formData.append('file', content, `concurrent-${index}.txt`);
  447 |             formData.append('document_type', 'other');
  448 |             
  449 |             const start = Date.now();
  450 |             const response = await fetch('/api/documents/upload', {
  451 |               method: 'POST',
  452 |               headers: {
  453 |                 'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
  454 |               },
  455 |               body: formData
  456 |             });
  457 |             const end = Date.now();
  458 |             
  459 |             return {
  460 |               index,
  461 |               success: response.ok,
  462 |               time: end - start
  463 |             };
  464 |           }, i)
  465 |         );
  466 |       }
  467 |       
  468 |       const results = await Promise.all(uploadPromises);
  469 |       
  470 |       // All uploads should succeed
  471 |       results.forEach(result => {
  472 |         expect(result.success).toBe(true);
  473 |         console.log(`File ${result.index} upload time: ${result.time}ms`);
  474 |       });
  475 |       
  476 |       // Refresh to see uploaded files
  477 |       await page.reload();
  478 |       
  479 |       // Verify all files appear
  480 |       for (let i = 0; i < 5; i++) {
  481 |         await expect(page.locator(`text="concurrent-${i}.txt"`)).toBeVisible();
  482 |       }
  483 |     });
  484 |   });
  485 |
  486 |   test.describe('Database Query Performance', () => {
> 487 |     test('complex query performance', async ({ page }) => {
      |         ^ Error: browserType.launch: 
  488 |       await authHelper.login(testUsers.manager);
  489 |       
  490 |       // Test complex filtering and sorting
  491 |       await page.goto('/dashboard/applicants');
  492 |       
  493 |       // Apply multiple filters
  494 |       await page.click('button:has-text("Advanced Filters")');
  495 |       await page.selectOption('select[name="income_range"]', '40000-60000');
  496 |       await page.selectOption('select[name="household_size"]', '3');
  497 |       await page.selectOption('select[name="bedroom_preference"]', '2');
  498 |       await page.fill('input[name="location"]', 'San Francisco');
  499 |       await page.selectOption('select[name="sort_by"]', 'income_desc');
  500 |       
  501 |       const startTime = Date.now();
  502 |       await page.click('button:has-text("Apply Filters")');
  503 |       await page.waitForSelector('tbody tr, .no-results');
  504 |       const queryTime = Date.now() - startTime;
  505 |       
  506 |       console.log(`Complex query time: ${queryTime}ms`);
  507 |       expect(queryTime).toBeLessThan(2000); // 2 seconds max
  508 |       
  509 |       // Test pagination performance
  510 |       if (await page.locator('.pagination').isVisible()) {
  511 |         const pageStartTime = Date.now();
  512 |         await page.click('.pagination button:has-text("2")');
  513 |         await page.waitForSelector('tbody tr');
  514 |         const paginationTime = Date.now() - pageStartTime;
  515 |         
  516 |         console.log(`Pagination time: ${paginationTime}ms`);
  517 |         expect(paginationTime).toBeLessThan(1000); // 1 second max
  518 |       }
  519 |     });
  520 |
  521 |     test('data export performance', async ({ page }) => {
  522 |       await authHelper.login(testUsers.manager);
  523 |       await page.goto('/dashboard/reports');
  524 |       
  525 |       // Test different export sizes
  526 |       const exportTests = [
  527 |         { type: 'summary', expectedTime: 2000 },
  528 |         { type: 'detailed', expectedTime: 5000 },
  529 |         { type: 'full', expectedTime: 10000 }
  530 |       ];
  531 |       
  532 |       for (const test of exportTests) {
  533 |         await page.selectOption('select[name="report_type"]', test.type);
  534 |         
  535 |         const downloadPromise = page.waitForEvent('download');
  536 |         const startTime = Date.now();
  537 |         
  538 |         await page.click('button:has-text("Generate Report")');
  539 |         
  540 |         const download = await downloadPromise;
  541 |         const exportTime = Date.now() - startTime;
  542 |         
  543 |         console.log(`${test.type} export time: ${exportTime}ms`);
  544 |         expect(exportTime).toBeLessThan(test.expectedTime);
  545 |         
  546 |         // Verify download
  547 |         expect(download.suggestedFilename()).toContain('.csv');
  548 |       }
  549 |     });
  550 |   });
  551 | });
```