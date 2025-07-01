# 🔧 Fixing Failing E2E Tests

The tests are likely failing due to timing issues, wrong selectors, or differences between headless and headed mode. Let's debug and fix them!

## 1. Run Debug Helper Test First

This will help identify the actual issues:

```bash
cd frontend
npx playwright test tests/e2e/debug-helper.spec.ts --headed
```

This test will:
- Check if servers are actually accessible
- Log what elements are found on the page
- Show you exactly what's happening

## 2. Common Issues & Fixes

### Issue 1: Timing Problems
Tests might be running too fast. Run with debug config:

```bash
# Use the debug config with slower execution
npx playwright test --config=playwright.config.debug.ts
```

### Issue 2: Wrong Selectors
The app might use different selectors than expected. Check actual selectors:

```bash
# Run in UI mode to inspect elements
npm run test:e2e:ui
```

Then right-click elements to copy correct selectors.

### Issue 3: Authentication State
Tests might need proper test data. Let's check:

```bash
# Run just the login test in headed mode
npx playwright test -g "login" --headed --debug
```

## 3. Quick Fixes to Try

### Fix A: Update Selectors
Edit `frontend/tests/helpers/auth.helper.ts`:

```typescript
// Change generic selectors to more specific ones
await this.page.fill('input[type="email"]', user.email);
await this.page.fill('input[type="password"]', user.password);
await this.page.click('button:has-text("Sign in"), button:has-text("Login")');
```

### Fix B: Add Better Waits
Add explicit waits for elements:

```typescript
// Wait for page to be ready
await this.page.waitForLoadState('networkidle');
await this.page.waitForSelector('input[type="email"]', { state: 'visible' });
```

### Fix C: Check Test Data
Make sure test users exist in the database:

```bash
# Check if test users are created
curl http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 4. Run Tests One by One

Run individual test files to isolate issues:

```bash
# Just user journey tests
npx playwright test 01-user-journeys.spec.ts --headed

# Just core features
npx playwright test 02-core-features.spec.ts --headed

# With debugging
npx playwright test 01-user-journeys.spec.ts --debug
```

## 5. View Test Artifacts

After tests fail, check the artifacts:

```bash
# Open the HTML report
npx playwright show-report

# Check screenshots and videos in:
ls test-results/
```

## 6. Update All Tests at Once

If selectors are consistently wrong, we can batch update:

```bash
# Find all instances of wrong selectors
grep -r "input\[name=\"email\"\]" tests/

# Replace with correct selector
find tests/ -name "*.ts" -exec sed -i 's/input\[name="email"\]/input\[type="email"\]/g' {} +
```

## 7. Create a Working Test First

Let's create one simple test that definitely works:

```typescript
// tests/e2e/simple-smoke.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/HomeVerse/);
});
```

Run it:
```bash
npx playwright test simple-smoke.spec.ts
```

## Need More Help?

1. **Share the error messages** - What specific errors are you seeing?
2. **Share a screenshot** - What does the page look like when tests fail?
3. **Check the test report** - The HTML report shows exactly where tests fail

The tests work in UI mode because:
- UI mode is slower (natural delays)
- You can see what's happening
- Browser is in headed mode

Let's fix the headless/fast execution issues!