import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/courses/[id] - Fetch a specific course with full details
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

    const courseId = params.id;

    // Get course with full details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                order: true,
                isPublished: true,
                hasVideo: true,
                hasMarkdown: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is enrolled in this course
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    let enrollment = null;
    if (user) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });
    }

    // Get user progress for this course
    let progress = [];
    if (user) {
      progress = await prisma.progress.findMany({
        where: {
          userId: user.id,
          courseId: course.id,
        },
      });
    }

    // Format response
    const formattedCourse = {
      id: course.id,
      title: course.title,
      description: course.description,
      subject: course.subject,
      level: course.level,
      thumbnail: course.thumbnail,
      instructor: course.instructor,
      duration: course.duration,
      difficulty: course.difficulty,
      topics: course.topics,
      enrollmentCount: course._count.enrollments,
      rating: course.rating,
      price: course.price,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      chapters: course.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        duration: chapter.duration,
        order: chapter.order,
        isPublished: chapter.isPublished,
        lessons: chapter.lessons,
        lessonsCount: chapter.lessons.length,
        totalDuration: chapter.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      })),
      userEnrollment: enrollment ? {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status,
        completedAt: enrollment.completedAt,
      } : null,
      userProgress: progress,
    };

    return NextResponse.json({
      success: true,
      data: formattedCourse,
    });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses/[id]/enroll - Enroll user in a course
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

    const courseId = params.id;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (course.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Course is not available for enrollment' },
        { status: 400 }
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

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: 'active',
        progress: 0,
      },
    });

    // Increment course enrollment count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        progress: enrollment.progress,
      },
    });
  } catch (error) {
    console.error('Enroll course error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}