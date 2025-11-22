'use server'

import { db } from '@/db'
import { courses, courseEnrollments, chapters, pages, teacherCourseAssignments } from '@/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc, asc, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Types
export type Course = typeof courses.$inferSelect
export type NewCourse = typeof courses.$inferInsert

// Helper function to check if user is admin or teacher
async function checkAdminOrTeacherAccess(clerkId: string, courseId?: string) {
  // For now, we'll do a simple role check.
  // In production, you'd check against the users table or Clerk metadata
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role as string

  if (role === 'admin') return true

  if (role === 'teacher' && courseId) {
    // Check if teacher is assigned to this course
    const assignment = await db
      .select()
      .from(teacherCourseAssignments)
      .where(
        and(
          eq(teacherCourseAssignments.teacherClerkId, clerkId),
          eq(teacherCourseAssignments.courseId, courseId)
        )
      )
      .limit(1)

    return assignment.length > 0
  }

  return false
}

// Create a new course
export async function createCourse(data: {
  title: string
  description?: string
  thumbnailUrl?: string
  isFree?: boolean
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkAdminOrTeacherAccess(userId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    const [newCourse] = await db
      .insert(courses)
      .values({
        ...data,
        createdByClerkId: userId,
        isPublished: false,
      })
      .returning()

    // If teacher creates course, assign them to it
    const { sessionClaims } = await auth()
    const role = sessionClaims?.metadata?.role as string
    if (role === 'teacher') {
      await db.insert(teacherCourseAssignments).values({
        teacherClerkId: userId,
        courseId: newCourse.id,
      })
    }

    revalidatePath('/dashboard/admin/courses')
    return { success: true, course: newCourse }
  } catch (error) {
    console.error('Error creating course:', error)
    return { success: false, error: 'Failed to create course' }
  }
}

// Get all courses (with filtering based on role)
export async function getCourses(options?: {
  onlyPublished?: boolean
  onlyMyCourses?: boolean
}) {
  const { userId } = await auth()

  try {
    const conditions = []

    // Filter by published status
    if (options?.onlyPublished) {
      conditions.push(eq(courses.isPublished, true))
    }

    // Filter by creator/teacher assignment
    if (options?.onlyMyCourses && userId) {
      const { sessionClaims } = await auth()
      const role = sessionClaims?.metadata?.role as string

      if (role === 'teacher') {
        // Get courses created by teacher or assigned to them
        const assignments = await db
          .select({ courseId: teacherCourseAssignments.courseId })
          .from(teacherCourseAssignments)
          .where(eq(teacherCourseAssignments.teacherClerkId, userId))

        const assignedCourseIds = assignments.map(a => a.courseId)

        if (assignedCourseIds.length > 0) {
          conditions.push(
            or(
              eq(courses.createdByClerkId, userId),
              ...assignedCourseIds.map(id => eq(courses.id, id))
            )
          )
        } else {
          conditions.push(eq(courses.createdByClerkId, userId))
        }
      }
    }

    const courseList = await db
      .select()
      .from(courses)
      .where(and(...conditions))
      .orderBy(desc(courses.createdAt))

    return { success: true, courses: courseList }
  } catch (error) {
    console.error('Error fetching courses:', error)
    return { success: false, error: 'Failed to fetch courses', courses: [] }
  }
}

// Get a single course by ID
export async function getCourse(courseId: string) {
  try {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    // Get chapters for this course
    const courseChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, courseId))
      .orderBy(asc(chapters.orderIndex))

    return {
      success: true,
      course,
      chapters: courseChapters
    }
  } catch (error) {
    console.error('Error fetching course:', error)
    return { success: false, error: 'Failed to fetch course' }
  }
}

// Update a course
export async function updateCourse(
  courseId: string,
  data: Partial<{
    title: string
    description: string
    thumbnailUrl: string
    isFree: boolean
    isPublished: boolean
  }>
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkAdminOrTeacherAccess(userId, courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    const [updatedCourse] = await db
      .update(courses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId))
      .returning()

    revalidatePath('/dashboard/admin/courses')
    revalidatePath(`/dashboard/admin/courses/${courseId}`)

    return { success: true, course: updatedCourse }
  } catch (error) {
    console.error('Error updating course:', error)
    return { success: false, error: 'Failed to update course' }
  }
}

// Delete a course
export async function deleteCourse(courseId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkAdminOrTeacherAccess(userId, courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Check if there are any enrollments
    const enrollments = await db
      .select()
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, courseId))
      .limit(1)

    if (enrollments.length > 0) {
      return {
        success: false,
        error: 'Cannot delete course with active enrollments'
      }
    }

    // Delete the course (chapters and pages will cascade)
    await db.delete(courses).where(eq(courses.id, courseId))

    revalidatePath('/dashboard/admin/courses')

    return { success: true }
  } catch (error) {
    console.error('Error deleting course:', error)
    return { success: false, error: 'Failed to delete course' }
  }
}

// Publish/Unpublish a course
export async function toggleCoursePublishStatus(courseId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkAdminOrTeacherAccess(userId, courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Get current status
    const [course] = await db
      .select({ isPublished: courses.isPublished })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      return { success: false, error: 'Course not found' }
    }

    // Before publishing, check if course has at least one chapter with one page
    if (!course.isPublished) {
      const courseChapters = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.courseId, courseId))

      if (courseChapters.length === 0) {
        return {
          success: false,
          error: 'Course must have at least one chapter before publishing'
        }
      }

      // Check if at least one chapter has pages
      const pagesCount = await db
        .select({ id: pages.id })
        .from(pages)
        .where(eq(pages.chapterId, courseChapters[0].id))
        .limit(1)

      if (pagesCount.length === 0) {
        return {
          success: false,
          error: 'Course must have at least one page before publishing'
        }
      }
    }

    // Toggle status
    const [updatedCourse] = await db
      .update(courses)
      .set({
        isPublished: !course.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId))
      .returning()

    revalidatePath('/dashboard/admin/courses')
    revalidatePath(`/dashboard/admin/courses/${courseId}`)

    return { success: true, course: updatedCourse }
  } catch (error) {
    console.error('Error toggling course publish status:', error)
    return { success: false, error: 'Failed to update course status' }
  }
}