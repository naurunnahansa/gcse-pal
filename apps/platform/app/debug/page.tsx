'use client';

import { useUser, useClerk } from '@clerk/nextjs';

export default function DebugClerkPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();

  console.log('Debug page - Clerk state:', {
    isLoaded,
    isSignedIn,
    user: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName
    } : null
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clerk Debug Page</h1>

      <div className="space-y-4">
        <div>
          <strong>Clerk Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}
        </div>

        <div>
          <strong>Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}
        </div>

        {user && (
          <div>
            <strong>User Info:</strong>
            <pre className="bg-gray-100 p-2 rounded mt-2">
              {JSON.stringify({
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress,
                name: user.fullName,
                firstName: user.firstName,
                lastName: user.lastName
              }, null, 2)}
            </pre>
          </div>
        )}

        {!isSignedIn && isLoaded && (
          <button
            onClick={() => clerk.openSignIn({ redirectUrl: '/dashboard' })}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Sign In with Clerk
          </button>
        )}

        {isSignedIn && (
          <button
            onClick={() => clerk.signOut({ redirectUrl: '/debug' })}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}