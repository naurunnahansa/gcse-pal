import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  chapters,
  lessons,
  enrollments,
  findUserByClerkId,
  updateUser,
  findCoursesWithFilters,
  countCourses,
  createUser,
  createCourseWithSlug
} from '@/lib/db/queries';

import {
  coursesCompat,
  chaptersCompat,
  usersCompat
} from '@/lib/db/schema-compat';
import { eq, and, or, desc, asc, count as drizzleCount, inArray } from 'drizzle-orm';
import { ensureUserExists } from '@/lib/clerk-helper';

// GET /api/courses - Fetch all courses with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Public endpoint - no authentication required for course browsing

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get total count for pagination
    const total = await countCourses({
      status: 'published',
      subject: subject || undefined,
      level: level || undefined,
      search: search || undefined
    });

    // Get courses with pagination
    const coursesData = await findCoursesWithFilters({
      subject: subject || undefined,
      level: level || undefined,
      search: search || undefined,
      status: 'published',
      page,
      limit
    });

    // Get chapters for each course
    const coursesWithChapters = await Promise.all(
      coursesData.map(async (course) => {
        const courseChapters = await db.select({
          id: chaptersCompat.id,
          title: chaptersCompat.title,
          duration: chaptersCompat.duration,
        })
          .from(chaptersCompat)
          .where(eq(chaptersCompat.course_id, course.id))
          .orderBy(asc(chaptersCompat.order));

        // Get enrollment count for this course
        const enrollmentCountResult = await db.select({ count: drizzleCount() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        const enrollmentCount = enrollmentCountResult[0]?.count || 0;

        // Calculate total duration from chapters
        const totalDuration = courseChapters.reduce((sum, chapter) => sum + (chapter.duration || 0), 0);

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          subject: course.subject,
          level: course.level,
          thumbnail: course.thumbnail || course.thumbnail_url,
          instructor: 'GCSE Pal Team', // No instructor field in database, using default
          duration: totalDuration,
          difficulty: 'intermediate', // No difficulty field in database, using default
          topics: [], // Topics not in schema yet, could be derived from tags/keywords
          enrollmentCount,
          rating: 0, // Rating system not implemented yet
          price: 0, // All courses free for now
          chaptersCount: courseChapters.length,
          chapters: courseChapters,
          createdAt: course.created_at,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: coursesWithChapters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Ensure user exists in our database
    await ensureUserExists(userId);

    // Check if user is admin or teacher
    let user = await findUserByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user in database' },
        { status: 500 }
      );
    }

    // TEMPORARY: Bypass admin check for development
    console.log('User found:', { email: user?.email, role: user?.role, clerkId: userId });

    // Auto-promote any user with 'example.com' in email to admin (temporary)
    if (user && user.email.includes('example.com') && user.role !== 'admin') {
      console.log('Auto-promoting user to admin:', user.email);
      user = await updateUser(user.id, { role: 'admin' });
      console.log('User promoted to admin successfully');
    }

    // TEMPORARY: Allow all authenticated users to create courses for development
    if (false && !user || !['admin', 'teacher'].includes(user.role)) {
      console.log('User role check failed:', { email: user?.email, role: user?.role });
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or teacher access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      subject,
      level,
      thumbnailUrl,
      status,
      chapters,
    } = body;

    if (!title || !description || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, subject' },
        { status: 400 }
      );
    }

    // Create course with chapters and lessons using Drizzle transaction
    const result = await db.transaction(async (tx) => {
      // Create the course
      console.log('🏗️ Creating course with data:', {
        title,
        description,
        subject,
        level: level || 'gcse',
        thumbnailUrl,
        createdBy: user.id,
        status: status || 'draft',
      });

      console.log('🏗️ About to insert course with user:', user.id);

      const courseResult = await tx.insert(coursesCompat)
        .values({
          title,
          description,
          subject,
          level: level || 'gcse',
          thumbnail: thumbnailUrl,
          thumbnail_url: thumbnailUrl,  // Also set thumbnail_url for consistency
          status: status || 'draft',
          created_by: user.id,  // Use created_by instead of instructor/instructor_id
          slug: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50),  // Generate slug from title
        })
        .returning();

      console.log('📋 Course insert result:', courseResult);

      if (!courseResult || courseResult.length === 0) {
        throw new Error('Failed to create course - no results returned from database');
      }

      // Extract course data and ID
      const course = courseResult[0];

      console.log('🔍 Course object extraction:', {
        course,
        courseType: typeof course,
        courseId: course?.id,
        courseIdType: typeof course?.id,
        courseKeys: course ? Object.keys(course) : 'undefined'
      });

      if (!course) {
        throw new Error('Failed to extract course from course creation result');
      }

      const courseId = course.id;

      console.log('🔍 Direct courseId extraction:', {
        courseId,
        courseIdType: typeof courseId,
        firstResultKeys: courseResult[0] ? Object.keys(courseResult[0]) : 'undefined'
      });

      if (!courseId) {
        throw new Error('Failed to extract courseId from course creation result');
      }

      console.log('✅ Course created successfully:', { id: courseId, title: courseResult[0]?.title });
      console.log('🔍 Debugging courseId variable:', { courseId, type: typeof courseId });

      // If chapters are provided, create them with lessons
      if (chapters && Array.isArray(chapters) && chapters.length > 0) {
        console.log('📚 Creating chapters:', chapters.length);

        // Use for...of to avoid potential closure issues with let in async context
        for (const [index, chapterData] of chapters.entries()) {
          if (!chapterData.title || !chapterData.title.trim()) {
            throw new Error(`Chapter ${index + 1} title is required`);
          }

          console.log(`📖 Creating chapter ${index + 1}:`, chapterData.title);
          console.log(`🔍 Debugging before chapter insertion:`, {
            courseId,
            courseIdType: typeof courseId,
            index,
            chapterDataTitle: chapterData.title
          });

          // Create a local copy of courseId to avoid any potential closure issues
          const currentCourseId = courseId;

          const chapterResult = await tx.insert(chaptersCompat)
            .values({
              course_id: currentCourseId,  // Changed from courseId to course_id
              title: chapterData.title,
              description: chapterData.description || '',
              order: index,
              duration: chapterData.duration || 0,
              is_published: chapterData.isPublished || false,  // Changed from isPublished to is_published
            })
            .returning();

          if (!chapterResult || chapterResult.length === 0) {
            throw new Error(`Failed to create chapter ${index + 1} - no results returned from database`);
          }

          const chapter = chapterResult[0];

          if (!chapter) {
            throw new Error(`Failed to create chapter ${index + 1} - chapter object is null`);
          }

          console.log(`✅ Chapter created:`, { id: chapter.id, title: chapter.title });

          // Create lessons for this chapter if provided
          if (chapterData.lessons && Array.isArray(chapterData.lessons) && chapterData.lessons.length > 0) {
            for (let lessonIndex = 0; lessonIndex < chapterData.lessons.length; lessonIndex++) {
              const lessonData = chapterData.lessons[lessonIndex];
              if (!lessonData.title || !lessonData.title.trim()) {
                throw new Error(`Lesson ${lessonIndex + 1} in chapter ${chapterData.title} title is required`);
              }

              await tx.insert(lessons)
                .values({
                  chapterId: chapter.id,
                  title: lessonData.title,
                  description: lessonData.description || '',
                  position: lessonIndex,
                  contentType: lessonData.contentType || 'mixed',
                  videoUrl: lessonData.videoUrl,
                  videoDurationSeconds: lessonData.videoDurationSeconds || 0,
                  markdownContent: lessonData.markdownContent || lessonData.content || '',
                  duration: lessonData.duration || 0,
                  isPublished: lessonData.isPublished || false,
                  isPreview: lessonData.isPreview || false,
                  muxAssetId: lessonData.muxAssetId,
                  muxPlaybackId: lessonData.muxPlaybackId,
                  muxUploadId: lessonData.muxUploadId,
                  muxStatus: lessonData.muxStatus || 'preparing',
                });
            }
          }
        }
      }

      // Fetch the complete course with all relations
      console.log('🔍 About to query chapters for courseId:', courseId);

      // Check if chapters table is available before querying
      let courseChapters = [];
      try {
        courseChapters = await tx.select({
          id: chaptersCompat.id,
          course_id: chaptersCompat.course_id,  // Changed from courseId to course_id
          title: chaptersCompat.title,
          description: chaptersCompat.description,
          order: chaptersCompat.order,
          duration: chaptersCompat.duration,
          is_published: chaptersCompat.is_published,  // Changed from isPublished to is_published
          created_at: chaptersCompat.created_at,  // Changed from createdAt
          updated_at: chaptersCompat.updated_at,  // Changed from updatedAt
        })
          .from(chaptersCompat)
          .where(eq(chaptersCompat.course_id, courseId))  // Changed from chapters.courseId
          .orderBy(asc(chaptersCompat.order));
        console.log('🔍 Chapters query result:', courseChapters);
      } catch (chaptersError) {
        console.error('❌ Error querying chapters:', chaptersError);
        // Set empty chapters array if query fails
        courseChapters = [];
      }

      console.log('🔍 About to process chapters. courseChapters:', courseChapters);
      console.log('🔍 chapters variable:', chapters);
      console.log('🔍 chapters type:', typeof chapters);

      // Get lessons for each chapter
      let chaptersWithLessons = [];
      try {
        chaptersWithLessons = await Promise.all(
          courseChapters.map(async (chapter) => {
            console.log('🔍 Processing chapter:', chapter);
            const chapterLessons = await tx.select()
              .from(lessons)
              .where(eq(lessons.chapterId, chapter.id))
              .orderBy(asc(lessons.position));

            return {
              ...chapter,
              lessons: chapterLessons,
            };
          })
        );
      } catch (lessonsError) {
        console.error('❌ Error processing lessons:', lessonsError);
        chaptersWithLessons = [];
      }

      // Get counts
      let enrollmentCountResult = [];
      try {
        enrollmentCountResult = await tx.select({ count: drizzleCount() })
          .from(enrollments)
          .where(eq(enrollments.courseId, courseId));
      } catch (enrollmentError) {
        console.error('❌ Error getting enrollment count:', enrollmentError);
        enrollmentCountResult = [{ count: 0 }];
      }

      console.log('✅ About to return course data');
      return {
        ...course,
        chapters: chaptersWithLessons,
        _count: {
          enrollments: enrollmentCountResult[0]?.count || 0,
          chapters: courseChapters.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create course error:', error);
    console.error('Error details:', {
      errorType: typeof error,
      errorMessage: error instanceof Error ? error.message : 'Not an Error instance',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      errorObject: error
    });

    // Handle validation errors specifically
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: {
            type: 'validation_error',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
          }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: {
          type: 'unknown_error',
          errorData: JSON.stringify(error)
        }
      },
      { status: 500 }
    );
  }
}