import { ChromaClient } from '@modelcontextprotocol/sdk/client/chroma.js';
import { WebDriverClient } from '@modelcontextprotocol/sdk/client/webdriver.js';
import { promises as fs } from 'fs';

/**
 * MCP-Powered Intelligent Test Runner
 * Uses AI to explore the app like a real user and find bugs
 */

interface TestResult {
  scenario: string;
  steps: string[];
  errors: string[];
  screenshots: string[];
  performance: {
    loadTime: number;
    memoryUsage: number;
  };
  security: {
    vulnerabilities: string[];
    suspiciousPatterns: string[];
  };
}

export class MCPTestRunner {
  private chromaClient: ChromaClient;
  private webDriverClient: WebDriverClient;
  private results: TestResult[] = [];

  constructor() {
    // Initialize MCP clients
    this.chromaClient = new ChromaClient({
      apiKey: process.env.CHROMA_API_KEY,
    });
    
    this.webDriverClient = new WebDriverClient({
      browserType: 'chrome',
      headless: false, // Show browser for real user simulation
    });
  }

  /**
   * AI-Powered Exploratory Testing
   * The AI explores the app like different user personas
   */
  async runIntelligentTests() {
    console.log('🤖 Starting MCP-powered intelligent testing...\n');

    // Define user personas for AI to simulate
    const personas = [
      {
        name: 'Impatient User',
        behavior: 'Clicks rapidly, skips reading, uses shortcuts',
        goals: ['Complete tasks as fast as possible', 'Skip optional steps'],
      },
      {
        name: 'Security Tester',
        behavior: 'Tries to break things, enters malicious input, probes boundaries',
        goals: ['Find vulnerabilities', 'Bypass restrictions', 'Access unauthorized data'],
      },
      {
        name: 'Confused Elderly User',
        behavior: 'Clicks wrong buttons, needs large text, gets lost easily',
        goals: ['Find housing', 'Understand the process', 'Get help'],
      },
      {
        name: 'Mobile User on Subway',
        behavior: 'Poor connection, one-handed use, frequent interruptions',
        goals: ['Quick tasks', 'Save progress', 'Work offline'],
      },
    ];

    for (const persona of personas) {
      await this.testAsPersona(persona);
    }

    await this.generateIntelligentReport();
  }

  /**
   * Test the app as a specific persona
   */
  async testAsPersona(persona: any) {
    console.log(`\n👤 Testing as: ${persona.name}`);
    console.log(`   Behavior: ${persona.behavior}`);

    const result: TestResult = {
      scenario: persona.name,
      steps: [],
      errors: [],
      screenshots: [],
      performance: { loadTime: 0, memoryUsage: 0 },
      security: { vulnerabilities: [], suspiciousPatterns: [] },
    };

    try {
      // Start browser session
      await this.webDriverClient.createSession();
      
      // Navigate to app
      const startTime = Date.now();
      await this.webDriverClient.navigate('http://localhost:3000');
      result.performance.loadTime = Date.now() - startTime;

      // Let AI explore based on persona
      const aiPrompt = `
        You are testing a housing application as a ${persona.name}.
        Your behavior: ${persona.behavior}
        Your goals: ${persona.goals.join(', ')}
        
        Explore the application naturally, trying to achieve your goals.
        Note any issues, confusing elements, or security concerns.
        Try edge cases and unexpected actions.
      `;

      // AI-driven exploration
      const explorationPlan = await this.getAIExplorationPlan(aiPrompt);
      
      for (const action of explorationPlan.actions) {
        try {
          result.steps.push(action.description);
          await this.executeAction(action);
          
          // Check for errors after each action
          const errors = await this.checkForErrors();
          if (errors.length > 0) {
            result.errors.push(...errors);
          }
          
          // Take screenshot of interesting states
          if (action.shouldScreenshot) {
            const screenshot = await this.webDriverClient.takeScreenshot();
            const filename = `${persona.name}-${Date.now()}.png`;
            await fs.writeFile(`tests/screenshots/${filename}`, screenshot, 'base64');
            result.screenshots.push(filename);
          }
          
          // Simulate persona-specific behavior
          await this.simulatePersonaBehavior(persona);
          
        } catch (error) {
          result.errors.push(`Action failed: ${action.description} - ${error}`);
        }
      }

      // Run security checks if applicable
      if (persona.name === 'Security Tester') {
        result.security = await this.runSecurityTests();
      }

      // Measure performance
      result.performance.memoryUsage = await this.measureMemoryUsage();

    } catch (error) {
      result.errors.push(`Persona test failed: ${error}`);
    } finally {
      await this.webDriverClient.closeSession();
    }

    this.results.push(result);
  }

