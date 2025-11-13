import { authMiddleware, redirectToSignIn } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { ensureUserExists } from '@/lib/clerk-helper';

export default authMiddleware({
  // Allow public routes to be accessible without authentication
  publicRoutes: [
    '/',
    '/auth/sign-in(.*)',
    '/auth/sign-up(.*)',
    '/api/webhooks(.*)',
    '/api/courses(.*)', // Allow public course listing
    '/api/seed-data(.*)', // Development seeding endpoint
  ],

  // Allow signed-out users to access certain pages but redirect them to sign in for protected pages
  afterAuth: async (auth, req) => {
    // Handle unauthenticated users
    if (!auth.userId) {
      // If they're trying to access a protected route, redirect to sign in
      if (
        req.nextUrl.pathname.startsWith('/dashboard') ||
        req.nextUrl.pathname.startsWith('/learning') ||
        req.nextUrl.pathname.startsWith('/tools') ||
        req.nextUrl.pathname.startsWith('/admin') ||
        req.nextUrl.pathname.startsWith('/profile') ||
        req.nextUrl.pathname.startsWith('/settings') ||
        req.nextUrl.pathname.startsWith('/api/') && !req.nextUrl.pathname.startsWith('/api/courses') && !req.nextUrl.pathname.startsWith('/api/webhooks') && !req.nextUrl.pathname.startsWith('/api/seed-data')
      ) {
        return redirectToSignIn({ returnBackUrl: req.url });
      }
      return NextResponse.next();
    }

    // Ensure user exists in our database
    try {
      await ensureUserExists(auth.userId);
    } catch (error) {
      console.error('Error ensuring user exists:', error);
      // Continue even if sync fails - don't block the user
    }

    return NextResponse.next();
  },
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