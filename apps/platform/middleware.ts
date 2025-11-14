import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/signin(.*)',
  '/auth/signup(.*)',
  '/api/courses(.*)',  // Public course listing
  '/api/webhooks/clerk(.*)', // Clerk webhooks
  '/api/trpc(.*)', // tRPC API
]);

export default clerkMiddleware((auth, req) => {
  // Skip middleware for static assets and internal Next.js routes only
  if (
    req.nextUrl.pathname.startsWith('/_next/') ||
    req.nextUrl.pathname.startsWith('/favicon.') ||
    req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check if route is public first
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all other routes - check if user is authenticated
  const { userId } = auth();
  if (!userId) {
    // Not authenticated, redirect to sign in
    const signInUrl = new URL('/auth/signin', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // User is authenticated, continue
  return NextResponse.next();
});