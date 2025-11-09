import { handleAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';

export const GET = handleAuth({
  returnPathname: '/dashboard',
  onError: async ({ error, request }) => {
    console.error('AuthKit authentication error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=auth_failed', request.url));
  },
});
