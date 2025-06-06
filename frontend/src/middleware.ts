import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/terms',
  '/privacy',
  '/contact',
]

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get auth token from cookies or localStorage (via request header)
  const token = request.cookies.get('auth_token')?.value || 
               request.headers.get('authorization')?.replace('Bearer ', '')

  // Allow public routes without authentication
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/public/')) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && AUTH_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      // Redirect to login with the current path as a return URL
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Add company key validation for dashboard routes
    const companyKey = request.cookies.get('company_key')?.value ||
                      request.headers.get('x-company-key')
    
    if (!companyKey && !pathname.startsWith('/dashboard/setup')) {
      // Redirect to company setup if no company key
      return NextResponse.redirect(new URL('/dashboard/setup', request.url))
    }
  }

  // API routes protection
  if (pathname.startsWith('/api/v1')) {
    // Allow auth endpoints without token
    if (pathname.includes('/auth/') && 
        (pathname.includes('login') || 
         pathname.includes('register') || 
         pathname.includes('refresh'))) {
      return NextResponse.next()
    }
    
    // Require authentication for other API routes
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Require company key for multi-tenant endpoints
    const companyKey = request.headers.get('x-company-key')
    if (!companyKey && !pathname.includes('/auth/')) {
      return NextResponse.json(
        { error: 'Company key required' },
        { status: 401 }
      )
    }
  }

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