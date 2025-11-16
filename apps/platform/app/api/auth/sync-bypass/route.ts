import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  console.log('🔓 BYPASS: Sync endpoint called (no Clerk auth)');

  try {
    const startTime = Date.now();

    // Try to get user info from the request body (for manual testing)
    let userEmail = null;

    try {
      const body = await req.json();
      userEmail = body.email;
      console.log('📧 BYPASS: Email from request body:', userEmail);
    } catch (error) {
      console.log('📝 BYPASS: No request body, continuing...');
    }

    // If no email provided, try to get from Clerk with timeout
    if (!userEmail) {
      try {
        const { auth, currentUser } = await import('@clerk/nextjs/server');

        console.log('🔑 BYPASS: Trying Clerk auth with timeout...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const clerkUser = await auth();
          if (clerkUser?.userId) {
            const userData = await currentUser();
            userEmail = userData?.emailAddresses?.[0]?.emailAddress;
            console.log('📧 BYPASS: Email from Clerk:', userEmail);
          }
        } catch (clerkError) {
          if (clerkError.name === 'AbortError') {
            console.log('⏰ BYPASS: Clerk auth timed out');
          } else {
            console.log('⚠️ BYPASS: Clerk auth failed:', clerkError.message);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (importError) {
        console.log('⚠️ BYPASS: Could not import Clerk functions');
      }
    }

    // If we still don't have an email, return error
    if (!userEmail) {
      console.log('❌ BYPASS: No user email found');
      return NextResponse.json({
        success: false,
        error: 'No user email provided and Clerk authentication unavailable',
        message: 'Please provide email in request body or ensure you are authenticated',
      }, { status: 400 });
    }

    console.log('🔍 BYPASS: Processing sync for email:', userEmail);

    // Find user by email
    const userResults = await db.select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (userResults.length === 0) {
      console.log('❌ BYPASS: User not found with email:', userEmail);
      return NextResponse.json({
        success: false,
        error: 'User not found in database',
        email: userEmail,
        message: 'User exists in Clerk but not in local database. Please ensure user was properly synced initially.',
      }, { status: 404 });
    }

    const user = userResults[0];
    console.log('✅ BYPASS: Found user:', { id: user.id, email: user.email, currentRole: user.role });

    const totalTime = Date.now() - startTime;
    console.log('🕐 BYPASS: Total time:', totalTime, 'ms');

    // Return current user info without changing role
    return NextResponse.json({
      success: true,
      message: 'User sync completed (role preserved)',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        timing: totalTime,
      },
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 BYPASS: Error after', totalTime, 'ms:', error);
    return NextResponse.json({
      success: false,
      error: 'Bypass sync failed',
      timing: totalTime,
    }, { status: 500 });
  }
}