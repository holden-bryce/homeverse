#!/usr/bin/env node

const { exec } = require('child_process');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

// Check if a server is running
function checkServer(url, name) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ running: res.statusCode < 500, name });
    }).on('error', () => {
      resolve({ running: false, name });
    });
  });
}

// Main function
async function main() {
  console.log('🔍 Checking if servers are running...\n');

  // Check both servers
  const [backend, frontend] = await Promise.all([
    checkServer('http://localhost:8000/health', 'Backend (port 8000)'),
    checkServer('http://localhost:3000', 'Frontend (port 3000)'),
  ]);

  // Display status
  console.log(`${backend.running ? colors.green + '✓' : colors.red + '✗'} ${backend.name} is ${backend.running ? 'running' : 'not running'}${colors.reset}`);
  console.log(`${frontend.running ? colors.green + '✓' : colors.red + '✗'} ${frontend.name} is ${frontend.running ? 'running' : 'not running'}${colors.reset}`);

  if (!backend.running || !frontend.running) {
    console.log(`\n${colors.yellow}⚠️  Please start the servers before running tests:${colors.reset}`);
    
    if (!backend.running) {
      console.log(`\n${colors.yellow}Backend:${colors.reset}`);
      console.log('  cd .. && python3 supabase_backend.py');
    }
    
    if (!frontend.running) {
      console.log(`\n${colors.yellow}Frontend:${colors.reset}`);
      console.log('  cd frontend && npm run dev');
    }
    
    console.log(`\n${colors.yellow}Then run the tests again with:${colors.reset}`);
    console.log('  npm run test:e2e\n');
    
    process.exit(1);
  }

  console.log(`\n${colors.green}✅ All servers are running! Starting tests...${colors.reset}\n`);

  // Run Playwright tests
  const testCommand = process.argv.slice(2).join(' ') || 'test';
  exec(`npx playwright ${testCommand}`, (error, stdout, stderr) => {
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    if (error) {
      console.error(`Test execution failed: ${error}`);
      process.exit(1);
    }
  });
}

// Run the script
main().catch(console.error);