import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  enrollments,
  findUserByClerkId,
  findCourseById,
  findEnrollment,
  createEnrollment
} from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

// POST /api/courses/[courseId]/enroll - Enroll user in course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get course
    const course = await findCourseById(courseId);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course is published
    if (course.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Course is not available for enrollment' },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await findEnrollment(user.id, courseId);

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await createEnrollment({
      userId: user.id,
      courseId: courseId,
      status: 'active',
    });

    // Note: enrollmentCount is now calculated dynamically, no need to update it

    return NextResponse.json({
      success: true,
      data: {
        enrollmentId: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
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

// DELETE /api/courses/[courseId]/enroll - Unenroll user from course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Get user from database
    const user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find enrollment
    const enrollment = await findEnrollment(user.id, courseId);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    // Delete enrollment
    await db.delete(enrollments)
      .where(and(
        eq(enrollments.userId, user.id),
        eq(enrollments.courseId, courseId)
      ));

    // Note: enrollmentCount is now calculated dynamically, no need to update it

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from course',
    });
  } catch (error) {
    console.error('Unenroll course error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}