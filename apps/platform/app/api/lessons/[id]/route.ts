import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/lessons/[id] - Get specific lesson details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lessonId = params.id;

    // Get lesson with full details
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                subject: true,
              },
            },
          },
        },
        _count: {
          select: {
            progress: {
              where: {
                status: 'completed',
              },
            },
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

    // Check if user has access to this course (is enrolled)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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

    // Get user's progress for this lesson
    const userProgress = await prisma.progress.findUnique({
      where: {
        userId_courseId_chapterId_lessonId: {
          userId: user.id,
          courseId: lesson.chapter.course.id,
          chapterId: lesson.chapter.id,
          lessonId: lesson.id,
        },
      },
    });

    // Get next and previous lessons
    const allLessons = await prisma.lesson.findMany({
      where: {
        chapterId: lesson.chapterId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    const currentLessonIndex = allLessons.findIndex(l => l.id === lesson.id);
    const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

    // Get related lessons in other chapters
    const currentChapterLessons = await prisma.lesson.findMany({
      where: {
        chapterId: lesson.chapterId,
        order: {
          lt: lesson.order,
        },
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        order: true,
        duration: true,
      },
      orderBy: { order: 'desc' },
      take: 3,
    });

    // Load markdown content if it exists
    let markdownContent = null;
    if (lesson.hasMarkdown && lesson.markdownPath) {
      try {
        // This would load from your file system or content management system
        // For now, we'll include the path reference
        markdownContent = lesson.markdownPath;
      } catch (error) {
        console.error('Error loading markdown content:', error);
      }
    }

    const formattedLesson = {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      videoDuration: lesson.videoDuration,
      markdownContent,
      hasVideo: lesson.hasVideo,
      hasMarkdown: lesson.hasMarkdown,
      duration: lesson.duration,
      order: lesson.order,
      isPublished: lesson.isPublished,
      chapter: {
        id: lesson.chapter.id,
        title: lesson.chapter.title,
        order: lesson.chapter.order,
        course: lesson.chapter.course,
      },
      userProgress: userProgress ? {
        status: userProgress.status,
        startedAt: userProgress.startedAt,
        completedAt: userProgress.completedAt,
        timeSpent: userProgress.timeSpent,
        score: userProgress.score,
        lastAccessedAt: userProgress.lastAccessedAt,
      } : null,
      navigation: {
        previous: previousLesson,
        next: nextLesson,
        related: currentChapterLessons,
      },
      completionCount: lesson._count.progress?.completed || 0,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
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

// POST /api/lessons/[id]/content - Update lesson content (admin/teacher only)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lessonId = params.id;
    const body = await req.json();
    const { content, videoUrl, markdownPath, isPublished } = body;

    // Check if user is admin or teacher
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or teacher access required' },
        { status: 403 }
      );
    }

    // Check if lesson exists and user has permission to edit it
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        chapter: {
          include: {
            course: {
              select: {
                instructorId: true,
              },
            },
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

    // Check if user is the course instructor or admin
    if (user.role !== 'admin' && lesson.chapter.course.instructorId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Only course instructor or admin can edit lessons' },
        { status: 403 }
      );
    }

    // Update lesson
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl;
      updateData.hasVideo = !!videoUrl;
      updateData.videoDuration = body.videoDuration || null;
    }
    if (markdownPath !== undefined) {
      updateData.markdownPath = markdownPath;
      updateData.hasMarkdown = !!markdownPath;
    }
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedLesson,
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}