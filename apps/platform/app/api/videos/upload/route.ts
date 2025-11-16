import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, users, courses, chapters, lessons } from '@/lib/db';
import { eq } from 'drizzle-orm';
import Mux from '@mux/mux-node';

// Initialize Mux with environment variables
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// POST /api/videos/upload - Create a direct upload URL for Mux
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user role (only admin/teacher can upload videos)
    const userRecords = await db.select({ role: users.role })
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    const user = userRecords[0];

    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or teacher access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { lessonId, chapterId, courseId } = body;

    if (!lessonId || !chapterId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: lessonId, chapterId, courseId' },
        { status: 400 }
      );
    }

    // Verify the user has permission to edit this course
    // Note: This is a simplified check - in a real implementation you'd want to properly
    // verify course ownership/instructor permissions
    const courseRecords = await db.select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    const course = courseRecords[0];

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if lesson exists
    const lessonRecords = await db.select()
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);

    const lesson = lessonRecords[0];

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Verify lesson belongs to the specified chapter and course
    if (lesson.chapterId !== chapterId) {
      return NextResponse.json(
        { success: false, error: 'Lesson does not belong to specified chapter' },
        { status: 400 }
      );
    }

    // Verify chapter belongs to the course
    const chapterRecords = await db.select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    const chapter = chapterRecords[0];

    if (!chapter || chapter.courseId !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found or does not belong to specified course' },
        { status: 400 }
      );
    }

    // Create a Mux direct upload URL
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
        video_quality: 'basic',
        max_resolution_tier: '1080p',
        per_title_encode: true,
        test: process.env.NODE_ENV !== 'production',
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    // Store upload information in database
    await db.update(lessons)
      .set({
        muxAssetId: null, // Will be set when upload is complete
        muxUploadId: upload.id,
        muxStatus: 'preparing',
      })
      .where(eq(lessons.id, lessonId));

    return NextResponse.json({
      success: true,
      data: {
        uploadId: upload.id,
        uploadUrl: upload.url,
        timeout: upload.timeout,
      },
    });

  } catch (error) {
    console.error('Create video upload URL error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create upload URL' },
      { status: 500 }
    );
  }
}