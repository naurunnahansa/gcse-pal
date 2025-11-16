import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  enrollments,
  courses,
  courseProgress,
  findEnrollmentsByUserId,
} from '@/lib/db';
import { eq, and, desc, gte, lte, count, isNotNull, sql } from 'drizzle-orm';
import { ensureUserExists } from '@/lib/clerk-helper';

// GET /api/admin/students - Get all students with their enrollment and progress data
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database and get admin user
    const user = await ensureUserExists(userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🔍 ADMIN STUDENTS: Fetching students with filters:', {
      grade, status, search, page, limit
    });

    // Build base query
    let query = db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        clerkId: users.clerkId,
        // Count enrollments
        enrollmentCount: count(enrollments.id).as('enrollment_count'),
        // Count completed courses (where progress >= 100)
        completedCourses: count(
          sql`${courseProgress.id}`
        ).filter(and(
          isNotNull(courseProgress.id),
          gte(courseProgress.progress, 100)
        )).as('completed_courses'),
        // Average progress
        avgProgress: sql`COALESCE(AVG(${courseProgress.progress}), 0)`.as('avg_progress'),
        // Total study time (we'll need to add this field later)
        totalStudyTime: sql`0`.as('total_study_time'),
        // Last active timestamp
        lastActive: sql`MAX(${enrollments.updatedAt})`.as('last_active'),
      })
      .from(users)
      .leftJoin(enrollments, eq(users.id, enrollments.userId))
      .leftJoin(courseProgress, eq(enrollments.userId, courseProgress.userId))
      .groupBy(users.id, users.name, users.email, users.role, users.createdAt, users.updatedAt, users.clerkId)
      .orderBy(desc(users.createdAt));

    // Apply filters
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(${users.name} ILIKE ${'%' + search + '%'} OR ${users.email} ILIKE ${'%' + search + '%'})`
      );
    }

    if (grade && grade !== 'all') {
      // We'll need to add grade field to users table or handle differently
      // For now, skip grade filtering
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Get students
    const allStudents = await query.limit(limit).offset((page - 1) * limit);

    console.log('🔍 ADMIN STUDENTS: Found students:', allStudents.length);

    // Transform data and calculate status
    const transformedStudents = allStudents.map(student => {
      const avgProgress = Number(student.avgProgress) || 0;
      const daysSinceLastActive = student.lastActive
        ? Math.floor((Date.now() - new Date(student.lastActive).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let status: 'active' | 'inactive' | 'at-risk' = 'inactive';

      if (daysSinceLastActive === null) {
        status = 'inactive';
      } else if (daysSinceLastActive <= 3 && avgProgress >= 50) {
        status = 'active';
      } else if (daysSinceLastActive <= 7 && avgProgress >= 25) {
        status = 'active';
      } else if (daysSinceLastActive >= 7 || avgProgress < 25) {
        status = 'at-risk';
      }

      return {
        id: student.id,
        name: student.name || 'Unknown User',
        email: student.email,
        clerkId: student.clerkId,
        grade: '10', // Default grade - we should add this to user schema
        enrolledCourses: Number(student.enrollmentCount) || 0,
        completedCourses: Number(student.completedCourses) || 0,
        studyTime: Number(student.totalStudyTime) || 0,
        lastActive: daysSinceLastActive === null
          ? 'Never'
          : daysSinceLastActive === 0
            ? 'Today'
            : daysSinceLastActive === 1
              ? '1 day ago'
              : `${daysSinceLastActive} days ago`,
        status,
        progress: Math.round(avgProgress),
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      };
    });

    // Apply status filter after transformation (since status is calculated)
    const filteredStudents = status && status !== 'all'
      ? transformedStudents.filter(student => student.status === status)
      : transformedStudents;

    // Calculate stats
    const stats = {
      total: allStudents.length,
      active: transformedStudents.filter(s => s.status === 'active').length,
      inactive: transformedStudents.filter(s => s.status === 'inactive').length,
      atRisk: transformedStudents.filter(s => s.status === 'at-risk').length,
      avgProgress: Math.round(
        transformedStudents.reduce((sum, s) => sum + s.progress, 0) / transformedStudents.length
      ) || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        students: filteredStudents,
        stats,
        pagination: {
          page,
          limit,
          total: allStudents.length,
          pages: Math.ceil(allStudents.length / limit),
        }
      }
    });

  } catch (error) {
    console.error('🔍 ADMIN STUDENTS: Error:', error);
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