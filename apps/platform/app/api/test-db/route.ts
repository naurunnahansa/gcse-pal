import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/db/queries';
import { courses as coursesCompat } from '@/lib/db/schema-compat';

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');

    // Test basic database connection
    const userCount = await db.select().from(users);
    console.log('🧪 Users table accessible:', userCount.length, 'users found');

    const courseCount = await db.select().from(coursesCompat);
    console.log('🧪 Courses table accessible:', courseCount.length, 'courses found');

    // Test course structure
    if (courseCount.length > 0) {
      const firstCourse = courseCount[0];
      console.log('🧪 First course structure:', {
        id: firstCourse.id,
        title: firstCourse.title,
        keys: Object.keys(firstCourse)
      });
    }

    // Test course insertion
    console.log('🧪 Testing course insertion...');
    const testResult = await db.insert(coursesCompat)
      .values({
        title: 'Test Course ' + Date.now(),
        description: 'Test description',
        slug: 'test-course-' + Date.now(),
        subject: 'mathematics',
        level: 'igcse',
        created_by: 'test-user-id',  // Changed from createdBy to created_by
        status: 'draft',
        instructor: 'Test Instructor',
        duration: 0,
        difficulty: 'beginner',
        topics: [],
        enrollment_count: 0,
        rating: 0,
        price: 0,
      })
      .returning();

    console.log('🧪 Course insertion result:', testResult);

    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      data: {
        userCount: userCount.length,
        courseCount: courseCount.length,
        testCourseCreated: testResult ? testResult.length > 0 : false,
        testCourseId: testResult?.[0]?.id,
        firstCourseKeys: courseCount.length > 0 ? Object.keys(courseCount[0]) : []
      }
    });

  } catch (error) {
    console.error('🧪 Database test error:', error);
    console.error('🧪 Error stack:', error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    }, { status: 500 });
  }
}