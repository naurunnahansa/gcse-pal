import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define role-based route matchers
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/admin(.*)',
  '/dashboard/admin(.*)',
])

const isTeacherRoute = createRouteMatcher([
  '/teacher(.*)',
  '/api/teacher(.*)',
  '/dashboard/teacher(.*)',
])

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/courses(.*)',
  '/quizzes(.*)',
  '/profile(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Get user's role from session metadata
  const session = await auth()
  const userRole = session?.sessionClaims?.metadata?.role as string

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute(req) && !session?.userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Protect admin routes - only admin users can access
  if (isAdminRoute(req) && userRole !== 'admin') {
    const url = new URL('/unauthorized', req.url)
    return NextResponse.redirect(url)
  }

  // Protect teacher routes - only teacher or admin users can access
  if (isTeacherRoute(req) && !['teacher', 'admin'].includes(userRole || '')) {
    const url = new URL('/unauthorized', req.url)
    return NextResponse.redirect(url)
  }

  // For public routes, continue normally
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}