import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users, userSettings } from '@/lib/db/queries';
import { getAuthenticatedUser, syncUserWithDatabase } from '@/lib/clerk-helper';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user from Clerk
    const clerkUser = await getAuthenticatedUser();
    if (!clerkUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Sync user with database using Clerk data
    const user = await syncUserWithDatabase(clerkUser.userId);

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

      // Get user settings
      const settingsResults = await db.select()
        .from(userSettings)
        .where(eq(userSettings.userId, syncedUser.id))
        .limit(1);

      const settings = settingsResults[0];

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
          settings: settings ? {
            theme: settings.theme,
            emailNotifications: settings.emailNotifications,
            pushNotifications: settings.pushNotifications,
            studyReminders: settings.studyReminders,
            deadlineReminders: settings.deadlineReminders,
            dailyGoal: settings.dailyGoal,
            preferredStudyTime: settings.preferredStudyTime,
            studyDays: settings.studyDays,
          } : null,
        },
      });
    }

    const user = userResults[0];

    // Get user settings
    const settingsResults = await db.select()
      .from(userSettings)
      .where(eq(userSettings.userId, user.id))
      .limit(1);

    const settings = settingsResults[0];

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
        settings: settings ? {
          theme: settings.theme,
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          studyReminders: settings.studyReminders,
          deadlineReminders: settings.deadlineReminders,
          dailyGoal: settings.dailyGoal,
          preferredStudyTime: settings.preferredStudyTime,
          studyDays: settings.studyDays,
        } : null,
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