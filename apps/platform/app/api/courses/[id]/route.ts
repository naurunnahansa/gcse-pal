import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/courses/[id] - Fetch a specific course with full details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // Get course with full details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                description: true,
                content: true,
                videoUrl: true,
                videoDuration: true,
                markdownPath: true,
                duration: true,
                order: true,
                isPublished: true,
                hasVideo: true,
                hasMarkdown: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // For admin/teacher access, return full course data with enrollment info
    if (user && ['admin', 'teacher'].includes(user.role)) {
      // Check enrollment even for admins (they might be enrolled as students)
      let enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });

      const formattedCourse = {
        id: course.id,
        title: course.title,
        description: course.description,
        subject: course.subject,
        level: course.level,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        instructorId: course.instructorId,
        duration: course.duration,
        difficulty: course.difficulty,
        topics: course.topics,
        price: course.price,
        status: course.status,
        rating: course.rating,
        chapters: course.chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          duration: chapter.duration,
          order: chapter.order,
          isPublished: chapter.isPublished,
          lessons: chapter.lessons,
          lessonsCount: chapter.lessons.length,
          totalDuration: chapter.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
        })),
        userEnrollment: enrollment ? {
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt,
          progress: enrollment.progress,
          status: enrollment.status,
          completedAt: enrollment.completedAt,
        } : null,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };

      return NextResponse.json({
        success: true,
        data: formattedCourse,
      });
    }

    // For regular users, check enrollment and return limited data
    let enrollment = null;
    if (user) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      });
    }

    // Get user progress for this course
    let progress: any[] = [];
    if (user) {
      progress = await prisma.progress.findMany({
        where: {
          userId: user.id,
          courseId: course.id,
        },
      });
    }

    // Format response for regular users
    const formattedCourse = {
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
      enrollmentCount: course._count.enrollments,
      rating: course.rating,
      price: course.price,
      status: course.status,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      chapters: course.chapters.map(chapter => ({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        duration: chapter.duration,
        order: chapter.order,
        isPublished: chapter.isPublished,
        lessons: chapter.lessons,
        lessonsCount: chapter.lessons.length,
        totalDuration: chapter.lessons.reduce((sum, lesson) => sum + lesson.duration, 0),
      })),
      userEnrollment: enrollment ? {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        progress: enrollment.progress,
        status: enrollment.status,
        completedAt: enrollment.completedAt,
      } : null,
      userProgress: progress,
    };

    return NextResponse.json({
      success: true,
      data: formattedCourse,
    });
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update a course
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: courseId } = await params;
    const body = await req.json();

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Auto-promote any user with 'example.com' in email to admin (temporary)
    if (user && user.email.includes('example.com') && user.role !== 'admin') {
      console.log('Auto-promoting user to admin:', user.email);
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' }
      });
      // Update the user object with new role
      user.role = 'admin';
      console.log('User promoted to admin successfully');
    }

    // Check if user is admin or teacher
    if (!['admin', 'teacher'].includes(user.role)) {
      console.log('User role check failed:', { email: user?.email, role: user?.role });
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or teacher access required' },
        { status: 403 }
      );
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!existingCourse) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this course
    // Admin can edit any course, teacher can only edit their own courses
    if (user.role !== 'admin' && existingCourse.instructorId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You can only edit your own courses' },
        { status: 403 }
      );
    }

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

    // Validate required fields
    if (!title || !description || !subject || !instructor) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, description, subject, instructor' },
        { status: 400 }
      );
    }

    // Update course with chapters and lessons in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the course
      const updatedCourse = await tx.course.update({
        where: { id: courseId },
        data: {
          title,
          description,
          subject,
          level: level || 'gcse',
          thumbnail,
          instructor,
          duration: duration || 0,
          difficulty: difficulty || 'beginner',
          topics: topics || [],
          price: price || 0,
          status: status || 'draft',
        },
      });

      // If chapters are provided, update them
      if (chapters && Array.isArray(chapters)) {
        // Get existing chapter IDs
        const existingChapters = await tx.chapter.findMany({
          where: { courseId: courseId },
          select: { id: true },
        });
        const existingChapterIds = new Set(existingChapters.map(c => c.id));

        // Process each chapter
        for (const [index, chapterData] of chapters.entries()) {
          if (!chapterData.title || !chapterData.title.trim()) {
            throw new Error(`Chapter ${index + 1} title is required`);
          }

          let chapter;
          if (chapterData.id && existingChapterIds.has(chapterData.id)) {
            // Update existing chapter
            chapter = await tx.chapter.update({
              where: { id: chapterData.id },
              data: {
                title: chapterData.title,
                description: chapterData.description || '',
                order: index,
                duration: chapterData.duration || 0,
                isPublished: chapterData.isPublished || false,
              },
            });
            existingChapterIds.delete(chapterData.id); // Remove from set to avoid deletion
          } else {
            // Create new chapter
            chapter = await tx.chapter.create({
              data: {
                courseId: courseId,
                title: chapterData.title,
                description: chapterData.description || '',
                order: index,
                duration: chapterData.duration || 0,
                isPublished: chapterData.isPublished || false,
              },
            });
          }

          // Handle lessons for this chapter
          if (chapterData.lessons && Array.isArray(chapterData.lessons)) {
            // Get existing lesson IDs for this chapter
            const existingLessons = await tx.lesson.findMany({
              where: { chapterId: chapter.id },
              select: { id: true },
            });
            const existingLessonIds = new Set(existingLessons.map(l => l.id));

            // Process each lesson
            for (const [lessonIndex, lessonData] of chapterData.lessons.entries()) {
              if (!lessonData.title || !lessonData.title.trim()) {
                throw new Error(`Lesson ${lessonIndex + 1} in chapter ${chapterData.title} title is required`);
              }

              if (lessonData.id && existingLessonIds.has(lessonData.id)) {
                // Update existing lesson
                await tx.lesson.update({
                  where: { id: lessonData.id },
                  data: {
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
                  },
                });
                existingLessonIds.delete(lessonData.id); // Remove from set to avoid deletion
              } else {
                // Create new lesson
                await tx.lesson.create({
                  data: {
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
                  },
                });
              }
            }

            // Delete lessons that are no longer present
            for (const lessonIdToDelete of existingLessonIds) {
              await tx.lesson.delete({
                where: { id: lessonIdToDelete },
              });
            }
          }
        }

        // Delete chapters that are no longer present
        for (const chapterIdToDelete of existingChapterIds) {
          // First delete all lessons in this chapter
          await tx.lesson.deleteMany({
            where: { chapterId: chapterIdToDelete },
          });
          // Then delete the chapter
          await tx.chapter.delete({
            where: { id: chapterIdToDelete },
          });
        }
      }

      // Fetch the complete updated course with all relations
      const completeCourse = await tx.course.findUnique({
        where: { id: courseId },
        include: {
          chapters: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              chapters: true,
            },
          },
        },
      });

      return completeCourse;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Update course error:', error);

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

