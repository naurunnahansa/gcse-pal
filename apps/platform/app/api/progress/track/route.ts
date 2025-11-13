import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

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
        // Start or resume progress
        progress = await prisma.progress.upsert({
          where: {
            userId_courseId_chapterId_lessonId: {
              userId: user.id,
              courseId,
              chapterId: chapterId || null,
              lessonId: lessonId || null,
            },
          },
          update: {
            status: 'in_progress',
            startedAt: now,
            lastAccessedAt: now,
            timeSpent: {
              increment: duration || 0,
            },
          },
          create: {
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
            status: 'in_progress',
            startedAt: now,
            lastAccessedAt: now,
            timeSpent: duration || 0,
          },
        });
        break;

      case 'complete':
        // Mark progress as completed
        progress = await prisma.progress.upsert({
          where: {
            userId_courseId_chapterId_lessonId: {
              userId: user.id,
              courseId,
              chapterId: chapterId || null,
              lessonId: lessonId || null,
            },
          },
          update: {
            status: 'completed',
            completedAt: now,
            lastAccessedAt: now,
            timeSpent: {
              increment: duration || 0,
            },
            score: data?.score || null,
          },
          create: {
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
            status: 'completed',
            startedAt: data?.startedAt || now,
            completedAt: now,
            lastAccessedAt: now,
            timeSpent: duration || 0,
            score: data?.score || null,
          },
        });

        // Update course enrollment progress
        await updateCourseProgress(user.id, courseId);
        break;

      case 'pause':
        // Pause progress (just update time spent)
        progress = await prisma.progress.updateMany({
          where: {
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
          },
          data: {
            timeSpent: {
              increment: duration || 0,
            },
            lastAccessedAt: now,
          },
        });
        break;

      case 'resume':
        // Resume progress
        progress = await prisma.progress.updateMany({
          where: {
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
          },
          data: {
            status: 'in_progress',
            lastAccessedAt: now,
          },
        });
        break;

      case 'update_progress':
        // Update progress with additional data
        progress = await prisma.progress.updateMany({
          where: {
            userId: user.id,
            courseId,
            chapterId,
            lessonId,
          },
          data: {
            timeSpent: {
              increment: duration || 0,
            },
            lastAccessedAt: now,
            score: data?.score,
          },
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported action' },
          { status: 400 }
        );
    }

    // Create or update study session if duration is provided
    if (duration && duration > 0) {
      const session = await prisma.studySession.findFirst({
        where: {
          userId: user.id,
          courseId,
          lessonId,
          endTime: null,
        },
        orderBy: { startTime: 'desc' },
      });

      if (session) {
        // Update existing session
        await prisma.studySession.update({
          where: { id: session.id },
          data: {
            duration: session.duration + duration,
            endTime: action === 'complete' ? now : null,
          },
        });

        // Add study activity
        await prisma.studyActivity.create({
          data: {
            sessionId: session.id,
            type: data?.activityType || 'watch_video',
            resourceId: lessonId || courseId,
            startTime: new Date(now.getTime() - duration * 60000), // Approximate start time
            endTime: now,
            duration,
            data: data || {},
          },
        });
      } else {
        // Create new session
        const newSession = await prisma.studySession.create({
          data: {
            userId: user.id,
            courseId,
            lessonId,
            startTime: new Date(now.getTime() - duration * 60000),
            duration,
            endTime: action === 'complete' ? now : null,
          },
        });

        // Add study activity
        await prisma.studyActivity.create({
          data: {
            sessionId: newSession.id,
            type: data?.activityType || 'watch_video',
            resourceId: lessonId || courseId,
            startTime: newSession.startTime,
            endTime: now,
            duration,
            data: data || {},
          },
        });
      }
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
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            lessons: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!course) return;

    const totalLessons = course.chapters.reduce(
      (sum, chapter) => sum + chapter.lessons.length,
      0
    );

    if (totalLessons === 0) return;

    // Get completed lessons for this user
    const completedLessons = await prisma.progress.count({
      where: {
        userId,
        courseId,
        status: 'completed',
        lessonId: { not: null },
      },
    });

    const progressPercentage = (completedLessons / totalLessons) * 100;

    // Update enrollment
    await prisma.enrollment.updateMany({
      where: {
        userId,
        courseId,
      },
      data: {
        progress: progressPercentage,
        status: progressPercentage >= 100 ? 'completed' : 'active',
        completedAt: progressPercentage >= 100 ? new Date() : undefined,
      },
    });
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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Build query conditions
    const where: any = {
      userId: user.id,
      courseId,
    };

    if (chapterId) where.chapterId = chapterId;
    if (lessonId) where.lessonId = lessonId;

    const progress = await prisma.progress.findMany({
      where,
      orderBy: { lastAccessedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}