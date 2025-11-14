import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          {
            title: {
              contains: slug,
              mode: 'insensitive'
            }
          },
          {
            subject: {
              contains: slug,
              mode: 'insensitive'
            }
          }
        ],
        status: 'published'
      },
      select: {
        id: true,
        title: true,
        subject: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1
    });

    if (courses.length > 0) {
      return NextResponse.json({
        success: true,
        data: {
          courseId: courses[0].id,
          course: courses[0]
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