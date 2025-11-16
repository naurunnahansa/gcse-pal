import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { users, enrollments, courses, chapters, lessons, lessonProgress } from '@/lib/db';

// GET /api/enrollments/my - Get user's course enrollments with progress
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1)
      .then(result => result[0] || null);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's enrollments
    const userEnrollments = await db.select()
      .from(enrollments)
      .where(eq(enrollments.userId, user.id))
      .orderBy(desc(enrollments.enrolledAt));

    // Get course details for all enrollments
    const enrollmentCourseIds = userEnrollments.map(e => e.courseId);
    const enrolledCourses = await db.select()
      .from(courses)
      .where(inArray(courses.id, enrollmentCourseIds));

    // Get chapters for all enrolled courses
    const courseChapters = await db.select()
      .from(chapters)
      .where(inArray(chapters.courseId, enrollmentCourseIds))
      .orderBy(chapters.position);

    // Get lesson counts for chapters
    const chapterIds = courseChapters.map(c => c.id);
    const chapterLessons = await db.select()
      .from(lessons)
      .where(inArray(lessons.chapterId, chapterIds));

    // Combine the data to match the original structure
    const enrollments = userEnrollments.map(enrollment => {
      const course = enrolledCourses.find(c => c.id === enrollment.courseId);
      if (!course) return null;

      const courseChaptersWithLessons = courseChapters
        .filter(chapter => chapter.courseId === course.id)
        .map(chapter => ({
          id: chapter.id,
          title: chapter.title,
          duration: chapter.duration,
          position: chapter.position,
          lessons: chapterLessons
            .filter(lesson => lesson.chapterId === chapter.id)
            .map(lesson => ({ id: lesson.id }))
        }));

      return {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        progress: enrollment.progress,
        status: enrollment.status,
        course: {
          ...course,
          chapters: courseChaptersWithLessons
        }
      };
    }).filter(Boolean); // Remove any null entries

    // Get progress for all user enrollments
    const userProgress = await db.select()
      .from(lessonProgress)
      .where(and(
        eq(lessonProgress.userId, user.id),
        inArray(lessonProgress.courseId, enrollmentCourseIds)
      ));

    // Calculate progress for each enrollment
    const formattedEnrollments = enrollments.map(enrollment => {
      const totalLessons = enrollment.course.chapters.reduce(
        (sum, chapter) => sum + chapter.lessons.length,
        0
      );
      const completedLessons = userProgress.filter(
        p => p.courseId === enrollment.courseId && p.status === 'completed' && p.lessonId
      ).length;
      const calculatedProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Update progress if it differs
      if (Math.abs(calculatedProgress - enrollment.progress) > 1) {
        db.update(enrollments)
          .set({ progress: calculatedProgress })
          .where(eq(enrollments.id, enrollment.id))
          .catch(console.error);
      }

      return {
        id: enrollment.id,
        courseId: enrollment.courseId, // Add courseId field at the top level
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          subject: enrollment.course.subject,
          level: enrollment.course.level,
          thumbnailUrl: enrollment.course.thumbnailUrl,
          slug: enrollment.course.slug,
          status: enrollment.course.status,
          chaptersCount: enrollment.course.chapters.length,
          totalLessons: totalLessons,
        },
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        status: enrollment.status,
        progress: Math.round(calculatedProgress),
        lastAccessed: userProgress.length > 0
          ? new Date(Math.max(...userProgress.filter(p => p.courseId === enrollment.courseId).map(p => new Date(p.lastAccessed).getTime())))
          : enrollment.enrolledAt,
      };
    });

    // Calculate overall statistics
    const totalEnrollments = formattedEnrollments.length;
    const completedCourses = formattedEnrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = formattedEnrollments.filter(e => e.status === 'active').length;
    const averageProgress = totalEnrollments > 0
      ? formattedEnrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        enrollments: formattedEnrollments,
        statistics: {
          totalEnrollments,
          completedCourses,
          inProgressCourses,
          averageProgress: Math.round(averageProgress),
        },
      },
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}