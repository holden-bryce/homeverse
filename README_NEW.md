# HomeVerse - Affordable Housing Platform

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0--beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

HomeVerse is a comprehensive platform connecting affordable housing developers, lenders, and prospective buyers/renters. The platform streamlines the application process, ensures fair housing compliance, and provides analytics for all stakeholders.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- SendGrid API key (for emails)

### Local Development

```bash
# Clone the repository
git clone https://github.com/holden-bryce/homeverse.git
cd homeverse

# Backend setup
pip install -r requirements_supabase.txt
cp .env.example .env
# Edit .env with your credentials

# Start backend
python supabase_backend.py

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your credentials

# Start frontend
npm run dev
```

Access the application at http://localhost:3000

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI + Supabase
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Email**: SendGrid
- **Hosting**: Render

### Key Features
- 🏠 Multi-role platform (Developers, Lenders, Buyers, Applicants, Admins)
- 📝 Application submission and tracking
- ✅ Automated approval workflows
- 📊 Analytics and reporting dashboards
- 🗺️ Interactive property maps
- 📧 Email notifications
- 🔒 Row-level security

## 📁 Project Structure

```
homeverse/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # Reusable components
│   │   └── lib/           # Utilities and helpers
├── supabase_backend.py      # Main backend application
├── requirements_supabase.txt # Python dependencies
├── .env.example             # Environment template
└── docs/                    # Documentation
```

## 🔑 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Developer | developer@test.com | password123 |
| Lender | lender@test.com | password123 |
| Buyer | buyer@test.com | password123 |
| Applicant | applicant@test.com | password123 |
| Admin | admin@test.com | password123 |

## 📊 Current Status

### ✅ Working Features
- User authentication and multi-tenant isolation
- Project CRUD operations with geospatial data
- Application submission and review workflow
- Email notifications with SendGrid
- Real-time dashboards with charts
- Responsive UI with Tailwind CSS

### 🚧 Beta Launch Requirements
See [BETA_LAUNCH_PLAN.md](./BETA_LAUNCH_PLAN.md) for detailed roadmap

### 🧹 Cleanup Needed
See [CLEANUP_PLAN.md](./CLEANUP_PLAN.md) for technical debt reduction

## 🛠️ Development

### Backend API
```bash
# Run backend
python supabase_backend.py

# API docs available at
http://localhost:8000/docs
```

### Frontend Development
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run lint     # Run linting
npm run test     # Run tests (when implemented)
```

### Environment Variables
See [ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) for required configuration

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive API docs
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Architecture Overview](./docs/ARCHITECTURE.md) - System design
- [Development Guide](./docs/DEVELOPMENT.md) - Local setup
- [Test Logins](./TEST_LOGINS.md) - Test account details

## 🚀 Deployment

### Backend (Render)
```bash
# Automatic deployment on push to main
git push origin main
```

### Frontend (Render/Vercel)
```bash
# Automatic deployment on push
git push origin main
```

### Live URLs
- Frontend: https://homeverse-frontend.onrender.com
- Backend API: https://homeverse-api.onrender.com
- API Docs: https://homeverse-api.onrender.com/docs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Backend: Black + Ruff
- Frontend: ESLint + Prettier
- Commits: Conventional commits

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Resources

- [Issue Tracker](https://github.com/holden-bryce/homeverse/issues)
- [Project Board](https://github.com/holden-bryce/homeverse/projects)
- [Wiki](https://github.com/holden-bryce/homeverse/wiki)

## 📞 Support

For support and questions:
- Email: support@homeverse.com
- Discord: [Join our server](https://discord.gg/homeverse)
- Documentation: [docs.homeverse.com](https://docs.homeverse.com)

---

Built with ❤️ by the HomeVerse Team