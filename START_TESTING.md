# Quick Start for Testing HomeVerse

## ✅ Backend is Running!
The backend is now running at http://localhost:8000

## Next Steps:

### 1. Open a NEW Terminal for Frontend
```bash
cd /mnt/c/Users/12486/homeverse/frontend
npm run dev
```

### 2. Open a THIRD Terminal for Tests
Once both servers are running, run the tests:

```bash
cd /mnt/c/Users/12486/homeverse/frontend

# Option A: Run all tests automatically
npm run test:e2e

# Option B: Use the interactive UI (RECOMMENDED!)
npm run test:e2e:ui
```

## Test Status Summary

✅ **Created 72 automated test scenarios** covering:
- Multi-role user journeys (5 roles)
- Core features (auth, CRUD, file management)
- Security validation (rate limiting, encryption, RBAC)
- UI/UX components (responsive, accessibility)
- Performance & integrations (Supabase, SendGrid, Mapbox)

## Available Test Commands

```bash
# Run all tests
npm run test:e2e

# Interactive UI mode (best for development)
npm run test:e2e:ui

# Run specific test suite
npx playwright test tests/e2e/01-user-journeys.spec.ts
npx playwright test tests/e2e/02-core-features.spec.ts
npx playwright test tests/e2e/03-security-features.spec.ts
npx playwright test tests/e2e/04-ui-ux-components.spec.ts
npx playwright test tests/e2e/05-integration-performance.spec.ts

# View test report after running tests
npm run test:e2e:report
```

## Manual Testing
For manual testing procedures, see:
`frontend/tests/MANUAL_TESTING_CHECKLIST.md`

## Test Credentials

All test accounts use these credentials:
- Developer: `developer@test.com` / `password123`
- Lender: `lender@test.com` / `password123`
- Staff: `staff@homeverse-test.com` / `Staff123!`
- Manager: `manager@homeverse-test.com` / `Manager123!`
- Applicant: `applicant@test.com` / `Applicant123!`

## Troubleshooting

If you see "Backend/Frontend server is not running":
1. Make sure you have 3 terminals open
2. Terminal 1: Backend (should show "Uvicorn running on http://0.0.0.0:8000")
3. Terminal 2: Frontend (should show "Ready on http://localhost:3000")
4. Terminal 3: Run tests

Happy Testing! 🚀