import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/sign-in(.*)',
  '/auth/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/courses(.*)', // Allow public course listing
  '/api/seed-data(.*)', // Development seeding endpoint
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Handle unauthenticated users trying to access protected routes
  if (!userId && !isPublicRoute(req)) {
    const { origin } = new URL(req.url);
    return NextResponse.redirect(`${origin}/auth/sign-in`);
  }

  // Note: User database sync is handled in API routes and page components,
  // not in middleware to avoid edge runtime issues with Prisma

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};