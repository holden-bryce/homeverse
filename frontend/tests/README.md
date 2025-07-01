# HomeVerse E2E Test Suite

This directory contains comprehensive end-to-end tests for the HomeVerse application using Playwright.

## Test Structure

```
tests/
├── e2e/                          # E2E test files
│   ├── 01-user-journeys.spec.ts  # Multi-role user journey tests
│   ├── 02-core-features.spec.ts  # Core feature workflow tests
│   ├── 03-security-features.spec.ts # Security validation tests
│   ├── 04-ui-ux-components.spec.ts # UI/UX component tests
│   └── 05-integration-performance.spec.ts # Integration & performance tests
├── fixtures/                     # Test data and user fixtures
│   └── users.ts                  # Test user accounts and data
├── helpers/                      # Test helper utilities
│   ├── auth.helper.ts           # Authentication helpers
│   ├── applicant.helper.ts      # Applicant management helpers
│   ├── project.helper.ts        # Project management helpers
│   ├── file.helper.ts           # File handling helpers
│   └── performance.helper.ts    # Performance testing helpers
├── reports/                     # Generated test reports
├── MANUAL_TESTING_CHECKLIST.md  # Manual testing procedures
├── TEST_EXECUTION_REPORT.md     # Sample test execution report
└── run-e2e-tests.sh            # Test runner script
```

## Quick Start

### Prerequisites
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Start the servers:
   ```bash
   # Terminal 1: Backend
   python3 supabase_backend.py

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

### Running Tests

1. **Run all E2E tests:**
   ```bash
   npm run test:e2e
   ```

2. **Run tests in UI mode (recommended for development):**
   ```bash
   npm run test:e2e:ui
   ```

3. **Run specific test suite:**
   ```bash
   # Using npm scripts
   npx playwright test tests/e2e/01-user-journeys.spec.ts

   # Using test runner script
   ./tests/run-e2e-tests.sh user-journeys
   ```

4. **Debug tests:**
   ```bash
   npm run test:e2e:debug
   ```

5. **View test report:**
   ```bash
   npm run test:e2e:report
   ```

## Test Suites

### 1. User Journey Tests (`01-user-journeys.spec.ts`)
Tests complete workflows for all user roles:
- Super Admin system management
- Company Admin organization setup
- Manager approval workflows
- Staff daily operations
- Applicant housing search and application

### 2. Core Features (`02-core-features.spec.ts`)
Tests essential functionality:
- Authentication (login, register, password reset)
- Applicant CRUD operations
- Project management
- Application processing
- File management
- Communications

### 3. Security Features (`03-security-features.spec.ts`)
Validates security measures:
- Rate limiting
- PII encryption
- Role-based access control
- CORS configuration
- Session management
- Input validation
- File security
- Audit logging

### 4. UI/UX Components (`04-ui-ux-components.spec.ts`)
Tests user interface elements:
- Responsive design (mobile, tablet, desktop)
- Accessibility (keyboard, screen readers)
- Loading states
- Error handling
- Interactive components
- Real device testing

### 5. Integration & Performance (`05-integration-performance.spec.ts`)
Tests external integrations and performance:
- Supabase database operations
- SendGrid email delivery
- Mapbox integration
- Performance benchmarks
- Concurrent user handling
- Memory usage

## Test Configuration

### Environment Variables
Create a `.env.test` file for test-specific configuration:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Playwright Configuration
Edit `playwright.config.ts` to customize:
- Browser selection
- Viewport sizes
- Base URL
- Timeouts
- Parallel execution

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Tests should clean up after themselves
3. **Explicit Waits**: Use proper waiting strategies
4. **Error Messages**: Include descriptive error messages
5. **Screenshots**: Capture on failure for debugging

## Debugging Tips

1. **Use UI Mode**: Best for interactive debugging
   ```bash
   npm run test:e2e:ui
   ```

2. **Slow Motion**: Add slowMo to see actions
   ```typescript
   test.use({ slowMo: 500 });
   ```

3. **Debug Mode**: Pause execution
   ```typescript
   await page.pause();
   ```

4. **Console Logs**: View browser console
   ```typescript
   page.on('console', msg => console.log(msg.text()));
   ```

## Writing New Tests

1. Create a new spec file in `tests/e2e/`
2. Import necessary helpers and fixtures
3. Use descriptive test names
4. Group related tests with `describe`
5. Follow the existing patterns

Example:
```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../helpers/auth.helper';
import { testUsers } from '../fixtures/users';

test.describe('New Feature', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.login(testUsers.staff);
  });

  test('should do something', async ({ page }) => {
    // Your test here
  });
});
```

## Manual Testing

For manual testing procedures, refer to `MANUAL_TESTING_CHECKLIST.md`.

## Continuous Integration

To run tests in CI:
```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npx playwright install
    npm run test:e2e
```

## Troubleshooting

### Common Issues

1. **Port already in use**: Kill existing processes
   ```bash
   lsof -ti:3000 | xargs kill
   lsof -ti:8000 | xargs kill
   ```

2. **Browser not installed**: Install Playwright browsers
   ```bash
   npx playwright install
   ```

3. **Timeout errors**: Increase timeout in config
   ```typescript
   use: {
     actionTimeout: 60 * 1000,
   }
   ```

## Support

For issues or questions:
1. Check test output and screenshots
2. Review helper implementations
3. Consult Playwright documentation
4. Contact the development team