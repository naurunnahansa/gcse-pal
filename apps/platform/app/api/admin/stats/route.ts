import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  enrollments,
  chapters,
} from '@/lib/db/queries';
import { hasUserRole } from '@/lib/user-sync';
import { eq, and, gte, lte, count, sum, avg, desc, inArray } from 'drizzle-orm';

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
      activeCoursesData,
      courseStats,
    ] = await Promise.all([
      // Total students
      db.select({ count: count() })
        .from(users)
        .where(eq(users.role, 'student'))
        .then(result => result[0]?.count || 0),

      // Total courses (all statuses)
      db.select({ count: count() })
        .from(courses)
        .then(result => result[0]?.count || 0),

      // Published courses
      db.select({ count: count() })
        .from(courses)
        .where(eq(courses.status, 'published'))
        .then(result => result[0]?.count || 0),

      // Total enrollments
      db.select({ count: count() })
        .from(enrollments)
        .then(result => result[0]?.count || 0),

      // Recent enrollments (last 7 days)
      db.select({ count: count() })
        .from(enrollments)
        .where(gte(enrollments.enrolledAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)))
        .then(result => result[0]?.count || 0),

      // Active courses (courses with enrollments in last 30 days)
      db.select({ courseId: enrollments.courseId })
        .from(enrollments)
        .where(gte(enrollments.lastActivityAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
        .then(enrollments => new Set(enrollments.map(e => e.courseId)).size),

      // Course statistics
      db.select({
        id: courses.id,
        title: courses.title,
        description: courses.description,
        subject: courses.subject,
        status: courses.status,
        level: courses.level,
        thumbnailUrl: courses.thumbnailUrl,
        createdAt: courses.createdAt,
        publishedAt: courses.publishedAt,
      })
        .from(courses)
        .orderBy(desc(courses.createdAt))
        .limit(10),

      // User progress data
      db.select({ status: enrollments.status })
        .from(enrollments),
    ]);

    // Calculate additional metrics
    const totalStudents = await db.select({ count: count() })
      .from(users)
      .where(eq(users.role, 'student'))
      .then(result => result[0]?.count || 0);

    const totalTeachers = await db.select({ count: count() })
      .from(users)
      .where(eq(users.role, 'teacher'))
      .then(result => result[0]?.count || 0);

    const avgCompletionRateResult = await db.select({ average: avg(enrollments.progress) })
      .from(enrollments)
      .then(result => result[0]?.average || 0);

    // Get recent students with their enrollment data
    const recentStudentsData = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
      createdAt: users.createdAt,
    })
      .from(users)
      .where(eq(users.role, 'student'))
      .orderBy(desc(users.createdAt))
      .limit(10);

    // Get enrollment data for these students with null checks
    const formattedStudents = await Promise.all(
      (recentStudentsData || []).map(async (student) => {
        if (!student) return null;

        const studentEnrollments = await db.select({
          progress: enrollments.progress,
          enrolledAt: enrollments.enrolledAt,
          lastActivityAt: enrollments.lastActivityAt,
          courseTitle: courses.title,
        })
          .from(enrollments)
          .leftJoin(courses, eq(enrollments.courseId, courses.id))
          .where(eq(enrollments.userId, student.id))
          .orderBy(desc(enrollments.enrolledAt))
          .limit(1);

        const enrollment = studentEnrollments?.[0];
        return {
          id: student.id,
          name: student.name || 'Unknown Student',
          email: student.email || '',
          enrolled: studentEnrollments?.length || 0,
          progress: enrollment?.progress || 0,
          lastActive: enrollment?.lastActivityAt
            ? formatLastActive(enrollment.lastActivityAt)
            : 'Never'
        };
      })
    );

    const studentsData = formattedStudents.filter(Boolean); // Remove any null entries

    // Get chapter counts for courses
    const courseIds = courseStats.map(course => course.id);
    const chapterCounts = courseIds.length > 0
      ? await db.select({
          courseId: chapters.courseId,
          count: count(),
        })
        .from(chapters)
        .where(and(
          inArray(chapters.courseId, courseIds),
          eq(chapters.isPublished, true)
        ))
        .groupBy(chapters.courseId)
      : [];

    // Get enrollment counts for courses
    const enrollmentCounts = courseIds.length > 0
      ? await db.select({
          courseId: enrollments.courseId,
          count: count(),
        })
        .from(enrollments)
        .where(inArray(enrollments.courseId, courseIds))
        .groupBy(enrollments.courseId)
      : [];

    // Format course data with null checks
    const formattedCourses = (courseStats || []).map(course => {
      if (!course) return null;

      const chapterCount = chapterCounts?.find(cc => cc.courseId === course.id)?.count || 0;
      const enrollmentCount = enrollmentCounts?.find(ec => ec.courseId === course.id)?.count || 0;

      return {
        id: course.id,
        title: course.title || 'Untitled Course',
        description: course.description || '',
        subject: course.subject || 'Unknown',
        level: course.level || 'gcse',
        status: course.status || 'draft',
        students: enrollmentCount,
        avgScore: 0, // TODO: Calculate from quiz attempts
        completion: Math.round(Math.random() * 100), // TODO: Calculate actual completion rate
        author: 'Unknown', // TODO: Get from user relation
        createdAt: course.createdAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        duration: 0, // TODO: Calculate from chapters
        thumbnail: course.thumbnailUrl,
        chaptersCount: chapterCount
      };
    }).filter(Boolean); // Remove any null entries

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
        change: `+${activeCoursesData}`,
        icon: "BookOpen",
        color: "text-green-600"
      },
      {
        title: "Avg Completion",
        value: `${Math.round(Number(avgCompletionRateResult) || 0)}%`,
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

    // Ensure all data is properly structured and not null/undefined
    const responseData = {
      platformStats: platformStats || [],
      courses: formattedCourses || [],
      students: formattedStudents || [],
      summary: {
        totalUsers: totalUsers || 0,
        totalCourses: totalCourses || 0,
        publishedCourses: publishedCourses || 0,
        totalEnrollments: totalEnrollments || 0,
        activeCourses: activeCoursesData || 0,
        recentEnrollments: recentEnrollments || 0,
        avgCompletionRate: Math.round(Number(avgCompletionRateResult) || 0),
        totalStudyTime: 0
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
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