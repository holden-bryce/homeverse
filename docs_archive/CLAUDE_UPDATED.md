# CLAUDE.md - AI Assistant Guide for HomeVerse

Last Updated: June 9, 2025

## 🚨 CRITICAL: Current Production Status

### Authentication Status
- **Frontend**: ✅ Live at https://homeverse-frontend.onrender.com
- **Backend**: ✅ Live at https://homeverse-api.onrender.com
- **Database**: ❌ PostgreSQL tables need initialization
- **Authentication**: ❌ Waiting for database initialization

### To Fix Authentication
Run this in Render Shell for homeverse-api:
```python
python3 init_clean_postgres.py
```

## Current Architecture (AS-IS)

### Backend Structure
```
simple_backend.py          # 6300+ line monolithic FastAPI application
├── All models            # Pydantic models inline
├── All endpoints         # All API routes in one file
├── Database logic        # SQLite/PostgreSQL handling
├── Authentication        # JWT implementation
└── Business logic        # All services inline
```

### Key Files
- **`simple_backend.py`**: The ONLY backend file currently in use
- **`render.yaml`**: Render deployment configuration
- **`requirements.txt`**: Python dependencies
- **`frontend/`**: Next.js application (well-organized)

### Database
- **Local**: SQLite with pre-initialized test data
- **Production**: PostgreSQL (requires manual initialization)
- **Schema**: Defined inline in simple_backend.py

## Test Credentials

All passwords: `password123`

- `developer@test.com` → Developer Portal
- `lender@test.com` → Lender Portal
- `buyer@test.com` → Buyer Portal
- `applicant@test.com` → Applicant Portal
- `admin@test.com` → Admin Portal

## Development Commands

### Local Development
```bash
# Backend
python3 simple_backend.py

# Frontend
cd frontend && npm run dev
```

### Production Deployment
```bash
git add .
git commit -m "Your changes"
git push origin main
# Deployment happens automatically via Render
```

## Current Issues & Solutions

### Issue 1: "no such table: users"
**Solution**: Initialize PostgreSQL database
```bash
# In Render Shell
python3 init_clean_postgres.py
```

### Issue 2: "Authentication service temporarily unavailable"
**Cause**: Database not initialized
**Solution**: See Issue 1

### Issue 3: Schema mismatch errors
**Cause**: Different schemas between init scripts and actual database
**Solution**: Use init_clean_postgres.py which has the correct minimal schema

## Environment Variables

### Required for Production
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET_KEY`: JWT signing key
- `SENDGRID_API_KEY`: Email service
- `CORS_ORIGINS`: Set to "*" for development

### Optional
- `OPENAI_API_KEY`: AI features
- `UNSTRUCTURED_API_KEY`: Document processing
- `USE_SQLITE`: Force SQLite mode (development)

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Current user info

### Main Resources
- `/api/v1/applicants` - Applicant management
- `/api/v1/projects` - Project management
- `/api/v1/users` - User management
- `/api/v1/admin` - Admin operations

### Health & Status
- `GET /health` - Service health check
- `GET /api/init-db-2024-temp?secret=homeverse-init-2024` - DB initialization

## Known Technical Debt

1. **Monolithic Backend**: All code in one 6300+ line file
2. **Legacy Code**: Unused modular architecture in `app/` directory
3. **Multiple Init Scripts**: Various database initialization approaches
4. **Schema Inconsistencies**: Different schemas in different places
5. **Documentation Sprawl**: 20+ documentation files with overlapping info

## Future Architecture (TO-BE)

See `CODEBASE_CLEANUP_PLAN.md` for the refactoring roadmap.

## Tips for AI Assistants

1. **Always use `simple_backend.py`** - ignore files in `app/` directory
2. **Check logs first** - Most issues are database-related
3. **Use SQLite locally** - Faster development, no setup needed
4. **Test endpoints** - Use curl or the frontend to verify fixes
5. **Small commits** - Push frequently to trigger deployments

## Quick Debugging

```bash
# Check if backend is running
curl https://homeverse-api.onrender.com/health

# Test authentication
curl -X POST https://homeverse-api.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "developer@test.com", "password": "password123"}'

# Check frontend
curl https://homeverse-frontend.onrender.com
```

## Contact

- **Frontend Issues**: Check browser console and network tab
- **Backend Issues**: Check Render logs
- **Database Issues**: Run initialization script
- **Deployment Issues**: Check render.yaml and GitHub Actions