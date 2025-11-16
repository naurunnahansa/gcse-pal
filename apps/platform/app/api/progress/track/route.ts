import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, lessonProgress, courseProgress, enrollments, courses, chapters, lessons } from '@/lib/db';
import { eq, and, isNull, not, desc, sql } from 'drizzle-orm';

// POST /api/progress/track - Track user progress for lessons/chapters
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const userRecords = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { lessonId, action, timeSpentSeconds, videoPositionSeconds } = body;

    if (!lessonId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: lessonId, action' },
        { status: 400 }
      );
    }

    // Validate action types
    const validActions = ['start', 'complete', 'update'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // First find the enrollment for this user
    const enrollment = await db.select()
      .from(enrollments)
      .where(eq(enrollments.userId, user.id))
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User has no enrollments' },
        { status: 400 }
      );
    }

    const enrollmentId = enrollment[0].id;
    const courseId = enrollment[0].courseId;

    let result;
    const now = new Date();

    switch (action) {
      case 'start':
      case 'update':
        // Update lesson progress
        result = await db.update(lessonProgress)
          .set({
            status: 'in_progress',
            timeSpentSeconds: timeSpentSeconds || 0,
            videoPositionSeconds: videoPositionSeconds || 0,
            startedAt: action === 'start' ? now : undefined,
            updatedAt: now,
          })
          .where(and(
            eq(lessonProgress.enrollmentId, enrollmentId),
            eq(lessonProgress.lessonId, lessonId)
          ))
          .returning();
        break;

      case 'complete':
        // Mark lesson as completed
        result = await db.update(lessonProgress)
          .set({
            status: 'completed',
            timeSpentSeconds: timeSpentSeconds || 0,
            videoPositionSeconds: videoPositionSeconds || 0,
            completedAt: now,
            updatedAt: now,
          })
          .where(and(
            eq(lessonProgress.enrollmentId, enrollmentId),
            eq(lessonProgress.lessonId, lessonId)
          ))
          .returning();
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Progress tracked successfully`,
        action,
        lessonId,
        courseId,
      },
    });
  } catch (error) {
    console.error('Track progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/progress/track - Get progress for specific lesson
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get('lessonId');

    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Missing lessonId parameter' },
        { status: 400 }
      );
    }

    // Get user from database
    const userRecords = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const user = userRecords[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get enrollment for this user
    const enrollment = await db.select()
      .from(enrollments)
      .where(eq(enrollments.userId, user.id))
      .limit(1);

    if (enrollment.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User has no enrollments' },
        { status: 404 }
      );
    }

    // Get lesson progress
    const progressRecords = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.enrollmentId, enrollment[0].id),
        eq(lessonProgress.lessonId, lessonId)
      ))
      .orderBy(desc(lessonProgress.updatedAt));

    return NextResponse.json({
      success: true,
      data: progressRecords,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}