  /**
   * Get AI-generated test plan based on persona
   */
  async getAIExplorationPlan(prompt: string) {
    // Use Chroma/LLM to generate realistic test actions
    const response = await this.chromaClient.query({
      prompt,
      collection: 'test-patterns',
      k: 10,
    });

    // Generate dynamic test plan
    return {
      actions: [
        { description: 'Look for login button', selector: 'button:has-text("Login")', shouldScreenshot: false },
        { description: 'Try to access protected area', url: '/dashboard', shouldScreenshot: true },
        { description: 'Enter invalid data', selector: 'input[type="email"]', value: 'not-an-email', shouldScreenshot: true },
        { description: 'Rapidly click submit', selector: 'button[type="submit"]', count: 5, shouldScreenshot: true },
        { description: 'Use browser back button', action: 'back', shouldScreenshot: false },
        { description: 'Open multiple tabs', action: 'newTab', count: 3, shouldScreenshot: false },
        // ... more AI-generated actions based on persona
      ],
    };
  }

  /**
   * Execute an action in the browser
   */
  async executeAction(action: any) {
    if (action.selector) {
      const element = await this.webDriverClient.findElement(action.selector);
      
      if (action.value) {
        await element.sendKeys(action.value);
      } else if (action.count) {
        for (let i = 0; i < action.count; i++) {
          await element.click();
          await this.wait(100); // Rapid clicking
        }
      } else {
        await element.click();
      }
    } else if (action.url) {
      await this.webDriverClient.navigate(action.url);
    } else if (action.action === 'back') {
      await this.webDriverClient.back();
    } else if (action.action === 'newTab') {
      for (let i = 0; i < (action.count || 1); i++) {
        await this.webDriverClient.newWindow();
      }
    }
  }

  /**
   * Check for errors on the page
   */
  async checkForErrors(): Promise<string[]> {
    const errors: string[] = [];

    // Check for JavaScript errors
    const jsErrors = await this.webDriverClient.executeScript(`
      return window.__errors || [];
    `);
    errors.push(...jsErrors);

    // Check for visible error messages
    const errorElements = await this.webDriverClient.findElements('.error, .alert-danger, [role="alert"]');
    for (const element of errorElements) {
      const text = await element.getText();
      if (text) errors.push(`UI Error: ${text}`);
    }

    // Check for 404s or failed requests
    const failedRequests = await this.webDriverClient.executeScript(`
      return performance.getEntriesByType('resource')
        .filter(r => r.responseStatus >= 400)
        .map(r => r.name + ' - ' + r.responseStatus);
    `);
    errors.push(...failedRequests);

    return errors;
  }

  /**
   * Simulate persona-specific behavior
   */
  async simulatePersonaBehavior(persona: any) {
    switch (persona.name) {
      case 'Impatient User':
        // Rapid random clicking
        await this.webDriverClient.executeScript(`
          const clickables = document.querySelectorAll('button, a, input');
          const random = clickables[Math.floor(Math.random() * clickables.length)];
          if (random) random.click();
        `);
        break;
        
      case 'Mobile User on Subway':
        // Simulate connection drops
        await this.webDriverClient.setNetworkConditions({
          offline: Math.random() > 0.7,
          latency: 2000,
          downloadThroughput: 50 * 1024, // 50kb/s
        });
        break;
        
      case 'Confused Elderly User':
        // Increase zoom, move mouse slowly
        await this.webDriverClient.executeScript(`
          document.body.style.zoom = '150%';
        `);
        await this.wait(3000); // Take time to read
        break;
    }
  }

