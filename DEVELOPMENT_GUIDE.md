# 🚀 HomeVerse Development Guide

**Last Updated**: December 8, 2024  
**Production Status**: 95% Ready (Database initialization pending)

## 🎯 Quick Start

### Local Development (Recommended)
```bash
# Terminal 1: Start backend
python3 simple_backend.py

# Terminal 2: Start frontend
cd frontend && npm run dev

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

### Test Accounts
All passwords: `password123`
- `developer@test.com` → Developer Portal
- `lender@test.com` → Lender Portal  
- `buyer@test.com` → Buyer Portal
- `applicant@test.com` → Applicant Portal
- `admin@test.com` → Admin Portal

## 🏗️ Architecture Overview

### Current Production Setup
- **Backend**: `simple_backend.py` (monolithic FastAPI, supports SQLite/PostgreSQL)
- **Frontend**: Next.js 14 with TypeScript
- **Database**: SQLite (local), PostgreSQL (production-ready)
- **Deployment**: Render.com
- **Email**: SendGrid integration

### Key Files
```
homeverse/
├── simple_backend.py         # ⭐ MAIN BACKEND (5000+ lines, production)
├── frontend/                 # Next.js frontend
│   ├── src/app/             # App router pages
│   └── src/components/      # React components
├── homeverse_demo.db        # SQLite database with test data
└── render.yaml              # Deployment configuration
```

## 🔧 Environment Variables

### Backend (.env)
```bash
# Required
JWT_SECRET_KEY=your-secret-key-here
SENDGRID_API_KEY=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

# Optional
DATABASE_URL=postgresql://user:pass@localhost/homeverse  # For PostgreSQL
OPENAI_API_KEY=your-openai-key                          # For AI matching
```

### Frontend (frontend/.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token  # Optional for maps
```

## 📦 Features Status

### ✅ Fully Working
- Multi-role authentication (5 user types)
- Applicant management (CRUD)
- Project management (CRUD)
- Email notifications (contact forms)
- File uploads
- Activity logging
- Multi-tenant isolation
- Interactive maps
- Data visualizations

### ⚠️ Pending in Production
- Database initialization (PostgreSQL needs test users)
- AI-powered matching (requires OpenAI API key)

## 🚨 Common Issues & Solutions

### Authentication Errors
**Problem**: Login returns 500 error  
**Solution**: Database not initialized. For local dev, SQLite works automatically.

### CORS Issues
**Problem**: Frontend can't reach backend  
**Solution**: Ensure `CORS_ORIGINS="*"` in backend environment

### Missing Dependencies
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend && npm install
```

## 🚀 Deployment

### Current Production URLs
- Frontend: https://homeverse-frontend.onrender.com
- Backend: https://homeverse-api.onrender.com

### Deploy Changes
```bash
git add .
git commit -m "Your change description"
git push origin main

# Monitor deployment
python3 monitor_deployment.py
```

## 🧪 Testing

### Run Tests
```bash
# Backend tests
pytest

# Frontend tests
cd frontend && npm test

# Production validation
python3 production_ready_checklist.py
```

### Manual Testing Flow
1. Login with test account
2. Create new applicant
3. View applicant details
4. Edit applicant
5. Test other role portals

## 📂 Project Structure Explanation

### Why `simple_backend.py`?
- Started as modular FastAPI (`app/` directory)
- Consolidated into single file for easier deployment
- Contains all endpoints, models, and logic
- Production-proven and stable

### Future Refactoring Plan
1. Keep `simple_backend.py` running
2. Gradually extract modules
3. Move to `app/` structure
4. Maintain backward compatibility

## 🔍 Where to Find Things

| Feature | Location |
|---------|----------|
| API Endpoints | `simple_backend.py` (search for `@app.post` or `@app.get`) |
| Database Models | `simple_backend.py` (search for `class` definitions) |
| Frontend Pages | `frontend/src/app/` |
| UI Components | `frontend/src/components/` |
| Authentication | `simple_backend.py` (search for `login` or `JWT`) |

## 📝 Development Workflow

1. **Make Changes**
   - Backend: Edit `simple_backend.py`
   - Frontend: Edit files in `frontend/src/`

2. **Test Locally**
   - Restart backend if needed
   - Frontend hot-reloads automatically

3. **Commit & Deploy**
   ```bash
   git add .
   git commit -m "feat: your feature"
   git push
   ```

4. **Verify Production**
   - Check deployment status
   - Run validation script
   - Test key features

## 🆘 Getting Help

- **Documentation**: This guide + README.md
- **API Reference**: http://localhost:8000/docs
- **Test Logins**: TEST_LOGINS.md
- **Environment Vars**: ENVIRONMENT_VARIABLES.md
- **Contact**: holdenbryce06@gmail.com

## ⚡ Performance Tips

1. **Database**: Use PostgreSQL for production
2. **Caching**: Redis ready (not required)
3. **File Storage**: Local filesystem (S3 ready)
4. **Monitoring**: Use production validation scripts

## 🎯 Launch Checklist

- [x] Backend deployed and healthy
- [x] Frontend deployed and accessible  
- [x] SSL/HTTPS enabled
- [x] Email system working
- [x] Test accounts created (SQLite)
- [ ] PostgreSQL initialized with test data
- [ ] Monitoring alerts configured
- [ ] First user onboarded

---

**Remember**: `simple_backend.py` is the source of truth for the backend. All other backend files are legacy/experimental.