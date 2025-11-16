import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  lessons,
  enrollments,
  lessonProgress,
  findUserByClerkId,
  findEnrollment,
  findLessonById
} from '@/lib/db';
import { eq, and, count } from 'drizzle-orm';

// GET /api/lessons/[lessonId] - Fetch a specific lesson with details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lessonId } = await params;

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get lesson
    const lesson = await findLessonById(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Get chapter and course info
    const chapterResult = await db.select({
      id: chapters.id,
      title: chapters.title,
      courseId: chapters.courseId,
    })
      .from(chapters)
      .where(eq(chapters.id, lesson.chapterId))
      .limit(1);

    if (chapterResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const chapter = chapterResult[0];

    // Get course info
    const courseResult = await db.select({
      id: courses.id,
      title: courses.title,
    })
      .from(courses)
      .where(eq(courses.id, chapter.courseId))
      .limit(1);

    if (courseResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = courseResult[0];

    // Check if user is enrolled in the course
    const enrollment = await findEnrollment(user.id, course.id);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get user progress for this lesson
    const progressResult = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, user.id),
        eq(lessonProgress.lessonId, lesson.id)
      ))
      .limit(1);

    const lessonProgressData = progressResult[0] || null;

    // Format response
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      markdownContent: lesson.markdownContent,
      videoUrl: lesson.videoUrl,
      videoDurationSeconds: lesson.videoDurationSeconds,
      duration: lesson.duration,
      position: lesson.position,
      isPublished: lesson.isPublished,
      isPreview: lesson.isPreview,
      contentType: lesson.contentType,
      // Mux video integration fields
      muxAssetId: lesson.muxAssetId,
      muxPlaybackId: lesson.muxPlaybackId,
      muxUploadId: lesson.muxUploadId,
      muxStatus: lesson.muxStatus,
      chapter: {
        id: chapter.id,
        title: chapter.title,
        course: {
          id: course.id,
          title: course.title,
        },
      },
      userProgress: lessonProgressData ? {
        id: lessonProgressData.id,
        status: lessonProgressData.status,
        startedAt: lessonProgressData.startedAt,
        completedAt: lessonProgressData.completedAt,
        timeSpentSeconds: lessonProgressData.timeSpentSeconds,
        videoPositionSeconds: lessonProgressData.videoPositionSeconds,
      } : null,
    };

    return NextResponse.json({
      success: true,
      data: formattedLesson,
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/lessons/[lessonId]/progress - Update lesson progress
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { lessonId } = await params;
    const body = await req.json();
    const { status, timeSpentSeconds, videoPositionSeconds } = body;

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get lesson to verify it exists
    const lesson = await findLessonById(lessonId);

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Get chapter info
    const chapterResult = await db.select({
      id: chapters.id,
      courseId: chapters.courseId,
    })
      .from(chapters)
      .where(eq(chapters.id, lesson.chapterId))
      .limit(1);

    if (chapterResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      );
    }

    const chapter = chapterResult[0];

    // Check if user is enrolled in the course
    const enrollment = await findEnrollment(user.id, chapter.courseId);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Check if progress record already exists
    const existingProgressResult = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, user.id),
        eq(lessonProgress.lessonId, lesson.id)
      ))
      .limit(1);

    const existingProgress = existingProgressResult[0] || null;

    // Create or update progress using simplified logic
    let progressResult;
    if (existingProgress) {
      // Update existing progress
      const updateResult = await db.update(lessonProgress)
        .set({
          status: status || 'in_progress',
          timeSpentSeconds: timeSpentSeconds || 0,
          videoPositionSeconds: videoPositionSeconds || 0,
          startedAt: status === 'completed' && !existingProgress?.startedAt ? new Date() : existingProgress?.startedAt,
          completedAt: status === 'completed' ? new Date() : null,
        })
        .where(eq(lessonProgress.id, existingProgress.id))
        .returning();
      progressResult = updateResult[0];
    } else {
      // Create new progress
      const insertResult = await db.insert(lessonProgress)
        .values({
          userId: user.id,
          courseId: chapter.courseId,
          lessonId: lesson.id,
          status: status || 'in_progress',
          timeSpentSeconds: timeSpentSeconds || 0,
          videoPositionSeconds: videoPositionSeconds || 0,
          startedAt: new Date(),
        })
        .returning();
      progressResult = insertResult[0];
    }

    // Note: Course progress updates are now handled by separate progress tracking endpoints
    // This keeps the lesson API focused on lesson-specific progress

    return NextResponse.json({
      success: true,
      data: {
        id: progressResult.id,
        status: progressResult.status,
        timeSpentSeconds: progressResult.timeSpentSeconds,
        videoPositionSeconds: progressResult.videoPositionSeconds,
      },
    });
  } catch (error) {
    console.error('Update lesson progress error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}