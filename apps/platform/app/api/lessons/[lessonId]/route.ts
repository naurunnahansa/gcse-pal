import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get lesson with chapter and course details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.chapter.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Get user progress for this lesson
    const progress = await prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
    });

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
        id: lesson.chapter.id,
        title: lesson.chapter.title,
        course: {
          id: lesson.chapter.course.id,
          title: lesson.chapter.course.title,
        },
      },
      userProgress: progress ? {
        id: progress.id,
        status: progress.status,
        startedAt: progress.startedAt,
        completedAt: progress.completedAt,
        timeSpent: progress.timeSpent,
        score: progress.score,
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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get lesson to verify it exists and get course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: lesson.chapter.course.id,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Create or update progress
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: lesson.id,
        },
      },
      update: {
        status: status || 'in_progress',
        timeSpent: timeSpent || 0,
        score: score,
        startedAt: status === 'completed' ? progress?.startedAt : new Date(),
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