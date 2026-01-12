import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that require authentication
const protectedRoutes = ['/', '/gallery']

// Routes that should redirect authenticated users away
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  const isAuthRoute = authRoutes.some((route) => pathname === route)

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from login page
  if (isAuthRoute && user) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (svg, png, jpg, etc.)
     * - api routes (handled separately with their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/).*)',
  ],
}
