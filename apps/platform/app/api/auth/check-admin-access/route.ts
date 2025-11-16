import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db/queries';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  console.log('🧪 GET: Testing admin access');

  try {
    const startTime = Date.now();

    // Try to get user from Clerk first
    let clerkUserId = null;
    let userEmail = null;

    try {
      const clerkUser = await auth();
      if (clerkUser?.userId) {
        clerkUserId = clerkUser.userId;

        // Get user email from currentUser with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const userData = await currentUser();
          userEmail = userData?.emailAddresses?.[0]?.emailAddress;
        } catch (currentUserError) {
          if (currentUserError.name === 'AbortError') {
            console.log('⏰ currentUser() timed out, using email from auth if available');
          } else {
            console.log('⚠️ currentUser() failed:', currentUserError);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }
    } catch (clerkError) {
      console.log('⚠️ Clerk auth failed, trying bypass method');
    }

    // Check if user has admin role
    let isAdmin = false;
    let userInfo = null;

    if (userEmail && !clerkUserId) {
      // Lookup by email
      const userResults = await db.select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        role: users.role,
      })
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      if (userResults.length > 0) {
        userInfo = userResults[0];
        isAdmin = userInfo.role === 'admin';
      }
    } else if (clerkUserId) {
      // Lookup by clerkId
      const userResults = await db.select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        role: users.role,
      })
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1);

      if (userResults.length > 0) {
        userInfo = userResults[0];
        isAdmin = userInfo.role === 'admin';
      }
    }

    const totalTime = Date.now() - startTime;

    if (!userInfo) {
      console.log('❌ User not found for admin access test');
      return NextResponse.json({
        success: false,
        error: 'User not found',
        isAdmin: false,
        timing: totalTime,
      }, { status: 404 });
    }

    console.log('🔐 Admin access test result:', {
      user: userInfo.email,
      role: userInfo.role,
      isAdmin,
    });

    if (isAdmin) {
      return NextResponse.json({
        success: true,
        message: 'User has admin access',
        data: {
          user: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            role: userInfo.role,
          },
          isAdmin: true,
          timing: totalTime,
        },
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'User does not have admin access',
        data: {
          user: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            role: userInfo.role,
          },
          isAdmin: false,
          timing: totalTime,
        },
      }, { status: 403 });
    }

  } catch (error) {
    console.error('💥 Error checking admin access:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      isAdmin: false,
    }, { status: 500 });
  }
}