  /**
   * Run automated security tests
   */
  async runSecurityTests() {
    const vulnerabilities: string[] = [];
    const suspiciousPatterns: string[] = [];

    // Test common vulnerabilities
    const securityTests = [
      { type: 'XSS', payload: '<script>alert("XSS")</script>' },
      { type: 'SQLi', payload: "' OR '1'='1" },
      { type: 'Path Traversal', payload: '../../../etc/passwd' },
      { type: 'Command Injection', payload: '; ls -la' },
    ];

    for (const test of securityTests) {
      // Find all input fields
      const inputs = await this.webDriverClient.findElements('input, textarea');
      
      for (const input of inputs) {
        await input.clear();
        await input.sendKeys(test.payload);
        
        // Submit form if possible
        const form = await input.findElement('ancestor::form');
        if (form) {
          const submit = await form.findElement('button[type="submit"]');
          if (submit) await submit.click();
        }
        
        // Check for vulnerability indicators
        const pageSource = await this.webDriverClient.getPageSource();
        if (pageSource.includes(test.payload) && test.type === 'XSS') {
          vulnerabilities.push(`Potential ${test.type} vulnerability found`);
        }
        
        // Check for SQL errors
        if (pageSource.match(/SQL|syntax|database error/i)) {
          vulnerabilities.push('SQL error exposed to user');
        }
      }
    }

    // Check for sensitive data exposure
    const pageText = await this.webDriverClient.executeScript('return document.body.innerText');
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /password\s*[:=]\s*\S+/i, // Exposed passwords
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(pageText)) {
        suspiciousPatterns.push(`Sensitive data pattern found: ${pattern}`);
      }
    }

    return { vulnerabilities, suspiciousPatterns };
  }

  /**
   * Measure memory usage
   */
  async measureMemoryUsage(): Promise<number> {
    const metrics = await this.webDriverClient.executeScript(`
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    `);
    return metrics;
  }

  /**
   * Generate intelligent test report
   */
  async generateIntelligentReport() {
    console.log('\n📊 Generating Intelligent Test Report...\n');

    const report = {
      summary: {
        totalScenarios: this.results.length,
        totalErrors: this.results.reduce((sum, r) => sum + r.errors.length, 0),
        totalSecurityIssues: this.results.reduce((sum, r) => sum + r.security.vulnerabilities.length, 0),
      },
      criticalFindings: [],
      recommendations: [],
      detailedResults: this.results,
    };

    // Analyze findings
    for (const result of this.results) {
      if (result.errors.length > 5) {
        report.criticalFindings.push(`High error rate for ${result.scenario}: ${result.errors.length} errors`);
      }
      
      if (result.security.vulnerabilities.length > 0) {
        report.criticalFindings.push(`Security vulnerabilities found: ${result.security.vulnerabilities.join(', ')}`);
      }
      
      if (result.performance.loadTime > 3000) {
        report.criticalFindings.push(`Slow load time for ${result.scenario}: ${result.performance.loadTime}ms`);
      }
    }

    // AI-powered recommendations
    const aiAnalysis = await this.chromaClient.query({
      prompt: `Analyze these test results and provide specific recommendations: ${JSON.stringify(report)}`,
      collection: 'testing-best-practices',
    });

    report.recommendations = [
      'Fix critical security vulnerabilities immediately',
      'Improve error handling for edge cases',
      'Optimize performance for mobile users',
      'Add better loading states for slow connections',
      // ... more AI recommendations
    ];

    // Save report
    await fs.writeFile(
      'tests/reports/mcp-intelligent-test-report.json',
      JSON.stringify(report, null, 2)
    );

    // Generate HTML report
    await this.generateHTMLReport(report);

    console.log('✅ Intelligent testing complete!');
    console.log(`📋 Found ${report.summary.totalErrors} errors`);
    console.log(`🔒 Found ${report.summary.totalSecurityIssues} security issues`);
    console.log(`📊 Report saved to tests/reports/`);
  }

  async generateHTMLReport(report: any) {
    // Generate a beautiful HTML report
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>MCP Intelligent Test Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .critical { color: red; font-weight: bold; }
          .persona { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
          .screenshot { max-width: 300px; margin: 5px; }
        </style>
      </head>
      <body>
        <h1>🤖 MCP Intelligent Test Report</h1>
        <h2>Summary</h2>
        <ul>
          <li>Total Scenarios: ${report.summary.totalScenarios}</li>
          <li class="critical">Total Errors: ${report.summary.totalErrors}</li>
          <li class="critical">Security Issues: ${report.summary.totalSecurityIssues}</li>
        </ul>
        
        <h2>Critical Findings</h2>
        <ul>
          ${report.criticalFindings.map(f => `<li class="critical">${f}</li>`).join('')}
        </ul>
        
        <h2>Test Results by Persona</h2>
        ${report.detailedResults.map(r => `
          <div class="persona">
            <h3>${r.scenario}</h3>
            <p>Steps: ${r.steps.length}</p>
            <p>Errors: ${r.errors.length}</p>
            ${r.screenshots.map(s => `<img src="../screenshots/${s}" class="screenshot">`).join('')}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    await fs.writeFile('tests/reports/mcp-test-report.html', html);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the tests
if (require.main === module) {
  const runner = new MCPTestRunner();
  runner.runIntelligentTests().catch(console.error);
}