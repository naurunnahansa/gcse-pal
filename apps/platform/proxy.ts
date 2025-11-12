import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/signin(.*)',
  '/auth/signup(.*)',
  '/api/webhooks(.*)',
  '/api/chat(.*)', // Keep chat public for now, will handle auth in route
]);

export default clerkMiddleware((auth, req) => {
  // Temporarily disable authentication checks for debugging dashboard access
  // if (!isPublicRoute(req) && !auth().userId) {
  //   const { origin } = new URL(req.url);
  //   return Response.redirect(`${origin}/auth/signin`);
  // }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};