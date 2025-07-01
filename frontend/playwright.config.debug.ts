import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially for debugging
  retries: 0, // No retries for debugging
  workers: 1, // Single worker for debugging
  
  reporter: [
    ['list'], // Simple list output
    ['html', { open: 'never' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on', // Always capture trace
    screenshot: 'on', // Always take screenshots
    video: 'on', // Always record video
    
    // Slower actions for debugging
    actionTimeout: 60 * 1000,
    navigationTimeout: 60 * 1000,
    
    // Headed mode for debugging
    headless: false,
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Slow down actions
    launchOptions: {
      slowMo: 500 // Slow down by 500ms
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});