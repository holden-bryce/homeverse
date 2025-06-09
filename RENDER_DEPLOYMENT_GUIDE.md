# Render Deployment Guide with CLI Tools

## Prerequisites

### Install Render CLI
```bash
# macOS/Linux
curl -sSL https://render.com/install.sh | sh

# Windows (PowerShell as Administrator)
iwr https://render.com/install.ps1 -useb | iex
```

### Authenticate with Render
```bash
# Login to Render CLI with your API key
render config set api-key rnd_hRKXqxkkBUpzqQGrHzQi2OQVlW19

# Verify authentication
render whoami
```

## Deployment Workflow

### 1. Initial Setup (One-time)

```bash
# Link your local repo to Render services
# For backend service
render link homeverse-api

# For frontend service  
render link homeverse-frontend
```

### 2. Deploy Changes

```bash
# Stage and commit your changes
git add .
git commit -m "Your descriptive commit message"

# Push to trigger deployment
git push origin main
```

### 3. Monitor Deployment in Real-Time

```bash
# Watch backend deployment logs
render logs homeverse-api --tail

# Watch frontend deployment logs
render logs homeverse-frontend --tail

# Or watch both in separate terminals
# Terminal 1:
render logs homeverse-api --tail

# Terminal 2:
render logs homeverse-frontend --tail
```

### 4. Check Deployment Status

```bash
# Check service status
render services list

# Get detailed service info
render services info homeverse-api
render services info homeverse-frontend

# Check recent deploys
render deploys list --service homeverse-api
render deploys list --service homeverse-frontend
```

## Troubleshooting Failed Deployments

### Step 1: Identify the Failure

```bash
# View the failed deploy logs
render deploys logs <deploy-id>

# Or get the latest deploy logs
render logs homeverse-api --deploy latest
```

### Step 2: Common Issues and Fixes

#### Backend Build Failures

1. **Missing Dependencies**
   ```bash
   # Check requirements.txt
   cat requirements.txt
   
   # Add missing package
   echo "package-name==version" >> requirements.txt
   ```

2. **Database Connection Issues**
   ```bash
   # Check environment variables
   render env list --service homeverse-api
   
   # Update DATABASE_URL if needed
   render env set DATABASE_URL="postgresql://..." --service homeverse-api
   ```

3. **Python Version Mismatch**
   ```bash
   # Check runtime.txt or render.yaml
   cat render.yaml
   
   # Update Python version if needed
   ```

#### Frontend Build Failures

1. **Node/npm Issues**
   ```bash
   # Check package.json
   cd frontend
   cat package.json
   
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Build Script Errors**
   ```bash
   # Test build locally first
   cd frontend
   npm run build
   
   # Fix any TypeScript/ESLint errors
   npm run lint
   npm run typecheck
   ```

### Step 3: Fix and Redeploy

```bash
# After fixing the issue locally
git add .
git commit -m "fix: [description of what you fixed]"
git push origin main

# Monitor the new deployment
render logs homeverse-api --tail
```

## Useful CLI Commands

### Service Management
```bash
# Restart a service
render services restart homeverse-api

# Scale service (if on paid plan)
render services scale homeverse-api --count 2

# Suspend/resume service
render services suspend homeverse-api
render services resume homeverse-api
```

### Environment Variables
```bash
# List all env vars
render env list --service homeverse-api

# Set a new env var
render env set KEY=value --service homeverse-api

# Set multiple env vars from file
render env set --service homeverse-api < .env.production

# Remove an env var
render env unset KEY --service homeverse-api
```

### Database Operations
```bash
# Connect to PostgreSQL database
render db connect homeverse-db

# Run migrations
render run --service homeverse-api "alembic upgrade head"

# Create database backup
render db backup create homeverse-db
```

### Debugging Live Service
```bash
# SSH into running service (if enabled)
render ssh homeverse-api

# Run one-off command
render run --service homeverse-api "python manage.py migrate"

# View recent errors only
render logs homeverse-api --filter error --tail
```

## Deployment Checklist

Before pushing to main:

1. **Test Locally**
   ```bash
   # Backend
   python3 simple_backend.py
   
   # Frontend
   cd frontend && npm run dev
   ```

2. **Check for Errors**
   ```bash
   # Lint frontend
   cd frontend && npm run lint
   
   # Check Python syntax
   python -m py_compile simple_backend.py
   ```

3. **Verify Environment Variables**
   ```bash
   # List required vars
   render env list --service homeverse-api | grep -E "(DATABASE_URL|JWT_SECRET|REDIS_URL)"
   ```

4. **Monitor During Deployment**
   ```bash
   # Push and watch
   git push origin main && render logs homeverse-api --tail
   ```

## Automated Monitoring Script

Create `monitor_render_deploy.sh`:

```bash
#!/bin/bash

# Function to check deploy status
check_deploy() {
    local service=$1
    echo "Checking $service deployment..."
    
    # Get latest deploy status
    status=$(render deploys list --service $service --limit 1 --json | jq -r '.[0].status')
    
    if [ "$status" = "live" ]; then
        echo "✅ $service deployed successfully!"
        return 0
    elif [ "$status" = "failed" ]; then
        echo "❌ $service deployment failed!"
        echo "Fetching error logs..."
        render logs $service --filter error --limit 50
        return 1
    else
        echo "🔄 $service deployment in progress... ($status)"
        return 2
    fi
}

# Monitor both services
echo "Starting deployment monitor..."

while true; do
    clear
    echo "=== Render Deployment Monitor ==="
    echo "Time: $(date)"
    echo ""
    
    check_deploy "homeverse-api"
    api_status=$?
    
    echo ""
    
    check_deploy "homeverse-frontend"
    frontend_status=$?
    
    # If both are deployed successfully, exit
    if [ $api_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
        echo ""
        echo "🎉 All services deployed successfully!"
        break
    fi
    
    # If either failed, prompt for action
    if [ $api_status -eq 1 ] || [ $frontend_status -eq 1 ]; then
        echo ""
        echo "Deployment failed! Check logs above and fix issues."
        echo "Press Ctrl+C to exit and fix, or wait for auto-retry..."
    fi
    
    sleep 10
done
```

Make it executable:
```bash
chmod +x monitor_render_deploy.sh
./monitor_render_deploy.sh
```

## Quick Reference

### Most Used Commands
```bash
# Deploy
git push origin main

# Watch logs
render logs homeverse-api --tail

# Check status
render services list

# Restart service
render services restart homeverse-api

# View env vars
render env list --service homeverse-api

# SSH into service
render ssh homeverse-api
```

### Service URLs
- Backend API: https://homeverse-api.onrender.com
- Frontend: https://homeverse-frontend.onrender.com
- API Docs: https://homeverse-api.onrender.com/docs

### Support
- Render Dashboard: https://dashboard.render.com
- Render Status: https://status.render.com
- Render Docs: https://render.com/docs

## Notes

- Deployments typically take 3-10 minutes
- Free tier services sleep after 15 minutes of inactivity
- Always test locally before deploying
- Monitor logs during deployment to catch issues early
- Keep your API key secure and never commit it to git