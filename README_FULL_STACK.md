# HomeVerse - Full Stack Next.js Application

## 🚀 New Architecture: Full Server-Side

We've migrated to a full server-side architecture using Next.js 14 with Supabase. This eliminates the need for a separate backend API.

### Benefits
- **Single codebase** - No more API synchronization
- **Better performance** - No client-server round trips
- **Enhanced security** - API keys never exposed
- **Simpler deployment** - One service to deploy
- **Type safety** - End-to-end TypeScript

## 🏗️ Architecture

```
Next.js 14 (Full Stack)
├── Server Components (Data fetching & UI)
├── Server Actions (Mutations)
├── Route Handlers (Webhooks & APIs)
└── Supabase (Auth, Database, Storage)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Development

```bash
# Install dependencies
cd frontend
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase keys to .env.local

# Run development server
npm run dev

# Access at http://localhost:3000
```

### Environment Variables

Create `.env.local` with:

```env
# Public (exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Server-only (never exposed)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SENDGRID_API_KEY=your_sendgrid_key
OPENAI_API_KEY=your_openai_key
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (public)/          # Public pages
│   │   ├── dashboard/         # Protected dashboard
│   │   └── api/               # Route handlers
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   │   ├── supabase/         # Supabase clients
│   │   └── data/             # Data fetching
│   └── types/                # TypeScript types
```

## 🔐 Authentication

Authentication is handled entirely by Supabase:

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  // Fetch data server-side
  const { data } = await supabase
    .from('table')
    .select('*')
}
```

## 🗄️ Data Access

All data fetching happens server-side:

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    
  return <ProjectList projects={data} />
}
```

## 🔄 Mutations with Server Actions

```typescript
// Server Action
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('projects')
    .insert({...})
    
  if (!error) {
    revalidatePath('/dashboard/projects')
  }
}
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- AWS Amplify
- Netlify
- Railway
- Render

## 🧪 Testing

```bash
# Run tests
npm test

# E2E tests
npm run test:e2e
```

## 📝 Migration Notes

### From API-based to Server-Side

1. **Remove API calls** - Replace with server component data fetching
2. **Convert mutations** - Use server actions instead of API endpoints
3. **Update auth** - Use Supabase auth helpers
4. **Remove backend** - Delete FastAPI backend code

### Data Flow

Old way:
```
Client → API → Database → API → Client
```

New way:
```
Server Component → Database → HTML to Client
```

## 🔗 Resources

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details