import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
  '/about',
]

const AUTH_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  
  // Allow public routes without authentication
  if (PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/public/')) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (session && AUTH_ROUTES.includes(pathname)) {
      // Get user role to redirect to appropriate dashboard
      const role = session.user?.user_metadata?.role || 'buyer'
      const roleRoutes: Record<string, string> = {
        developer: '/dashboard/projects',
        lender: '/dashboard/lenders',
        buyer: '/dashboard/buyers',
        applicant: '/dashboard/applicants',
        admin: '/dashboard',
      }
      const redirectPath = roleRoutes[role] || '/dashboard'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return response
  }

  // Protected routes - require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      // Redirect to login with the current path as a return URL
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If accessing root while authenticated, don't auto-redirect
  // Let the user choose where to go
  if (pathname === '/' && session) {
    // Don't auto-redirect, let them see the landing page
    return response
  }

  return response
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