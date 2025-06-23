# VS Code Debugging Guide for HomeVerse

## 🚀 Quick Start

### Option 1: Run Everything (Easiest)
1. Open VS Code in the project root
2. Press `F5` or go to Run → Start Debugging
3. Select **"Full Stack: Backend + Frontend"**
4. Both backend (port 8000) and frontend (port 3000) will start
5. Make changes - they auto-reload!

### Option 2: Debug Individual Components

#### Debug Backend Only:
1. Set breakpoints in `supabase_backend.py`
2. Select **"Python: FastAPI Backend"** from debug dropdown
3. Press `F5`
4. Backend runs with debugger attached at http://localhost:8000

#### Debug Frontend Only:
1. Set breakpoints in React components
2. Select **"Next.js: Debug Frontend"** 
3. Press `F5`
4. Frontend runs with Node debugger at http://localhost:3000

#### Debug in Chrome:
1. Start frontend first (manually or via debug)
2. Select **"Chrome: Debug Frontend"**
3. Press `F5`
4. Chrome opens with React DevTools debugging

## 🛠️ Common Tasks (Ctrl+Shift+P → "Tasks: Run Task")

- **Start Backend**: Run backend without debugger
- **Start Frontend**: Run frontend without debugger
- **Type Check Frontend**: Check TypeScript errors
- **Lint Frontend**: Run ESLint
- **Build Frontend**: Test production build
- **Test Backend API**: Run functionality tests

## 🔍 Debugging Features

### Backend (Python):
- Set breakpoints in any `.py` file
- Inspect variables in Variables panel
- Use Debug Console for live Python evaluation
- Step through code with F10 (over) / F11 (into)

### Frontend (React/TypeScript):
- Set breakpoints in `.tsx`/`.ts` files
- Use Chrome DevTools for component inspection
- Console logs appear in Debug Console
- Hot reload preserves state

## 💡 Pro Tips

### 1. Environment Variables
- All `.env` variables are automatically loaded
- Check them in Debug Console: `process.env` (frontend) or `os.environ` (backend)

### 2. Quick Iteration
- Frontend: Save file → Auto refreshes browser
- Backend: Save file → FastAPI auto-reloads
- No need to restart debugger!

### 3. Inspect Database Queries
Set breakpoint after Supabase calls:
```python
result = supabase.table('applications').select('*').execute()
# Breakpoint here - inspect 'result' in Variables panel
```

### 4. Debug API Calls
In frontend, set breakpoint in hooks:
```typescript
const response = await fetch('/api/v1/applications')
// Breakpoint here - check response in debugger
```

### 5. Full Stack Debugging
Use **"Full Stack: Debug Mode"** to debug both simultaneously:
- Backend breakpoints in VS Code
- Frontend breakpoints in Chrome DevTools
- See API calls flow through entire stack

## 🔧 Troubleshooting

### "Cannot find module" errors:
```bash
cd frontend && npm install
pip install -r requirements_supabase.txt
```

### Port already in use:
```bash
# Kill existing processes
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:8000 | xargs kill -9  # Backend
```

### Debugger not attaching:
1. Stop all debug sessions
2. Restart VS Code
3. Check no other debuggers running

## 🎯 Workflow Example

1. Start debugging: `F5` → "Full Stack: Backend + Frontend"
2. Open http://localhost:3000 in browser
3. Make changes to code:
   - Backend: Edit `supabase_backend.py` → Auto reloads
   - Frontend: Edit components → Hot reload in browser
4. Set breakpoints where needed
5. Test feature → Hit breakpoint → Inspect variables
6. Fix issue → Save → Test again
7. No redeploy needed! 🎉

## 📝 VS Code Shortcuts

- `F5`: Start debugging
- `Shift+F5`: Stop debugging
- `F9`: Toggle breakpoint
- `F10`: Step over
- `F11`: Step into
- `Shift+F11`: Step out
- `Ctrl+Shift+P`: Command palette
- `Ctrl+Shift+D`: Debug panel