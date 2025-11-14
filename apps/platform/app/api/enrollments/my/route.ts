import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/enrollments/my - Get user's course enrollments with progress
export async function GET(req: NextRequest) {
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

    // Get user's enrollments with course details
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: {
            chapters: {
              select: {
                id: true,
                title: true,
                duration: true,
                order: true,
                lessons: {
                  select: { id: true },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    // Get progress for all user enrollments
    const progress = await prisma.progress.findMany({
      where: {
        userId: user.id,
        courseId: { in: enrollments.map(e => e.courseId) },
      },
    });

    // Calculate progress for each enrollment
    const formattedEnrollments = enrollments.map(enrollment => {
      const totalLessons = enrollment.course.chapters.reduce(
        (sum, chapter) => sum + chapter.lessons.length,
        0
      );
      const completedLessons = progress.filter(
        p => p.courseId === enrollment.courseId && p.status === 'completed' && p.lessonId
      ).length;
      const calculatedProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Update progress if it differs
      if (Math.abs(calculatedProgress - enrollment.progress) > 1) {
        prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { progress: calculatedProgress },
        }).catch(console.error);
      }

      return {
        id: enrollment.id,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          subject: enrollment.course.subject,
          level: enrollment.course.level,
          thumbnail: enrollment.course.thumbnail,
          instructor: enrollment.course.instructor,
          duration: enrollment.course.duration,
          difficulty: enrollment.course.difficulty,
          chaptersCount: enrollment.course.chapters.length,
          totalLessons: totalLessons,
        },
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        status: enrollment.status,
        progress: Math.round(calculatedProgress),
        lastAccessed: progress.length > 0
          ? new Date(Math.max(...progress.filter(p => p.courseId === enrollment.courseId).map(p => new Date(p.lastAccessed).getTime())))
          : enrollment.enrolledAt,
      };
    });

    // Calculate overall statistics
    const totalEnrollments = formattedEnrollments.length;
    const completedCourses = formattedEnrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = formattedEnrollments.filter(e => e.status === 'active').length;
    const averageProgress = totalEnrollments > 0
      ? formattedEnrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        enrollments: formattedEnrollments,
        statistics: {
          totalEnrollments,
          completedCourses,
          inProgressCourses,
          averageProgress: Math.round(averageProgress),
        },
      },
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}