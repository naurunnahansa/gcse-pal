import { NextRequest, NextResponse } from 'next/server';
import { db, courses } from '@/lib/db/queries';
import { eq, or, ilike, desc } from 'drizzle-orm';

// GET /api/courses/slug/[slug] - Resolve course slug to ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Map common slugs to course IDs
    const slugMappings: { [key: string]: string } = {
      'mathematics': 'test-course-1',
      'math': 'test-course-1',
      'algebra': 'test-course-1',
      'english': 'test-course-2',
      'english-literature': 'test-course-2',
      'shakespeare': 'test-course-2',
    };

    // Try to find course by slug mapping first
    const courseId = slugMappings[slug.toLowerCase()];

    if (courseId) {
      return NextResponse.json({
        success: true,
        data: { courseId }
      });
    }

    // If not found in mappings, try to find by title or subject
    const foundCourses = await db.select({
      id: courses.id,
      title: courses.title,
      subject: courses.subject,
    })
      .from(courses)
      .where(and(
        eq(courses.status, 'published'),
        or(
          ilike(courses.title, `%${slug}%`),
          ilike(courses.subject, `%${slug}%`)
        )
      ))
      .orderBy(desc(courses.createdAt))
      .limit(1);

    if (foundCourses.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          courseId: foundCourses[0].id,
          course: foundCourses[0]
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Course not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Resolve course slug error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}