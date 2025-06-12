#!/bin/bash

echo "🔄 Rolling back to Emergency Architecture"
echo "========================================"

cd frontend

echo "📦 Restoring emergency files..."
mv src/middleware.ts src/middleware.server.ts
mv src/app/auth/login/page.tsx src/app/auth/login/page.server.tsx
mv src/app/dashboard/layout.tsx src/app/dashboard/layout.server.tsx
mv src/app/dashboard/page.tsx src/app/dashboard/page.server.tsx
mv src/app/dashboard/applicants/page.tsx src/app/dashboard/applicants/page.server.tsx
mv src/app/dashboard/applicants/new/page.tsx src/app/dashboard/applicants/new/page.server.tsx
mv src/app/dashboard/projects/page.tsx src/app/dashboard/projects/page.server.tsx

# Restore backups
mv src/middleware.emergency.backup.ts src/middleware.ts
mv src/app/auth/login/page.emergency.backup.tsx src/app/auth/login/page.tsx
mv src/app/dashboard/layout.emergency.backup.tsx src/app/dashboard/layout.tsx
mv src/app/dashboard/applicants/page.emergency.backup.tsx src/app/dashboard/applicants/page.tsx
mv src/app/dashboard/applicants/new/page.emergency.backup.tsx src/app/dashboard/applicants/new/page.tsx

echo "✅ Emergency architecture restored"
echo ""
echo "Run: npm run dev"