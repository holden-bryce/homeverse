import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// EMERGENCY MIDDLEWARE - Minimal routing to fix recursive loading
// This bypasses Supabase middleware auth to let client-side handle it

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/terms',
  '/privacy',
  '/contact',
  '/about',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('Emergency Middleware: Processing', pathname)
  
  // Allow all public routes immediately - no auth checks
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/public/')) {
    console.log('Emergency Middleware: Allowing public route', pathname)
    return NextResponse.next()
  }
  
  // For dashboard routes, just let them through 
  // The client-side emergency dashboard will handle auth
  if (pathname.startsWith('/dashboard')) {
    console.log('Emergency Middleware: Allowing dashboard (client will handle auth)', pathname)
    return NextResponse.next()
  }
  
  // Allow everything else
  console.log('Emergency Middleware: Allowing other route', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (static assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}