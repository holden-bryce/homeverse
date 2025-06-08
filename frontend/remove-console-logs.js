#!/usr/bin/env node

/**
 * Script to remove console.log, console.warn, and console.error statements
 * from production builds while preserving them in error boundaries
 */

const fs = require('fs');
const path = require('path');

const filesToClean = [
  'src/app/auth/login/page.tsx',
  'src/app/dashboard/applicants/page.tsx',
  'src/components/layout/dashboard-layout.tsx',
  'src/lib/api/client.ts',
];

// Files to preserve console statements (error boundaries)
const excludeFiles = [
  'src/components/ui/error-boundary.tsx',
];

function removeConsoleLogs(filePath) {
  if (excludeFiles.some(excluded => filePath.includes(excluded))) {
    console.log(`Skipping ${filePath} (excluded)`);
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace console.log/warn/error with proper error handling
    content = content.replace(
      /console\.(log|warn|error)\s*\([^)]*\)/g,
      (match) => {
        if (match.includes('error')) {
          return '// TODO: Send to error reporting service';
        }
        return '// Console statement removed for production';
      }
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Cleaned ${filePath}`);
    } else {
      console.log(`- No changes needed for ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log('Removing console statements for production...\n');

filesToClean.forEach(file => {
  const fullPath = path.join(__dirname, file);
  removeConsoleLogs(fullPath);
});

console.log('\n✅ Console statement removal complete!');
console.log('\nNote: Error boundaries still retain console statements for development debugging.');
console.log('Consider integrating a proper error reporting service like Sentry.');