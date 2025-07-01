import { Page, expect } from '@playwright/test';

export interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

export class PerformanceHelper {
  constructor(private page: Page) {}

  async measurePageLoad(url: string): Promise<PerformanceMetrics> {
    // Navigate and wait for load
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    // Get performance metrics
    const metrics = await this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];
      
      return {
        pageLoadTime: nav.loadEventEnd - nav.fetchStart,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? lcp.startTime : 0,
        timeToInteractive: nav.domInteractive - nav.fetchStart,
        totalBlockingTime: 0, // Would need more complex calculation
        cumulativeLayoutShift: 0 // Would need observer API
      };
    });
    
    return metrics;
  }

  async measureApiResponse(apiCall: () => Promise<any>): Promise<number> {
    const startTime = Date.now();
    await apiCall();
    const endTime = Date.now();
    
    return endTime - startTime;
  }

  async stressTest(action: () => Promise<any>, iterations: number = 10): Promise<number[]> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const time = await this.measureApiResponse(action);
      times.push(time);
    }
    
    return times;
  }

  async testConcurrentUsers(scenario: (page: Page) => Promise<any>, userCount: number = 5) {
    const browser = this.page.context().browser();
    const contexts = [];
    const pages = [];
    
    // Create multiple browser contexts
    for (let i = 0; i < userCount; i++) {
      const context = await browser!.newContext();
      const page = await context.newPage();
      contexts.push(context);
      pages.push(page);
    }
    
    // Run scenario concurrently
    const startTime = Date.now();
    const results = await Promise.all(pages.map(page => scenario(page)));
    const endTime = Date.now();
    
    // Clean up
    for (const context of contexts) {
      await context.close();
    }
    
    return {
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / userCount,
      results
    };
  }

  async checkMemoryUsage(): Promise<number> {
    const metrics = await this.page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });
    
    return metrics;
  }

  async generatePerformanceReport(metrics: Record<string, PerformanceMetrics>) {
    console.log('\n=== Performance Report ===\n');
    
    for (const [page, metric] of Object.entries(metrics)) {
      console.log(`Page: ${page}`);
      console.log(`  Page Load Time: ${metric.pageLoadTime}ms`);
      console.log(`  DOM Content Loaded: ${metric.domContentLoaded}ms`);
      console.log(`  First Contentful Paint: ${metric.firstContentfulPaint}ms`);
      console.log(`  Largest Contentful Paint: ${metric.largestContentfulPaint}ms`);
      console.log(`  Time to Interactive: ${metric.timeToInteractive}ms`);
      console.log('');
    }
    
    // Performance thresholds
    console.log('Performance Thresholds:');
    console.log('  ✓ Good: < 1000ms');
    console.log('  ⚠ Needs Improvement: 1000-3000ms');
    console.log('  ✗ Poor: > 3000ms');
  }

  async assertPerformanceThresholds(metrics: PerformanceMetrics) {
    // Google's Core Web Vitals thresholds
    expect(metrics.largestContentfulPaint).toBeLessThan(2500); // Good LCP
    expect(metrics.firstContentfulPaint).toBeLessThan(1800); // Good FCP
    expect(metrics.timeToInteractive).toBeLessThan(3800); // Good TTI
    expect(metrics.pageLoadTime).toBeLessThan(3000); // General load time
  }
}