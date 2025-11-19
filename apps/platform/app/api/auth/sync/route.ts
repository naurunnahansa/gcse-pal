import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/queries';
import { getAuthenticatedUser, syncUserWithDatabase } from '@/lib/clerk-helper';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    console.log('🔐 Sync endpoint called');

    // Get authenticated user from Clerk
    const startTime = Date.now();
    const clerkUser = await getAuthenticatedUser();
    const clerkTime = Date.now();

    console.log('🕐 Clerk auth time:', clerkTime - startTime, 'ms');

    if (!clerkUser) {
      console.log('❌ No authenticated user found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', clerkUser.email);
    console.log('🔄 Starting database sync...');

    // Sync user with database using Clerk data
    const user = await syncUserWithDatabase(clerkUser.userId, clerkUser.clerkUserData);
    const dbTime = Date.now();

    console.log('🕐 DB sync time:', dbTime - clerkTime, 'ms');

    const totalTime = Date.now() - startTime;
    console.log('🕐 Total sync time:', totalTime, 'ms');

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        username: clerkUser.username,
        timing: {
          clerkAuth: clerkTime - startTime,
          dbSync: dbTime - clerkTime,
          total: totalTime,
        },
      },
    });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const clerkUser = await getAuthenticatedUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userResults = await db.select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.clerkId, clerkUser.userId))
      .limit(1);

    if (userResults.length === 0) {
      // User not in database yet, create them
      await syncUserWithDatabase(clerkUser.userId);

      // Get the user with settings
      const syncedUserResults = await db.select({
        id: users.id,
        clerkId: users.clerkId,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
        .from(users)
        .where(eq(users.clerkId, clerkUser.userId))
        .limit(1);

      if (syncedUserResults.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }

      const syncedUser = syncedUserResults[0];

      return NextResponse.json({
        success: true,
        data: {
          id: syncedUser.id,
          clerkId: syncedUser.clerkId,
          email: syncedUser.email,
          name: syncedUser.name,
          avatar: syncedUser.avatar,
          role: syncedUser.role,
          username: clerkUser.username,
          settings: null, // userSettings removed in simplified schema
        },
      });
    }

    const user = userResults[0];

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        username: clerkUser.username,
        settings: null, // userSettings removed in simplified schema
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}