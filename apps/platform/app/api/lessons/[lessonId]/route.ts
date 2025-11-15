import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  lessons,
  enrollments,
  progress,
  findUserByClerkId,
  findEnrollment,
  findLessonById
} from '@/lib/db/queries';
import { eq, and } from 'drizzle-orm';
import { drizzleCount as count } from 'drizzle-orm';

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
      .from(progress)
      .where(and(
        eq(progress.userId, user.id),
        eq(progress.lessonId, lesson.id)
      ))
      .limit(1);

    const lessonProgress = progressResult[0] || null;

    // Format response
    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      videoDuration: lesson.videoDuration,
      markdownPath: lesson.markdownPath,
      duration: lesson.duration,
      order: lesson.order,
      isPublished: lesson.isPublished,
      hasVideo: lesson.hasVideo,
      hasMarkdown: lesson.hasMarkdown,
      chapter: {
        id: chapter.id,
        title: chapter.title,
        course: {
          id: course.id,
          title: course.title,
        },
      },
      userProgress: lessonProgress ? {
        id: lessonProgress.id,
        status: lessonProgress.status,
        startedAt: lessonProgress.startedAt,
        completedAt: lessonProgress.completedAt,
        timeSpent: lessonProgress.timeSpent,
        score: lessonProgress.score,
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
    const { status, timeSpent, score } = body;

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
      .from(progress)
      .where(and(
        eq(progress.userId, user.id),
        eq(progress.lessonId, lesson.id)
      ))
      .limit(1);

    const existingProgress = existingProgressResult[0] || null;

    // Create or update progress
    const progress = await prisma.progress.upsert({
      where: {
        id: existingProgress?.id || '',
      },
      update: {
        status: status || 'in_progress',
        timeSpent: timeSpent || 0,
        score: score,
        startedAt: status === 'completed' && !existingProgress?.startedAt ? new Date() : existingProgress?.startedAt,
        completedAt: status === 'completed' ? new Date() : null,
        lastAccessed: new Date(),
      },
      create: {
        userId: user.id,
        courseId: lesson.chapter.course.id,
        chapterId: lesson.chapter.id,
        lessonId: lesson.id,
        status: status || 'in_progress',
        timeSpent: timeSpent || 0,
        score: score,
        startedAt: new Date(),
        lastAccessed: new Date(),
      },
    });

    // If lesson is completed, update course progress
    if (status === 'completed') {
      const totalLessons = await prisma.lesson.count({
        where: { chapterId: lesson.chapter.id },
      });

      const completedLessons = await prisma.progress.count({
        where: {
          userId: user.id,
          chapterId: lesson.chapter.id,
          status: 'completed',
        },
      });

      const chapterProgress = Math.round((completedLessons / totalLessons) * 100);

      // Update enrollment progress
      const totalCourseLessons = await prisma.lesson.count({
        where: {
          chapter: {
            courseId: lesson.chapter.course.id,
          },
        },
      });

      const totalCourseCompletedLessons = await prisma.progress.count({
        where: {
          userId: user.id,
          courseId: lesson.chapter.course.id,
          status: 'completed',
        },
      });

      const courseProgress = Math.round((totalCourseCompletedLessons / totalCourseLessons) * 100);

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          progress: courseProgress,
          status: courseProgress === 100 ? 'completed' : 'active',
          completedAt: courseProgress === 100 ? new Date() : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: progress.id,
        status: progress.status,
        timeSpent: progress.timeSpent,
        score: progress.score,
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