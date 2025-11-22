'use server'

import { db } from '@/db'
import { courseEnrollments, courses, chapters, pages, pageProgress } from '@/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Types
export type CourseEnrollment = typeof courseEnrollments.$inferSelect

// Enroll in a course
export async function enrollInCourse(courseId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Check if course exists and is published
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    if (!course.isPublished) {
      return { success: false, error: 'Course is not available for enrollment' }
    }

    // Check user role - free students can only enroll in free courses
    const { sessionClaims } = await auth()
    const role = sessionClaims?.metadata?.role as string

    if (role === 'free_student' && !course.isFree) {
      return {
        success: false,
        error: 'This course requires a Pro subscription'
      }
    }

    // Check if already enrolled
    const [existingEnrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.clerkId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1)

    if (existingEnrollment) {
      return { success: false, error: 'Already enrolled in this course' }
    }

    // Create enrollment
    const [newEnrollment] = await db
      .insert(courseEnrollments)
      .values({
        clerkId: userId,
        courseId,
      })
      .returning()

    revalidatePath('/dashboard/courses')
    revalidatePath(`/dashboard/courses/${courseId}`)

    return { success: true, enrollment: newEnrollment }
  } catch (error) {
    console.error('Error enrolling in course:', error)
    return { success: false, error: 'Failed to enroll in course' }
  }
}

// Unenroll from a course
export async function unenrollFromCourse(courseId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Check if enrolled
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.clerkId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1)

    if (!enrollment) {
      return { success: false, error: 'Not enrolled in this course' }
    }

    // Check if course is completed
    if (enrollment.completedAt) {
      return {
        success: false,
        error: 'Cannot unenroll from a completed course'
      }
    }

    // Delete enrollment (page progress will cascade delete)
    await db
      .delete(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.clerkId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )

    // Delete all page progress for this course
    const courseChapters = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(eq(chapters.courseId, courseId))

    if (courseChapters.length > 0) {
      const chapterIds = courseChapters.map(c => c.id)
      const coursePages = await db
        .select({ id: pages.id })
        .from(pages)
        .where(inArray(pages.chapterId, chapterIds))

      if (coursePages.length > 0) {
        const pageIds = coursePages.map(p => p.id)
        await db
          .delete(pageProgress)
          .where(
            and(
              eq(pageProgress.clerkId, userId),
              inArray(pageProgress.pageId, pageIds)
            )
          )
      }
    }

    revalidatePath('/dashboard/courses')
    revalidatePath(`/dashboard/courses/${courseId}`)

    return { success: true }
  } catch (error) {
    console.error('Error unenrolling from course:', error)
    return { success: false, error: 'Failed to unenroll from course' }
  }
}

// Get user's enrolled courses
export async function getMyEnrollments(options?: {
  includeCompleted?: boolean
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    const conditions = [eq(courseEnrollments.clerkId, userId)]

    // Filter completed courses if needed
    if (!options?.includeCompleted) {
      conditions.push(sql`${courseEnrollments.completedAt} IS NULL`)
    }

    const enrollments = await db
      .select({
        enrollment: courseEnrollments,
        course: courses,
      })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(and(...conditions))
      .orderBy(desc(courseEnrollments.enrolledAt))

    // Calculate progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async ({ enrollment, course }) => {
        const progress = await calculateCourseProgress(userId, course.id)
        return {
          enrollment,
          course,
          progress,
        }
      })
    )

    return { success: true, enrollments: enrollmentsWithProgress }
  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return { success: false, error: 'Failed to fetch enrollments', enrollments: [] }
  }
}

// Check if user is enrolled in a course
export async function checkEnrollment(courseId: string) {
  const { userId } = await auth()
  if (!userId) return { isEnrolled: false }

  try {
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.clerkId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1)

    return {
      isEnrolled: !!enrollment,
      enrollment: enrollment || null
    }
  } catch (error) {
    console.error('Error checking enrollment:', error)
    return { isEnrolled: false, enrollment: null }
  }
}

