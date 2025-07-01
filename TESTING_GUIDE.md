# HomeVerse Testing Guide

## Quick Start for E2E Testing

### Step 1: Start the Servers

You need both the backend and frontend servers running before testing.

**Terminal 1 - Start Backend:**
```bash
cd /mnt/c/Users/12486/homeverse
python3 supabase_backend.py
```

**Terminal 2 - Start Frontend:**
```bash
cd /mnt/c/Users/12486/homeverse/frontend
npm run dev
```

### Step 2: Run the Tests

**Terminal 3 - Run Tests:**
```bash
cd /mnt/c/Users/12486/homeverse/frontend

# Run all E2E tests
npm run test:e2e

# Or run in interactive UI mode (recommended)
npm run test:e2e:ui

# Or run specific test suite
npx playwright test tests/e2e/01-user-journeys.spec.ts
```

## Common Issues and Solutions

### Error: "Process from config.webServer was not able to start"
**Solution:** The servers need to be started manually. Follow Step 1 above.

### Error: "Backend/Frontend server is not running"
**Solution:** Make sure both servers are running:
- Backend should show: "Uvicorn running on http://127.0.0.1:8000"
- Frontend should show: "Ready on http://localhost:3000"

### Error: "Port already in use"
**Solution:** Kill existing processes:
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

## Test Suites Available

1. **User Journey Tests** - Tests complete workflows for all user roles
   ```bash
   npx playwright test tests/e2e/01-user-journeys.spec.ts
   ```

2. **Core Features** - Tests authentication, CRUD operations, etc.
   ```bash
   npx playwright test tests/e2e/02-core-features.spec.ts
   ```

3. **Security Tests** - Validates security measures
   ```bash
   npx playwright test tests/e2e/03-security-features.spec.ts
   ```

4. **UI/UX Tests** - Tests responsive design and accessibility
   ```bash
   npx playwright test tests/e2e/04-ui-ux-components.spec.ts
   ```

5. **Performance Tests** - Tests integrations and performance
   ```bash
   npx playwright test tests/e2e/05-integration-performance.spec.ts
   ```

## Using the Test UI (Recommended for Development)

The Playwright UI mode is the best way to run and debug tests:

```bash
npm run test:e2e:ui
```

This opens an interactive interface where you can:
- See all available tests
- Run individual tests
- Watch tests execute in real-time
- Debug failures with time-travel debugging
- See screenshots and traces

## Manual Testing

For manual testing procedures, see:
```bash
cat frontend/tests/MANUAL_TESTING_CHECKLIST.md
```

## Test Reports

After running tests, view the HTML report:
```bash
npm run test:e2e:report
```

## Tips for Successful Testing

1. **Always start servers first** - Tests won't run without them
2. **Use UI mode for debugging** - It's much easier to see what's happening
3. **Run one test at a time when debugging** - Helps isolate issues
4. **Check server logs** - If tests fail, check both server terminals for errors
5. **Clear browser data** - Sometimes cached data can cause issues

## Need Help?

- Check test output for specific error messages
- Review the test files in `frontend/tests/e2e/`
- Consult the Playwright documentation
- Check server logs for backend errors