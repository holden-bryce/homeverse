# Recreate Render Database - Fresh Start

## Option 1: Delete and Recreate Database (Recommended)

### Steps:

1. **Go to Render Dashboard**
   - https://dashboard.render.com
   - Navigate to your PostgreSQL database

2. **Delete the existing database**
   - Click on the database service
   - Go to Settings
   - Scroll down to "Delete Database"
   - Confirm deletion

3. **Create a new PostgreSQL database**
   - Click "New +"
   - Select "PostgreSQL"
   - Name: `homeverse-db` (or similar)
   - Choose same region as your app
   - Select plan (free tier is fine)
   - Click "Create Database"

4. **Update the backend service**
   - Go to your `homeverse-api` service
   - Navigate to Environment
   - Update `DATABASE_URL` with the new connection string
   - Save (this will trigger a redeploy)

5. **Wait for deployment**
   - The backend will restart with the new database
   - Check logs to ensure it connects successfully

6. **Initialize the database**
   - Once deployed, run:
   ```bash
   curl -X POST https://homeverse-api.onrender.com/api/init-db-2024-temp?secret=homeverse-init-2024
   ```
   
   This should work because the database will be completely empty and the initialization script will create tables with the schema it expects.

## Option 2: Clear Existing Database

If you want to keep the same database instance:

1. **Go to Render Dashboard > Shell**
   
2. **Run this to drop all tables:**
   ```python
   import psycopg2
   import os
   
   conn = psycopg2.connect(os.getenv('DATABASE_URL'))
   cursor = conn.cursor()
   
   # Get all table names
   cursor.execute("""
       SELECT tablename FROM pg_tables 
       WHERE schemaname = 'public'
   """)
   tables = cursor.fetchall()
   
   # Drop each table
   for table in tables:
       print(f"Dropping table: {table[0]}")
       cursor.execute(f"DROP TABLE IF EXISTS {table[0]} CASCADE")
   
   conn.commit()
   print("✅ All tables dropped")
   
   cursor.close()
   conn.close()
   ```

3. **Then run the initialization:**
   ```bash
   curl -X POST https://homeverse-api.onrender.com/api/init-db-2024-temp?secret=homeverse-init-2024
   ```

## Option 3: Use SQLite Instead (Quickest)

1. **Update environment variables on Render:**
   - Go to `homeverse-api` > Environment
   - Add: `USE_SQLITE=true`
   - Add: `DATABASE_PATH=homeverse_demo.db`
   - Save (triggers redeploy)

2. **SQLite already has test data initialized!**

## Why This Works

The issue is that the production PostgreSQL database has tables with a different schema than what the initialization endpoint expects. By starting fresh, the initialization endpoint can create the tables with the exact schema it needs.

The error we saw:
```
column "full_name" of relation "users" does not exist
```

This happens because the initialization code tries to INSERT with a full_name column, but the existing table doesn't have that column. Starting fresh solves this mismatch.

## After Recreation

Once you've recreated the database and it initializes successfully, you can test login at:
- https://homeverse-frontend.onrender.com/auth/login

With credentials:
- developer@test.com / password123
- lender@test.com / password123
- buyer@test.com / password123
- applicant@test.com / password123
- admin@test.com / password123