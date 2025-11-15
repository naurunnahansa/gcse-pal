import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  db,
  users,
  courses,
  chapters,
  lessons,
  enrollments,
  findUserByClerkId,
  updateUser,
  findCoursesWithFilters,
  countCourses,
  createUser
} from '@/lib/db/queries';
import { eq, and, or, desc, asc, count as drizzleCount, inArray } from 'drizzle-orm';

// GET /api/courses - Fetch all courses with optional filtering
export async function GET(req: NextRequest) {
  try {
    // Public endpoint - no authentication required for course browsing

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get total count for pagination
    const total = await countCourses({
      status: 'published',
      subject: subject || undefined,
      level: level || undefined,
      difficulty: difficulty || undefined,
      search: search || undefined
    });

    // Get courses with pagination
    const coursesData = await findCoursesWithFilters({
      subject: subject || undefined,
      level: level || undefined,
      difficulty: difficulty || undefined,
      search: search || undefined,
      status: 'published',
      page,
      limit
    });

    // Get chapters for each course
    const coursesWithChapters = await Promise.all(
      coursesData.map(async (course) => {
        const courseChapters = await db.select({
          id: chapters.id,
          title: chapters.title,
          duration: chapters.duration,
        })
          .from(chapters)
          .where(eq(chapters.courseId, course.id))
          .orderBy(asc(chapters.order));

        // Get enrollment count for this course
        const enrollmentCountResult = await db.select({ count: drizzleCount() })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));

        const enrollmentCount = enrollmentCountResult[0]?.count || 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          subject: course.subject,
          level: course.level,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
          duration: course.duration,
          difficulty: course.difficulty,
          topics: course.topics,
          enrollmentCount,
          rating: course.rating,
          price: course.price,
          chaptersCount: courseChapters.length,
          chapters: courseChapters,
          createdAt: course.createdAt,
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

    // Check if user is admin or teacher
    let user = await findUserByClerkId(userId);

    // Create user if not exists
    if (!user) {
      // This shouldn't happen if sync endpoint is called, but just in case
      return NextResponse.json(
        { success: false, error: 'User not found. Please sync first.' },
        { status: 404 }
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
      thumbnail,
      instructor,
      duration,
      difficulty,
      topics,
      price,
      status,
      chapters,
    } = body;

    if (!title || !description || !subject || !instructor) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, subject, instructor' },
        { status: 400 }
      );
    }

    // Create course with chapters and lessons using Drizzle transaction
    const result = await db.transaction(async (tx) => {
      // Create the course
      const courseResult = await tx.insert(courses)
        .values({
          title,
          description,
          subject,
          level: level || 'gcse',
          thumbnail,
          instructor,
          instructorId: user.id,
          duration: duration || 0,
          difficulty: difficulty || 'beginner',
          topics: topics || [],
          price: price || 0,
          status: status || 'draft',
        })
        .returning();

      const course = courseResult[0];

      // If chapters are provided, create them with lessons
      if (chapters && Array.isArray(chapters) && chapters.length > 0) {
        for (const [index, chapterData] of chapters.entries()) {
          if (!chapterData.title || !chapterData.title.trim()) {
            throw new Error(`Chapter ${index + 1} title is required`);
          }

          const chapterResult = await tx.insert(chapters)
            .values({
              courseId: course.id,
              title: chapterData.title,
              description: chapterData.description || '',
              order: index,
              duration: chapterData.duration || 0,
              isPublished: chapterData.isPublished || false,
            })
            .returning();

          const chapter = chapterResult[0];

          // Create lessons for this chapter if provided
          if (chapterData.lessons && Array.isArray(chapterData.lessons) && chapterData.lessons.length > 0) {
            for (const [lessonIndex, lessonData] of chapterData.lessons.entries()) {
              if (!lessonData.title || !lessonData.title.trim()) {
                throw new Error(`Lesson ${lessonIndex + 1} in chapter ${chapterData.title} title is required`);
              }

              await tx.insert(lessons)
                .values({
                  chapterId: chapter.id,
                  title: lessonData.title,
                  description: lessonData.description || '',
                  content: lessonData.content,
                  videoUrl: lessonData.videoUrl,
                  videoDuration: lessonData.videoDuration,
                  markdownPath: lessonData.markdownPath,
                  hasVideo: !!lessonData.videoUrl,
                  hasMarkdown: !!lessonData.markdownPath || !!lessonData.content,
                  order: lessonIndex,
                  duration: lessonData.duration || 0,
                  isPublished: lessonData.isPublished || false,
                });
            }
          }
        }
      }

      // Fetch the complete course with all relations
      const courseChapters = await tx.select({
        id: chapters.id,
        courseId: chapters.courseId,
        title: chapters.title,
        description: chapters.description,
        order: chapters.order,
        duration: chapters.duration,
        isPublished: chapters.isPublished,
        createdAt: chapters.createdAt,
        updatedAt: chapters.updatedAt,
      })
        .from(chapters)
        .where(eq(chapters.courseId, course.id))
        .orderBy(asc(chapters.order));

      // Get lessons for each chapter
      const chaptersWithLessons = await Promise.all(
        courseChapters.map(async (chapter) => {
          const chapterLessons = await tx.select()
            .from(lessons)
            .where(eq(lessons.chapterId, chapter.id))
            .orderBy(asc(lessons.order));

          return {
            ...chapter,
            lessons: chapterLessons,
          };
        })
      );

      // Get counts
      const enrollmentCountResult = await tx.select({ count: drizzleCount() })
        .from(enrollments)
        .where(eq(enrollments.courseId, course.id));

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

    // Handle validation errors specifically
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}