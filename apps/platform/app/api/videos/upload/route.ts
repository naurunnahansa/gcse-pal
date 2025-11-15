import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

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
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            lessons: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if lesson belongs to the course
    const lesson = course.chapters
      .flatMap(chapter => chapter.lessons)
      .find(lesson => lesson.id === lessonId);

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found in this course' },
        { status: 404 }
      );
    }

    // Create a Mux direct upload URL
    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: 'public',
        video_quality: 'auto',
        max_resolution_tier: '1080p',
        audio_quality: 'high',
        per_title_encode: true,
        test: process.env.NODE_ENV !== 'production',
      },
      cors_origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    // Store upload information in database
    await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        muxAssetId: null, // Will be set when upload is complete
        muxUploadId: upload.id,
        muxStatus: 'preparing',
      },
    });

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