// Calculate course progress
export async function calculateCourseProgress(clerkId: string, courseId: string) {
  try {
    // Get all pages in the course
    const courseChapters = await db
      .select({ id: chapters.id })
      .from(chapters)
      .where(
        and(
          eq(chapters.courseId, courseId),
          eq(chapters.isPublished, true)
        )
      )

    if (courseChapters.length === 0) {
      return { percentage: 0, completedPages: 0, totalPages: 0 }
    }

    const chapterIds = courseChapters.map(c => c.id)
    const coursePages = await db
      .select({ id: pages.id })
      .from(pages)
      .where(inArray(pages.chapterId, chapterIds))

    const totalPages = coursePages.length

    if (totalPages === 0) {
      return { percentage: 0, completedPages: 0, totalPages: 0 }
    }

    // Get completed pages
    const pageIds = coursePages.map(p => p.id)
    const completedPages = await db
      .select({ id: pageProgress.id })
      .from(pageProgress)
      .where(
        and(
          eq(pageProgress.clerkId, clerkId),
          inArray(pageProgress.pageId, pageIds),
          eq(pageProgress.isCompleted, true)
        )
      )

    const completedCount = completedPages.length
    const percentage = Math.round((completedCount / totalPages) * 100)

    return {
      percentage,
      completedPages: completedCount,
      totalPages,
    }
  } catch (error) {
    console.error('Error calculating course progress:', error)
    return { percentage: 0, completedPages: 0, totalPages: 0 }
  }
}

// Mark course as completed
export async function markCourseComplete(courseId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Check if enrolled
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.clerkId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1)

    if (!enrollment) {
      return { success: false, error: 'Not enrolled in this course' }
    }

    // Check if already completed
    if (enrollment.completedAt) {
      return { success: false, error: 'Course already completed' }
    }

    // Verify all pages are completed
    const progress = await calculateCourseProgress(userId, courseId)
    if (progress.percentage < 100) {
      return {
        success: false,
        error: 'Complete all pages before marking course as complete'
      }
    }

    // Update enrollment
    const [updatedEnrollment] = await db
      .update(courseEnrollments)
      .set({
        completedAt: new Date(),
      })
      .where(
        and(
          eq(courseEnrollments.clerkId, userId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .returning()

    revalidatePath('/dashboard/courses')
    revalidatePath(`/dashboard/courses/${courseId}`)

    return { success: true, enrollment: updatedEnrollment }
  } catch (error) {
    console.error('Error marking course complete:', error)
    return { success: false, error: 'Failed to mark course as complete' }
  }
}

// Get course enrollment statistics (for admin/teacher)
export async function getCourseEnrollmentStats(courseId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Check permissions (admin or teacher of the course)
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role as string

  if (role !== 'admin' && role !== 'teacher') {
    throw new Error('Insufficient permissions')
  }

  try {
    // Get total enrollments
    const totalEnrollments = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId))

    // Get completed enrollments
    const completedEnrollments = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          sql`${courseEnrollments.completedAt} IS NOT NULL`
        )
      )

    // Get recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEnrollments = await db
      .select({ count: sql<number>`count(*)` })
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.courseId, courseId),
          sql`${courseEnrollments.enrolledAt} > ${thirtyDaysAgo}`
        )
      )

    return {
      success: true,
      stats: {
        total: totalEnrollments[0]?.count || 0,
        completed: completedEnrollments[0]?.count || 0,
        recent: recentEnrollments[0]?.count || 0,
        completionRate: totalEnrollments[0]?.count
          ? Math.round((completedEnrollments[0]?.count / totalEnrollments[0]?.count) * 100)
          : 0,
      }
    }
  } catch (error) {
    console.error('Error fetching enrollment stats:', error)
    return {
      success: false,
      error: 'Failed to fetch enrollment statistics',
      stats: { total: 0, completed: 0, recent: 0, completionRate: 0 }
    }
  }
}