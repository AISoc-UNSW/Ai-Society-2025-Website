import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// Public routes
const publicRoutes = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('session_token')?.value

  const isPublicRoute = publicRoutes.includes(pathname)

  // If accessing a protected route (non-public route) and there is no token, redirect to the login page
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // All other cases (accessing public routes, or accessing protected routes with a token) are allowed
  return NextResponse.next()
}

// Update matcher to run the middleware on all requests except static resources and API
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 