'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';

export function SignOutButton() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut({ 
        returnTo: process.env.NEXT_PUBLIC_WORKOS_LOGOUT_REDIRECT_URI || 'http://localhost:3000/sign-in' 
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-gray-500 hover:text-gray-700 text-sm"
    >
      Sign Out
    </button>
  );
}
