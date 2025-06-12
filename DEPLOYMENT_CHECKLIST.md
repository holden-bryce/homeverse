# Render Deployment Checklist

## Pre-Deployment Steps

### 1. Supabase Setup ✓
- [ ] RLS policies applied (fix_rls_safe_v2.sql)
- [ ] Test companies created
- [ ] Test users created with proper roles
- [ ] Missing tables created (if needed)

### 2. Environment Variables

#### Backend (homeverse-api.onrender.com)
```
SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
SUPABASE_SERVICE_KEY=<get from Supabase dashboard>
SUPABASE_ANON_KEY=<get from Supabase dashboard>
CORS_ORIGINS=*
SENDGRID_API_KEY=<your SendGrid API key>
OPENAI_API_KEY=<your OpenAI API key>
PYTHONPATH=.
```

#### Frontend (homeverse-frontend.onrender.com)
```
NEXT_PUBLIC_API_URL=https://homeverse-api.onrender.com
NEXT_PUBLIC_MAPBOX_TOKEN=<your Mapbox token>
NEXT_PUBLIC_SUPABASE_URL=https://vzxadsifonqklotzhdpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same as backend SUPABASE_ANON_KEY>
```

### 3. Build Commands

#### Backend Service
- **Build**: `pip install --upgrade pip && pip install -r requirements_minimal_supabase.txt`
- **Start**: `python3 supabase_backend.py`

#### Frontend Service
- **Build**: `cd frontend && npm install && npm run build`
- **Start**: `cd frontend && npm start`
- **Root Directory**: `/` (not `/frontend`)

### 4. Render Dashboard Settings

1. **Backend** (should auto-create from render.yaml):
   - Name: homeverse-api
   - Environment: Python
   - Region: Oregon
   - Plan: Starter

2. **Frontend** (create manually):
   - Name: homeverse-frontend
   - Environment: Node
   - Build Command: `cd frontend && npm install && npm run build`
   - Start Command: `cd frontend && npm start`
   - Add all frontend env vars

### 5. Post-Deployment Verification

1. Check backend health:
   ```
   curl https://homeverse-api.onrender.com/health
   ```

2. Check frontend loads:
   ```
   https://homeverse-frontend.onrender.com
   ```

3. Test login functionality
4. Test data creation (applicants/projects)
5. Verify data isolation between companies

### 6. Common Issues & Solutions

**Frontend build fails:**
- Ensure Node version is compatible (>=18)
- Check for TypeScript errors with `npm run type-check`

**Backend fails to start:**
- Check Supabase credentials are correct
- Verify Python version (>=3.9)
- Check logs for missing dependencies

**CORS errors:**
- Update CORS_ORIGINS in backend to include frontend URL
- Or keep as "*" for development

**Authentication fails:**
- Verify Supabase keys match between frontend/backend
- Check RLS policies are applied correctly

### 7. Final Steps

1. Push to main branch:
   ```bash
   git add .
   git commit -m "Deploy to Render with Supabase integration"
   git push origin main
   ```

2. Monitor build logs in Render dashboard
3. Test all functionality once deployed
4. Set up custom domain (optional)

## Success Criteria

- [ ] Backend API responding at /health
- [ ] Frontend loading without errors
- [ ] Users can login
- [ ] Users can create/view applicants
- [ ] Users can create/view projects
- [ ] Data properly isolated by company
- [ ] Real-time features working (if applicable)