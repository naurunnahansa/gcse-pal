import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, progress, enrollments, courses, chapters, lessons, activityLog, activityTypeEnumNew } from '@/lib/db';
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
    const { courseId, chapterId, lessonId, action, duration, data } = body;

    if (!courseId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: courseId, action' },
        { status: 400 }
      );
    }

    // Validate action types
    const validActions = ['start', 'complete', 'pause', 'resume', 'update_progress'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    let progress;
    const now = new Date();

    switch (action) {
      case 'start':
        // Start or resume progress - check if it exists first
        const existingProgress = await db.select()
          .from(progress)
          .where(and(
            eq(progress.userId, user.id),
            eq(progress.courseId, courseId),
            chapterId ? eq(progress.chapterId, chapterId) : isNull(progress.chapterId),
            lessonId ? eq(progress.lessonId, lessonId) : isNull(progress.lessonId)
          ))
          .limit(1);

        if (existingProgress.length > 0) {
          // Update existing progress
          progress = await db.update(progress)
            .set({
              status: 'in_progress',
              startedAt: now,
              lastAccessed: now,
              timeSpent: existingProgress[0].timeSpent + (duration || 0),
            })
            .where(eq(progress.id, existingProgress[0].id))
            .returning();
          progress = progress[0];
        } else {
          // Create new progress
          const result = await db.insert(progress).values({
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
            status: 'in_progress',
            startedAt: now,
            lastAccessed: now,
            timeSpent: duration || 0,
          }).returning();
          progress = result[0];
        }
        break;

      case 'complete':
        // Mark progress as completed
        const existingCompleteProgress = await db.select()
          .from(progress)
          .where(and(
            eq(progress.userId, user.id),
            eq(progress.courseId, courseId),
            chapterId ? eq(progress.chapterId, chapterId) : isNull(progress.chapterId),
            lessonId ? eq(progress.lessonId, lessonId) : isNull(progress.lessonId)
          ))
          .limit(1);

        if (existingCompleteProgress.length > 0) {
          // Update existing progress
          progress = await db.update(progress)
            .set({
              status: 'completed',
              completedAt: now,
              lastAccessed: now,
              timeSpent: existingCompleteProgress[0].timeSpent + (duration || 0),
              score: data?.score || null,
            })
            .where(eq(progress.id, existingCompleteProgress[0].id))
            .returning();
          progress = progress[0];
        } else {
          // Create new progress
          const result = await db.insert(progress).values({
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
            status: 'completed',
            startedAt: data?.startedAt || now,
            completedAt: now,
            lastAccessed: now,
            timeSpent: duration || 0,
            score: data?.score || null,
          }).returning();
          progress = result[0];
        }

        // Update course enrollment progress
        await updateCourseProgress(user.id, courseId);
        break;

      case 'pause':
        // Pause progress (just update time spent)
        await db.update(progress)
          .set({
            timeSpent: sql`${progress.timeSpent} + ${duration || 0}`,
            lastAccessed: now,
          })
          .where(and(
            eq(progress.userId, user.id),
            eq(progress.courseId, courseId),
            chapterId ? eq(progress.chapterId, chapterId) : isNull(progress.chapterId),
            lessonId ? eq(progress.lessonId, lessonId) : isNull(progress.lessonId)
          ));
        break;

      case 'resume':
        // Resume progress
        await db.update(progress)
          .set({
            status: 'in_progress',
            lastAccessed: now,
          })
          .where(and(
            eq(progress.userId, user.id),
            eq(progress.courseId, courseId),
            chapterId ? eq(progress.chapterId, chapterId) : isNull(progress.chapterId),
            lessonId ? eq(progress.lessonId, lessonId) : isNull(progress.lessonId)
          ));
        break;

      case 'update_progress':
        // Update progress with additional data
        await db.update(progress)
          .set({
            timeSpent: sql`${progress.timeSpent} + ${duration || 0}`,
            lastAccessed: now,
            score: data?.score,
          })
          .where(and(
            eq(progress.userId, user.id),
            eq(progress.courseId, courseId),
            chapterId ? eq(progress.chapterId, chapterId) : isNull(progress.chapterId),
            lessonId ? eq(progress.lessonId, lessonId) : isNull(progress.lessonId)
          ));
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported action' },
          { status: 400 }
        );
    }

    // Create activity log entry if duration is provided
    if (duration && duration > 0) {
      await db.insert(activityLog).values({
        userId: user.id,
        courseId,
        lessonId,
        activityType: 'lesson_view', // Using consolidated activity type
        duration,
        data: data || {},
        startedAt: new Date(now.getTime() - duration * 60000), // Approximate start time
        endedAt: action === 'complete' ? now : null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: `Progress tracked successfully`,
        action,
        courseId,
        chapterId,
        lessonId,
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

// Helper function to update course progress
async function updateCourseProgress(userId: string, courseId: string) {
  try {
    // Get all lessons for the course
    const courseRecords = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    const course = courseRecords[0];

    if (!course) return;

    // Get all chapters for the course
    const chapterRecords = await db.select()
      .from(chapters)
      .where(eq(chapters.courseId, courseId));

    if (chapterRecords.length === 0) return;

    // Get all lessons for all chapters - using a simpler approach
    const chapterIds = chapterRecords.map(chapter => chapter.id);
    let lessonRecords = [];

    for (const chapterId of chapterIds) {
      const chapterLessons = await db.select()
        .from(lessons)
        .where(eq(lessons.chapterId, chapterId));
      lessonRecords.push(...chapterLessons);
    }

    const totalLessons = lessonRecords.length;

    if (totalLessons === 0) return;

    // Get completed lessons for this user
    const completedProgress = await db.select()
      .from(progress)
      .where(and(
        eq(progress.userId, userId),
        eq(progress.courseId, courseId),
        eq(progress.status, 'completed'),
        not(isNull(progress.lessonId))
      ));

    const completedLessons = completedProgress.length;

    const progressPercentage = (completedLessons / totalLessons) * 100;

    // Update enrollment
    await db.update(enrollments)
      .set({
        progress: progressPercentage,
        status: progressPercentage >= 100 ? 'completed' : 'active',
        completedAt: progressPercentage >= 100 ? new Date() : undefined,
      })
      .where(and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      ));
  } catch (error) {
    console.error('Update course progress error:', error);
  }
}

// GET /api/progress/track - Get progress for specific course/lesson/chapter
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
    const courseId = searchParams.get('courseId');
    const chapterId = searchParams.get('chapterId');
    const lessonId = searchParams.get('lessonId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing courseId parameter' },
        { status: 400 }
      );
    }

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

    // Build query conditions
    let whereConditions = [
      eq(progress.userId, user.id),
      eq(progress.courseId, courseId)
    ];

    if (chapterId) {
      whereConditions.push(eq(progress.chapterId, chapterId));
    } else {
      whereConditions.push(isNull(progress.chapterId));
    }

    if (lessonId) {
      whereConditions.push(eq(progress.lessonId, lessonId));
    } else {
      whereConditions.push(isNull(progress.lessonId));
    }

    const progressRecords = await db.select()
      .from(progress)
      .where(and(...whereConditions))
      .orderBy(desc(progress.lastAccessed));

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