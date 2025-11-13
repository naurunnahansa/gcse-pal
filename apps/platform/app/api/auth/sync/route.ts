import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser, syncUserWithDatabase } from '@/lib/clerk-helper';

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
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.userId },
      include: {
        userSettings: true,
      },
    });

    if (!user) {
      // User not in database yet, create them
      const syncedUser = await syncUserWithDatabase(clerkUser.userId);

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
          settings: syncedUser.userSettings ? {
            theme: syncedUser.userSettings.theme,
            emailNotifications: syncedUser.userSettings.emailNotifications,
            pushNotifications: syncedUser.userSettings.pushNotifications,
            studyReminders: syncedUser.userSettings.studyReminders,
            deadlineReminders: syncedUser.userSettings.deadlineReminders,
            dailyGoal: syncedUser.userSettings.dailyGoal,
            preferredStudyTime: syncedUser.userSettings.preferredStudyTime,
            studyDays: syncedUser.userSettings.studyDays,
          } : null,
        },
      });
    }

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
        settings: user.userSettings ? {
          theme: user.userSettings.theme,
          emailNotifications: user.userSettings.emailNotifications,
          pushNotifications: user.userSettings.pushNotifications,
          studyReminders: user.userSettings.studyReminders,
          deadlineReminders: user.userSettings.deadlineReminders,
          dailyGoal: user.userSettings.dailyGoal,
          preferredStudyTime: user.userSettings.preferredStudyTime,
          studyDays: user.userSettings.studyDays,
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