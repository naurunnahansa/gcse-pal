import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db/queries';
import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  console.log('🔍 GET: Getting current user role from database');

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

    // If we have email but no clerkId, use email to find user
    if (userEmail && !clerkUserId) {
      console.log('📧 Looking up user by email:', userEmail);
      const userResults = await db.select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      if (userResults.length > 0) {
        const user = userResults[0];
        const totalTime = Date.now() - startTime;
        console.log('✅ Found user by email, role:', user.role);

        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: user.id,
              clerkId: user.clerkId,
              email: user.email,
              name: user.name,
              role: user.role,
            },
            role: user.role,
            timing: totalTime,
            method: 'email_lookup'
          },
        });
      }
    }

    // If we have clerkId, use that
    if (clerkUserId) {
      console.log('👤 Looking up user by clerkId:', clerkUserId);
      const userResults = await db.select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1);

      if (userResults.length > 0) {
        const user = userResults[0];
        const totalTime = Date.now() - startTime;
        console.log('✅ Found user by clerkId, role:', user.role);

        return NextResponse.json({
          success: true,
          data: {
            user: {
              id: user.id,
              clerkId: user.clerkId,
              email: user.email,
              name: user.name,
              role: user.role,
            },
            role: user.role,
            timing: totalTime,
            method: 'clerk_id_lookup'
          },
        });
      }
    }

    // If we get here and still don't have user info, return error
    console.log('❌ Could not determine user identity');
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: false,
      error: 'Could not determine user identity',
      message: 'Neither Clerk authentication nor email lookup succeeded',
      timing: totalTime,
    }, { status: 401 });

  } catch (error) {
    console.error('💥 Error getting user role:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}