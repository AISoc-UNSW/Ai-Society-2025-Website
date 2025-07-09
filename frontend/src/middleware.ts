import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/register', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log('Middleware processing:', {
    pathname,
    isPublicRoute: publicRoutes.includes(pathname)
  })

  // Update Supabase session first
  const response = await updateSession(request)

  // Skip auth check for public routes
  if (publicRoutes.includes(pathname)) {
    console.log('Public route accessed:', pathname)
    return response
  }

  // Check for legacy session token (for backward compatibility)
  const legacyToken = request.cookies.get('session_token')?.value

  // Check for Supabase auth cookies (these are the actual cookie names)
  const supabaseAccessToken = request.cookies.get('sb-access-token')?.value
  const supabaseRefreshToken = request.cookies.get('sb-refresh-token')?.value

  // Also check for the auth session cookies that Supabase actually sets
  const authCookies = request.cookies.getAll().filter(cookie =>
    cookie.name.includes('supabase') ||
    cookie.name.includes('sb-') ||
    cookie.name.includes('auth-token')
  )

  console.log('Auth check:', {
    legacyToken: legacyToken ? 'present' : 'missing',
    supabaseAccessToken: supabaseAccessToken ? 'present' : 'missing',
    supabaseRefreshToken: supabaseRefreshToken ? 'present' : 'missing',
    authCookies: authCookies.map(c => c.name)
  })

  const isAuthenticated = !!(legacyToken || supabaseAccessToken || supabaseRefreshToken || authCookies.length > 0)

  // If accessing a protected route and not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('Redirecting unauthenticated user to login')
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('User authenticated, allowing access to:', pathname)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 