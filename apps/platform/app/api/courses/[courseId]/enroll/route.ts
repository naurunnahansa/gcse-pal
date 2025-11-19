import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, enrollments, eq, and } from '@/lib/db';
import { findUserByClerkId, findEnrollment } from '@/lib/db/queries';

// Add timeout utility
const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// POST /api/courses/[courseId]/enroll - Enroll user in course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  console.log('🔍 ENROLL: Starting enrollment request...');

  try {
    console.log('🔍 ENROLL: Attempting to get auth()...');

    // Add timeout to auth call
    const { userId } = await withTimeout(auth(), 5000);
    console.log('🔍 ENROLL: Auth result userId:', userId);

    if (!userId) {
      console.log('🔍 ENROLL: No userId found, returning 401');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    const { courseId } = await params;
    console.log('🔍 ENROLL: courseId extracted:', courseId);

    // Import db functions only after auth succeeds
    console.log('🔍 ENROLL: Importing database functions...');
    const {
      db,
      users,
      courses,
      enrollments,
      findUserByClerkId,
      findCourseById,
      findEnrollment,
      createEnrollment
    } = await import('@/lib/db');

    // Get user from database with timeout
    console.log('🔍 ENROLL: Looking up user by clerkId:', userId);
    const user = await withTimeout(findUserByClerkId(userId), 3000);
    console.log('🔍 ENROLL: User lookup result:', user ? 'found' : 'not found');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get course with timeout
    console.log('🔍 ENROLL: Looking up course...');
    const course = await withTimeout(findCourseById(courseId), 3000);
    console.log('🔍 ENROLL: Course lookup result:', course ? 'found' : 'not found');

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
    console.log('🔍 ENROLL: Checking existing enrollment...');
    const existingEnrollment = await withTimeout(findEnrollment(user.id, courseId), 3000);
    console.log('🔍 ENROLL: Existing enrollment result:', existingEnrollment ? 'found' : 'not found');

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    console.log('🔍 ENROLL: Creating enrollment...');
    const enrollment = await withTimeout(createEnrollment({
      userId: user.id,
      courseId: courseId,
      status: 'active',
    }), 5000);
    console.log('🔍 ENROLL: Enrollment created successfully');

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
    console.error('🔍 ENROLL: Error occurred:', error);

    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { success: false, error: 'Request timed out - please try again' },
        { status: 408 }
      );
    }

    console.error('Enroll course error:', error);
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