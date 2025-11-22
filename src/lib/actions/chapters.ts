'use server'

import { db } from '@/db'
import { chapters, courses, pages, teacherCourseAssignments } from '@/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and, desc, asc, max, count, sql, gt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Types
export type Chapter = typeof chapters.$inferSelect
export type NewChapter = typeof chapters.$inferInsert

// Helper function to check if user has access to manage course
async function checkCourseAccess(clerkId: string, courseId: string) {
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role as string

  if (role === 'admin') return true

  if (role === 'teacher') {
    // Check if teacher created the course or is assigned to it
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (course?.createdByClerkId === clerkId) return true

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

// Create a new chapter
export async function createChapter(data: {
  courseId: string
  title: string
  description?: string
  isFree?: boolean
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkCourseAccess(userId, data.courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Get the highest order index for existing chapters
    const [maxOrderResult] = await db
      .select({ maxOrder: max(chapters.orderIndex) })
      .from(chapters)
      .where(eq(chapters.courseId, data.courseId))

    const nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1

    const [newChapter] = await db
      .insert(chapters)
      .values({
        ...data,
        orderIndex: nextOrder,
        isPublished: false,
      })
      .returning()

    revalidatePath(`/dashboard/admin/courses/${data.courseId}`)
    return { success: true, chapter: newChapter }
  } catch (error) {
    console.error('Error creating chapter:', error)
    return { success: false, error: 'Failed to create chapter' }
  }
}

// Get all chapters for a course
export async function getChapters(courseId: string) {
  try {
    const chapterList = await db
      .select()
      .from(chapters)
      .where(eq(chapters.courseId, courseId))
      .orderBy(asc(chapters.orderIndex))

    // Get page count for each chapter
    const chaptersWithPageCount = await Promise.all(
      chapterList.map(async (chapter) => {
        const [pageCount] = await db
          .select({ count: count() })
          .from(pages)
          .where(eq(pages.chapterId, chapter.id))

        return {
          ...chapter,
          pageCount: Number(pageCount?.count || 0),
        }
      })
    )

    return { success: true, chapters: chaptersWithPageCount }
  } catch (error) {
    console.error('Error fetching chapters:', error)
    return { success: false, error: 'Failed to fetch chapters', chapters: [] }
  }
}

// Get a single chapter
export async function getChapter(chapterId: string) {
  try {
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1)

    if (!chapter) {
      return { success: false, error: 'Chapter not found' }
    }

    // Get pages for this chapter
    const chapterPages = await db
      .select()
      .from(pages)
      .where(eq(pages.chapterId, chapterId))
      .orderBy(asc(pages.orderIndex))

    return {
      success: true,
      chapter,
      pages: chapterPages
    }
  } catch (error) {
    console.error('Error fetching chapter:', error)
    return { success: false, error: 'Failed to fetch chapter' }
  }
}

// Update a chapter
export async function updateChapter(
  chapterId: string,
  data: Partial<{
    title: string
    description: string
    isFree: boolean
    isPublished: boolean
  }>
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get the chapter to find the course ID
  const [chapter] = await db
    .select({ courseId: chapters.courseId })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1)

  if (!chapter) throw new Error('Chapter not found')

  const hasAccess = await checkCourseAccess(userId, chapter.courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    const [updatedChapter] = await db
      .update(chapters)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId))
      .returning()

    revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    return { success: true, chapter: updatedChapter }
  } catch (error) {
    console.error('Error updating chapter:', error)
    return { success: false, error: 'Failed to update chapter' }
  }
}

// Delete a chapter
export async function deleteChapter(chapterId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get the chapter to find the course ID
  const [chapter] = await db
    .select({ courseId: chapters.courseId, orderIndex: chapters.orderIndex })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1)

  if (!chapter) throw new Error('Chapter not found')

  const hasAccess = await checkCourseAccess(userId, chapter.courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Delete the chapter (pages will cascade)
    await db.delete(chapters).where(eq(chapters.id, chapterId))

    // Update order indices for remaining chapters
    await db
      .update(chapters)
      .set({
        orderIndex: sql`${chapters.orderIndex} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(chapters.courseId, chapter.courseId),
          gt(chapters.orderIndex, chapter.orderIndex)
        )
      )

    revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting chapter:', error)
    return { success: false, error: 'Failed to delete chapter' }
  }
}

// Reorder chapters
export async function reorderChapters(
  courseId: string,
  chapterIds: string[]
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkCourseAccess(userId, courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Update each chapter's order index
    const updatePromises = chapterIds.map((chapterId, index) =>
      db
        .update(chapters)
        .set({
          orderIndex: index,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(chapters.id, chapterId),
            eq(chapters.courseId, courseId)
          )
        )
    )

    await Promise.all(updatePromises)

    revalidatePath(`/dashboard/admin/courses/${courseId}`)
    return { success: true }
  } catch (error) {
    console.error('Error reordering chapters:', error)
    return { success: false, error: 'Failed to reorder chapters' }
  }
}

// Toggle chapter publish status
export async function toggleChapterPublishStatus(chapterId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const [chapter] = await db
    .select({
      courseId: chapters.courseId,
      isPublished: chapters.isPublished
    })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1)

  if (!chapter) throw new Error('Chapter not found')

  const hasAccess = await checkCourseAccess(userId, chapter.courseId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Before publishing, check if chapter has at least one page
    if (!chapter.isPublished) {
      const pagesCount = await db
        .select({ id: pages.id })
        .from(pages)
        .where(eq(pages.chapterId, chapterId))
        .limit(1)

      if (pagesCount.length === 0) {
        return {
          success: false,
          error: 'Chapter must have at least one page before publishing'
        }
      }
    }

    const [updatedChapter] = await db
      .update(chapters)
      .set({
        isPublished: !chapter.isPublished,
        updatedAt: new Date(),
      })
      .where(eq(chapters.id, chapterId))
      .returning()

    revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    return { success: true, chapter: updatedChapter }
  } catch (error) {
    console.error('Error toggling chapter publish status:', error)
    return { success: false, error: 'Failed to update chapter status' }
  }
}