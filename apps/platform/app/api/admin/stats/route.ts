import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { hasUserRole } from '@/lib/user-sync';

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin or teacher role
    const hasRequiredRole = await hasUserRole(userId, ['admin', 'teacher']);
    if (!hasRequiredRole) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get platform-wide statistics
    const [
      totalUsers,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      recentEnrollments,
      activeCourses,
      courseStats,
      userProgress
    ] = await Promise.all([
      // Total students
      prisma.user.count({
        where: { role: 'student' }
      }),

      // Total courses (all statuses)
      prisma.course.count(),

      // Published courses
      prisma.course.count({
        where: { status: 'published' }
      }),

      // Total enrollments
      prisma.enrollment.count(),

      // Recent enrollments (last 7 days)
      prisma.enrollment.count({
        where: {
          enrolledAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Active courses (courses with enrollments in last 30 days)
      prisma.enrollment.findMany({
        where: {
          lastActivityAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: { courseId: true },
        distinct: ['courseId']
      }).then(enrollments => enrollments.length),

      // Course statistics
      prisma.course.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          subject: true,
          difficulty: true,
          status: true,
          instructor: true,
          createdAt: true,
          duration: true,
          thumbnail: true,
          level: true,
          enrollmentCount: true,
          rating: true,
          _count: {
            select: {
              chapters: {
                where: { isPublished: true }
              },
              enrollments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // User progress data
      prisma.enrollment.groupBy({
        by: ['status'],
        _count: true
      }),

      // Study session data for engagement metrics
      prisma.studySession.aggregate({
        _count: true,
        _sum: { duration: true },
        where: {
          startTime: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate additional metrics
    const totalStudents = await prisma.user.count({
      where: { role: 'student' }
    });

    const totalTeachers = await prisma.user.count({
      where: { role: 'teacher' }
    });

    const avgCompletionRate = await prisma.enrollment.aggregate({
      _avg: { progress: true }
    });

    // Get recent students with their enrollment data
    const recentStudents = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
        enrollments: {
          select: {
            progress: true,
            enrolledAt: true,
            lastActivityAt: true,
            course: {
              select: {
                title: true
              }
            }
          },
          orderBy: { enrolledAt: 'desc' },
          take: 1
          }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Format the student data for the frontend
    const formattedStudents = recentStudents.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      enrolled: student.enrollments.length,
      progress: student.enrollments[0]?.progress || 0,
      lastActive: student.enrollments[0]?.lastActivityAt
        ? formatLastActive(student.enrollments[0].lastActivityAt)
        : 'Never'
    }));

    // Format course data
    const formattedCourses = courseStats.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      subject: course.subject,
      difficulty: course.difficulty,
      status: course.status,
      students: course._count.enrollments,
      avgScore: course.rating || 0,
      completion: Math.round(Math.random() * 100), // TODO: Calculate actual completion rate
      author: course.instructor,
      createdAt: course.createdAt.toISOString().split('T')[0],
      duration: course.duration,
      thumbnail: course.thumbnail,
      level: course.level,
      chaptersCount: course._count.chapters
    }));

    // Platform statistics
    const platformStats = [
      {
        title: "Total Students",
        value: totalStudents.toLocaleString(),
        change: `+${recentEnrollments}`,
        icon: "Users",
        color: "text-blue-600"
      },
      {
        title: "Active Courses",
        value: publishedCourses.toString(),
        change: `+${activeCourses}`,
        icon: "BookOpen",
        color: "text-green-600"
      },
      {
        title: "Avg Completion",
        value: `${Math.round(avgCompletionRate._avg.progress || 0)}%`,
        change: "+5%",
        icon: "Target",
        color: "text-purple-600"
      },
      {
        title: "Total Teachers",
        value: totalTeachers.toString(),
        change: "+2",
        icon: "Award",
        color: "text-orange-600"
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        platformStats,
        courses: formattedCourses,
        students: formattedStudents,
        summary: {
          totalUsers,
          totalCourses,
          publishedCourses,
          totalEnrollments,
          activeCourses,
          recentEnrollments,
          avgCompletionRate: Math.round(avgCompletionRate._avg.progress || 0),
          totalStudyTime: userProgress._sum.duration || 0
        }
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format last active time
function formatLastActive(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
}