import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  enrollments,
  courses,
  courseProgress,
  findUserByClerkId,
} from '@/lib/db';
import { eq, desc, and, count, isNotNull, sql } from 'drizzle-orm';

// GET /api/admin/students/[studentId] - Get detailed info for a specific student
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database and is admin
    const user = await findUserByClerkId(userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { studentId } = await params;

    // Get student details with enrollment and progress data
    const studentData = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        clerkId: users.clerkId,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (studentData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    const student = studentData[0];

    // Get student's enrollments with course details
    const enrollmentsData = await db
      .select({
        enrollmentId: enrollments.id,
        enrollmentStatus: enrollments.status,
        enrolledAt: enrollments.enrolledAt,
        enrollmentProgress: enrollments.progress,
        courseId: courses.id,
        courseTitle: courses.title,
        courseDescription: courses.description,
        courseSubject: courses.subject,
        courseLevel: courses.level,
        courseStatus: courses.status,
        courseProgress: courseProgress.progress,
        lastAccessed: courseProgress.updatedAt,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(courseProgress, and(
        eq(enrollments.userId, courseProgress.userId),
        eq(enrollments.courseId, courseProgress.courseId)
      ))
      .where(eq(enrollments.userId, studentId))
      .orderBy(desc(enrollments.enrolledAt));

    // Transform enrollments data
    const transformedEnrollments = enrollmentsData.map(enrollment => ({
      id: enrollment.enrollmentId,
      course: {
        id: enrollment.courseId,
        title: enrollment.courseTitle,
        description: enrollment.courseDescription,
        subject: enrollment.courseSubject,
        level: enrollment.courseLevel,
        status: enrollment.courseStatus,
      },
      status: enrollment.enrollmentStatus,
      progress: Math.round(Number(enrollment.courseProgress) || Number(enrollment.enrollmentProgress) || 0),
      enrolledAt: enrollment.enrolledAt,
      lastAccessed: enrollment.lastAccessed,
    }));

    // Calculate overall stats
    const totalEnrollments = transformedEnrollments.length;
    const completedCourses = transformedEnrollments.filter(e => e.progress >= 100).length;
    const avgProgress = totalEnrollments > 0
      ? Math.round(transformedEnrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments)
      : 0;

    // Determine student status
    const lastAccessed = transformedEnrollments.length > 0
      ? Math.max(...transformedEnrollments.map(e => new Date(e.lastAccessed || e.enrolledAt).getTime()))
      : new Date(student.updatedAt).getTime();

    const daysSinceLastActive = Math.floor((Date.now() - lastAccessed) / (1000 * 60 * 60 * 24));

    let status: 'active' | 'inactive' | 'at-risk' = 'inactive';

    if (daysSinceLastActive <= 3 && avgProgress >= 50) {
      status = 'active';
    } else if (daysSinceLastActive <= 7 && avgProgress >= 25) {
      status = 'active';
    } else if (daysSinceLastActive >= 7 || avgProgress < 25) {
      status = 'at-risk';
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: student.name || 'Unknown User',
          email: student.email,
          clerkId: student.clerkId,
          grade: '10', // Default grade
          role: student.role,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
          stats: {
            totalEnrollments,
            completedCourses,
            avgProgress,
            lastActive: daysSinceLastActive === 0
              ? 'Today'
              : daysSinceLastActive === 1
                ? '1 day ago'
                : `${daysSinceLastActive} days ago`,
            status,
          }
        },
        enrollments: transformedEnrollments,
      }
    });

  } catch (error) {
    console.error('🔍 ADMIN STUDENT DETAIL: Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}