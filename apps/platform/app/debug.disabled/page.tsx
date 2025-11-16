'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useAuth } from '@/components/AuthProvider';
import React, { useEffect } from 'react';

export default function DebugClerkPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();
  const { user: authUser, isAuthenticated, isLoading, isAdmin, isStudent, isTeacher } = useAuth();

  useEffect(() => {
    // Add the test script to window
    const testSync = async () => {
      try {
        console.log('🧪 Testing sync endpoint...');

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important: include cookies for authentication
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('📡 Response status:', response.status);

        if (!response.ok) {
          console.error('❌ Sync failed:', response.status, response.statusText);
          return;
        }

        const result = await response.json();
        console.log('✅ Sync successful:', result);

        if (result.data?.role) {
          console.log('🎯 User role:', result.data.role);
          if (result.data.role === 'admin') {
            console.log('🎉 User has admin privileges!');
          } else {
            console.log('⚠️ User role is:', result.data.role);
          }
        } else {
          console.log('❌ No role found in response');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('⏰ Sync request timed out after 15 seconds');
        } else {
          console.error('💥 Error testing sync:', error);
        }
      }
    };

    // Make it available globally
    (window as any).testSync = testSync;
    console.log('💡 Run testSync() in the console to test the sync endpoint');

    // Add test function for bypass endpoint
    const testBypassSync = async () => {
      try {
        console.log('🧪 Testing bypass sync endpoint...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('/api/auth/sync-bypass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('📡 Bypass response status:', response.status);

        if (!response.ok) {
          console.error('❌ Bypass sync failed:', response.status, response.statusText);
          return;
        }

        const result = await response.json();
        console.log('✅ Bypass sync successful:', result);

        if (result.data?.role) {
          console.log('🎯 User role:', result.data.role);
          if (result.data.role === 'admin') {
            console.log('🎉 User has admin privileges!');
          } else {
            console.log('⚠️ User role is:', result.data.role);
          }
        } else {
          console.log('❌ No role found in bypass response');
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('⏰ Bypass sync request timed out after 10 seconds');
        } else {
          console.error('💥 Error testing bypass sync:', error);
        }
      }
    };

    // Make it available globally
    (window as any).testBypassSync = testBypassSync;
    console.log('💡 Run testBypassSync() in the console to test the bypass endpoint');

    // Add database role check function
    const checkDatabaseRole = async () => {
      try {
        console.log('🔍 Checking database role directly...');

        const response = await fetch('/api/auth/get-current-role', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          console.error('❌ Failed to get database role:', response.status);
          return;
        }

        const result = await response.json();
        console.log('✅ Database role check result:', result);

        if (result.data?.role) {
          console.log('🎯 Database role:', result.data.role);
          if (result.data.role === 'admin') {
            console.log('🎉 User has admin role in database!');
          } else {
            console.log('⚠️ User role in database is:', result.data.role);
          }
        } else {
          console.log('❌ No role found in database');
        }
      } catch (error) {
        console.error('💥 Error checking database role:', error);
      }
    };

    // Add admin access test function
    const testAdminAccess = async () => {
      try {
        console.log('🧪 Testing admin access...');

        const response = await fetch('/api/auth/check-admin-access', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        console.log('📡 Admin access test status:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('✅ Admin access test successful:', result);
          console.log('🎉 User can access admin endpoints!');
        } else {
          console.error('❌ Admin access test failed:', response.status);
          const errorResult = await response.json().catch(() => ({}));
          console.error('Error details:', errorResult);
        }
      } catch (error) {
        console.error('💥 Error testing admin access:', error);
      }
    };

    // Make them available globally
    (window as any).checkDatabaseRole = checkDatabaseRole;
    (window as any).testAdminAccess = testAdminAccess;
    console.log('💡 Run checkDatabaseRole() to check role directly from database');
    console.log('💡 Run testAdminAccess() to test admin endpoint access');
  }, []);

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
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Authentication Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Clerk State</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}</div>
            {user && (
              <div>
                <strong>Clerk User Info:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
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
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-4">AuthProvider State</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</div>
            <div><strong>Admin:</strong> {isAdmin ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Student:</strong> {isStudent ? '✅ Yes' : '❌ No'}</div>
            <div><strong>Teacher:</strong> {isTeacher ? '✅ Yes' : '❌ No'}</div>
            {authUser && (
              <div>
                <strong>Auth User Info:</strong>
                <pre className="bg-gray-100 p-2 rounded mt-2 text-xs">
                  {JSON.stringify({
                    email: authUser.email,
                    name: authUser.name,
                    role: authUser.role
                  }, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="font-semibold mb-4">Database Role Check</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Check Database Role:</p>
              <p className="text-gray-600 mb-2">Check current role directly from database:</p>
              <code className="bg-gray-200 px-2 py-1 rounded text-sm">checkDatabaseRole()</code>
            </div>
            <div>
              <p className="font-medium">Test Admin Access:</p>
              <p className="text-gray-600 mb-2">Test if admin pages are accessible:</p>
              <code className="bg-gray-200 px-2 py-1 rounded text-sm">testAdminAccess()</code>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg mt-6">
        <h2 className="font-semibold mb-4">Testing Tools</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium">Test Sync Endpoint:</p>
            <p className="text-gray-600 mb-2">Open the browser console and run:</p>
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">testSync()</code>
          </div>

          <div>
            <p className="font-medium">Force Role Refresh:</p>
            <p className="text-gray-600 mb-2">To force refresh the user role, run:</p>
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">window.refreshUserRole()</code>
          </div>

          <div>
            <p className="font-medium">Test Bypass Endpoint:</p>
            <p className="text-gray-600 mb-2">Test the bypass sync directly:</p>
            <code className="bg-gray-200 px-2 py-1 rounded text-sm">testBypassSync()</code>
          </div>

          <div>
            <p className="font-medium">Manual Navigation:</p>
            <p className="text-gray-600">Try accessing these URLs:</p>
            <ul className="list-disc list-inside mt-1">
              <li><a href="/dashboard/admin/overview" className="text-blue-600 hover:underline">/dashboard/admin/overview</a></li>
              <li><a href="/dashboard/admin/courses" className="text-blue-600 hover:underline">/dashboard/admin/courses</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mt-6">
        <h2 className="font-semibold mb-4">Actions</h2>
        <div className="space-x-4">
          {!isSignedIn && isLoaded && (
            <button
              onClick={() => clerk.openSignIn({ redirectUrl: '/dashboard' })}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Sign In with Clerk
            </button>
          )}

          {isSignedIn && (
            <button
              onClick={() => clerk.signOut({ redirectUrl: '/debug' })}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}