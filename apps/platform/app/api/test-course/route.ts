import { NextRequest, NextResponse } from 'next/server';
import { db, courses } from '@/lib/db/queries';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    console.log('🧪 Test: About to create course');
    console.log('🧪 Test: Title:', title);
    console.log('🧪 Test: Description:', description);

    // Test simple course insertion without any complexity
    const result = await db.insert(courses)
      .values({
        title,
        description,
        slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        subject: 'mathematics',
        level: 'igcse',
        createdBy: userId,
        status: 'draft',
      })
      .returning();

    console.log('🧪 Test: Course created:', result);

    if (!result || result.length === 0) {
      return NextResponse.json({ success: false, error: 'No course created' }, { status: 500 });
    }

    const course = result[0];
    console.log('🧪 Test: Course object:', course);
    console.log('🧪 Test: Course ID:', course?.id);

    return NextResponse.json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        description: course.description,
        slug: course.slug,
        created: true
      }
    });

  } catch (error) {
    console.error('🧪 Test: Error:', error);
    console.error('🧪 Test: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      type: typeof error
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        type: typeof error,
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}