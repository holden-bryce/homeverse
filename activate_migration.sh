#!/bin/bash

echo "🚀 Activating Server-First Migration"
echo "===================================="

# Change to frontend directory
cd frontend

echo "📦 Step 1: Backing up current files..."
cp src/middleware.ts src/middleware.emergency.backup.ts
cp src/app/auth/login/page.tsx src/app/auth/login/page.emergency.backup.tsx
cp src/app/dashboard/layout.tsx src/app/dashboard/layout.emergency.backup.tsx
cp src/app/dashboard/applicants/page.tsx src/app/dashboard/applicants/page.emergency.backup.tsx
cp src/app/dashboard/applicants/new/page.tsx src/app/dashboard/applicants/new/page.emergency.backup.tsx

echo "✅ Backups created"

echo "🔄 Step 2: Activating server components..."
mv src/middleware.server.ts src/middleware.ts
mv src/app/auth/login/page.server.tsx src/app/auth/login/page.tsx
mv src/app/dashboard/layout.server.tsx src/app/dashboard/layout.tsx
mv src/app/dashboard/page.server.tsx src/app/dashboard/page.tsx
mv src/app/dashboard/applicants/page.server.tsx src/app/dashboard/applicants/page.tsx
mv src/app/dashboard/applicants/new/page.server.tsx src/app/dashboard/applicants/new/page.tsx
mv src/app/dashboard/projects/page.server.tsx src/app/dashboard/projects/page.tsx

echo "✅ Server components activated"

echo "🏗️ Step 3: Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Rolling back..."
    mv src/middleware.ts src/middleware.server.ts
    mv src/middleware.emergency.backup.ts src/middleware.ts
    # ... rollback other files
    exit 1
fi

echo "🎉 Step 4: Migration Complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Test login at http://localhost:3000/auth/login"
echo "3. Test applicants CRUD"
echo "4. Run SQL scripts in Supabase dashboard:"
echo "   - fix_rls_production.sql"
echo "   - create_performance_views.sql"
echo ""
echo "To rollback, run: ./rollback_migration.sh"