import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db';
import { getAuthenticatedUser, syncUserWithDatabase } from '@/lib/clerk-helper';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  console.log('🔐 DEBUG: Sync endpoint called');

  try {
    const startTime = Date.now();
    console.log('🕐 DEBUG: Starting sync process at', new Date().toISOString());

    // Step 1: Test basic imports
    console.log('📦 DEBUG: Testing basic imports...');
    const importTime = Date.now();
    console.log('🕐 DEBUG: Imports took', importTime - startTime, 'ms');

    // Step 2: Test Clerk auth initialization
    console.log('🔑 DEBUG: Testing Clerk auth initialization...');
    const clerkStartTime = Date.now();

    try {
      // This is where it likely hangs - let's test with different approaches
      console.log('🔑 DEBUG: Attempting auth()...');
      const authResult = await auth();
      console.log('✅ DEBUG: auth() completed in', Date.now() - clerkStartTime, 'ms');
      console.log('🔑 DEBUG: auth() result:', !!authResult);
    } catch (error) {
      console.error('❌ DEBUG: auth() failed after', Date.now() - clerkStartTime, 'ms:', error);
      throw error;
    }

    // Step 3: Test currentUser()
    console.log('👤 DEBUG: Testing currentUser()...');
    const currentUserStartTime = Date.now();

    try {
      const currentUserResult = await currentUser();
      console.log('✅ DEBUG: currentUser() completed in', Date.now() - currentUserStartTime, 'ms');
      console.log('👤 DEBUG: currentUser() result:', !!currentUserResult);
    } catch (error) {
      console.error('❌ DEBUG: currentUser() failed after', Date.now() - currentUserStartTime, 'ms:', error);
      throw error;
    }

    // Step 4: Test getAuthenticatedUser()
    console.log('🔐 DEBUG: Testing getAuthenticatedUser()...');
    const getAuthStartTime = Date.now();

    try {
      const clerkUser = await getAuthenticatedUser();
      console.log('✅ DEBUG: getAuthenticatedUser() completed in', Date.now() - getAuthStartTime, 'ms');
      console.log('🔐 DEBUG: getAuthenticatedUser() result:', !!clerkUser);

      if (!clerkUser) {
        console.log('❌ DEBUG: No authenticated user found');
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('❌ DEBUG: getAuthenticatedUser() failed after', Date.now() - getAuthStartTime, 'ms:', error);
      throw error;
    }

    // Step 5: Test database connection
    console.log('💾 DEBUG: Testing database connection...');
    const dbStartTime = Date.now();

    try {
      const testQuery = await db.select({ count: users.id }).from(users).limit(1);
      console.log('✅ DEBUG: Database query completed in', Date.now() - dbStartTime, 'ms');
      console.log('💾 DEBUG: Database test result:', testQuery.length, 'rows');
    } catch (error) {
      console.error('❌ DEBUG: Database query failed after', Date.now() - dbStartTime, 'ms:', error);
      throw error;
    }

    const totalTime = Date.now() - startTime;
    console.log('🎯 DEBUG: All tests completed successfully in', totalTime, 'ms');

    return NextResponse.json({
      success: true,
      message: 'Debug sync endpoint completed successfully',
      timing: {
        total: totalTime,
        imports: importTime - startTime,
        clerkAuth: clerkStartTime - startTime,
        currentUser: currentUserStartTime - clerkStartTime,
        getAuthenticatedUser: getAuthStartTime - currentUserStartTime,
        dbTest: dbStartTime - getAuthStartTime,
      },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 DEBUG: Sync endpoint failed after', totalTime, 'ms:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug sync failed',
        timing: { total: totalTime }
      },
      { status: 500 }
    );
  }
}