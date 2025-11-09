'use server';

import { createSafeActionClient } from 'next-safe-action';
import { withAuth } from '@workos-inc/authkit-nextjs';

/**
 * Log server errors with full details for debugging
 * Never expose sensitive error details to the client
 */
const logServerError = (error: Error | unknown) => {
  const timestamp = new Date().toISOString();
  const errorName = error instanceof Error ? error.name : 'Unknown';
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${timestamp}] Server Action Error:`, {
    name: errorName,
    message: errorMessage,
    stack: errorStack,
  });

  // TODO: Integrate with error tracking service (e.g., Sentry) for production
  // if (process.env.NODE_ENV === 'production') {
  //   captureException(error, { tags: { source: 'server-action' } });
  // }
};

/**
 * Base action client with error handling
 * Logs full error details server-side, passes error to client for handling
 */
export const actionClient = createSafeActionClient({
  
  handleServerError: (e) => {
    logServerError(e);
    // Pass the original error to the client (don't rewrite it)
    // Client side will not display the error, but log a UI-friendly message instead
    return e instanceof Error ? e.message : 'An unexpected error occurred';
  },
});

/**
 * Action client with authentication middleware
 * Automatically extracts authenticated user from session
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const { user } = await withAuth();

  if (!user) {
    throw new Error('Authentication required');
  }

  return next({
    ctx: {
      userId: user.id,
      user,
    },
  });
});