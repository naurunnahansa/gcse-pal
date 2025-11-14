import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Temporarily make all routes public for testing API integration
const isPublicRoute = createRouteMatcher(['/(.*)']);

export default clerkMiddleware((auth, req) => {
  // All routes are public for now - remove authentication for testing
  // You can add authentication back later by changing the matcher above
});