'use server'

import { db } from '@/db'
import { pages, chapters, courses, markdownContent, pageProgress, teacherCourseAssignments } from '@/db/schema'
import { auth } from '@clerk/nextjs/server'
import { eq, and, asc, max, sql, gt } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Types
export type Page = typeof pages.$inferSelect
export type NewPage = typeof pages.$inferInsert
export type MarkdownContent = typeof markdownContent.$inferSelect

// Helper function to check if user has access to manage course
async function checkCourseAccessByChapter(clerkId: string, chapterId: string) {
  const { sessionClaims } = await auth()
  const role = sessionClaims?.metadata?.role as string

  if (role === 'admin') return true

  // Get the course ID from the chapter
  const [chapter] = await db
    .select({ courseId: chapters.courseId })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1)

  if (!chapter) return false

  if (role === 'teacher') {
    // Check if teacher created the course or is assigned to it
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, chapter.courseId))
      .limit(1)

    if (course?.createdByClerkId === clerkId) return true

    const assignment = await db
      .select()
      .from(teacherCourseAssignments)
      .where(
        and(
          eq(teacherCourseAssignments.teacherClerkId, clerkId),
          eq(teacherCourseAssignments.courseId, chapter.courseId)
        )
      )
      .limit(1)

    return assignment.length > 0
  }

  return false
}

// Create a new page
export async function createPage(data: {
  chapterId: string
  title: string
  pageType: 'markdown' | 'video' | 'quiz'
  content?: string // For markdown pages
}) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkCourseAccessByChapter(userId, data.chapterId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Get the highest order index for existing pages
    const [maxOrderResult] = await db
      .select({ maxOrder: max(pages.orderIndex) })
      .from(pages)
      .where(eq(pages.chapterId, data.chapterId))

    const nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1

    // Start a transaction
    const [newPage] = await db
      .insert(pages)
      .values({
        chapterId: data.chapterId,
        title: data.title,
        pageType: data.pageType,
        orderIndex: nextOrder,
      })
      .returning()

    // If it's a markdown page and content is provided, create the content
    if (data.pageType === 'markdown' && data.content !== undefined) {
      await db.insert(markdownContent).values({
        pageId: newPage.id,
        content: data.content || '',
      })
    }

    // Get chapter to find course for revalidation
    const [chapter] = await db
      .select({ courseId: chapters.courseId })
      .from(chapters)
      .where(eq(chapters.id, data.chapterId))
      .limit(1)

    if (chapter) {
      revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    }

    return { success: true, page: newPage }
  } catch (error) {
    console.error('Error creating page:', error)
    return { success: false, error: 'Failed to create page' }
  }
}

// Get all pages for a chapter
export async function getPages(chapterId: string) {
  try {
    const pageList = await db
      .select()
      .from(pages)
      .where(eq(pages.chapterId, chapterId))
      .orderBy(asc(pages.orderIndex))

    return { success: true, pages: pageList }
  } catch (error) {
    console.error('Error fetching pages:', error)
    return { success: false, error: 'Failed to fetch pages', pages: [] }
  }
}

// Get a single page with its content
export async function getPage(pageId: string) {
  try {
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1)

    if (!page) {
      return { success: false, error: 'Page not found' }
    }

    // Get markdown content if it's a markdown page
    let content = null
    if (page.pageType === 'markdown') {
      const [markdownData] = await db
        .select()
        .from(markdownContent)
        .where(eq(markdownContent.pageId, pageId))
        .limit(1)

      content = markdownData
    }

    return {
      success: true,
      page,
      content,
      markdownContent: content // Add alias for consistency
    }
  } catch (error) {
    console.error('Error fetching page:', error)
    return { success: false, error: 'Failed to fetch page' }
  }
}

// Update only markdown content
export async function updateMarkdownContent(pageId: string, content: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get the page to verify it's a markdown page
  const [page] = await db
    .select({ chapterId: pages.chapterId, pageType: pages.pageType })
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)

  if (!page) throw new Error('Page not found')
  if (page.pageType !== 'markdown') throw new Error('Page is not a markdown page')

  const hasAccess = await checkCourseAccessByChapter(userId, page.chapterId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Check if content exists
    const [existingContent] = await db
      .select({ id: markdownContent.id })
      .from(markdownContent)
      .where(eq(markdownContent.pageId, pageId))
      .limit(1)

    if (existingContent) {
      // Update existing content
      await db
        .update(markdownContent)
        .set({
          content,
          updatedAt: new Date(),
        })
        .where(eq(markdownContent.pageId, pageId))
    } else {
      // Create new content
      await db.insert(markdownContent).values({
        pageId,
        content,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating markdown content:', error)
    return { success: false, error: 'Failed to update content' }
  }
}

// Update a page
export async function updatePage(
  pageId: string,
  data: Partial<{
    title: string
    content: string // For markdown pages
  }>
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get the page to find the chapter ID
  const [page] = await db
    .select({ chapterId: pages.chapterId, pageType: pages.pageType })
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)

  if (!page) throw new Error('Page not found')

  const hasAccess = await checkCourseAccessByChapter(userId, page.chapterId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Update page title if provided
    if (data.title) {
      await db
        .update(pages)
        .set({
          title: data.title,
          updatedAt: new Date(),
        })
        .where(eq(pages.id, pageId))
    }

    // Update markdown content if provided and it's a markdown page
    if (data.content !== undefined && page.pageType === 'markdown') {
      // Check if content exists
      const [existingContent] = await db
        .select({ id: markdownContent.id })
        .from(markdownContent)
        .where(eq(markdownContent.pageId, pageId))
        .limit(1)

      if (existingContent) {
        // Update existing content
        await db
          .update(markdownContent)
          .set({
            content: data.content,
            updatedAt: new Date(),
          })
          .where(eq(markdownContent.pageId, pageId))
      } else {
        // Create new content
        await db.insert(markdownContent).values({
          pageId: pageId,
          content: data.content,
        })
      }
    }

    // Get chapter to find course for revalidation
    const [chapter] = await db
      .select({ courseId: chapters.courseId })
      .from(chapters)
      .where(eq(chapters.id, page.chapterId))
      .limit(1)

    if (chapter) {
      revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating page:', error)
    return { success: false, error: 'Failed to update page' }
  }
}

// Delete a page
export async function deletePage(pageId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  // Get the page to find the chapter ID
  const [page] = await db
    .select({ chapterId: pages.chapterId, orderIndex: pages.orderIndex })
    .from(pages)
    .where(eq(pages.id, pageId))
    .limit(1)

  if (!page) throw new Error('Page not found')

  const hasAccess = await checkCourseAccessByChapter(userId, page.chapterId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Delete the page (markdown content will cascade)
    await db.delete(pages).where(eq(pages.id, pageId))

    // Update order indices for remaining pages
    await db
      .update(pages)
      .set({
        orderIndex: sql`${pages.orderIndex} - 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(pages.chapterId, page.chapterId),
          gt(pages.orderIndex, page.orderIndex)
        )
      )

    // Get chapter to find course for revalidation
    const [chapter] = await db
      .select({ courseId: chapters.courseId })
      .from(chapters)
      .where(eq(chapters.id, page.chapterId))
      .limit(1)

    if (chapter) {
      revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting page:', error)
    return { success: false, error: 'Failed to delete page' }
  }
}

// Reorder pages
export async function reorderPages(
  chapterId: string,
  pageIds: string[]
) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const hasAccess = await checkCourseAccessByChapter(userId, chapterId)
  if (!hasAccess) throw new Error('Insufficient permissions')

  try {
    // Update each page's order index
    const updatePromises = pageIds.map((pageId, index) =>
      db
        .update(pages)
        .set({
          orderIndex: index,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pages.id, pageId),
            eq(pages.chapterId, chapterId)
          )
        )
    )

    await Promise.all(updatePromises)

    // Get chapter to find course for revalidation
    const [chapter] = await db
      .select({ courseId: chapters.courseId })
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1)

    if (chapter) {
      revalidatePath(`/dashboard/admin/courses/${chapter.courseId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error reordering pages:', error)
    return { success: false, error: 'Failed to reorder pages' }
  }
}

// Mark page as completed (for students)
export async function markPageComplete(pageId: string, isCompleted: boolean) {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  try {
    // Check if progress record exists
    const [existingProgress] = await db
      .select()
      .from(pageProgress)
      .where(
        and(
          eq(pageProgress.clerkId, userId),
          eq(pageProgress.pageId, pageId)
        )
      )
      .limit(1)

    if (existingProgress) {
      // Update existing progress
      await db
        .update(pageProgress)
        .set({
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        })
        .where(
          and(
            eq(pageProgress.clerkId, userId),
            eq(pageProgress.pageId, pageId)
          )
        )
    } else {
      // Create new progress record
      await db.insert(pageProgress).values({
        clerkId: userId,
        pageId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating page progress:', error)
    return { success: false, error: 'Failed to update progress' }
  }
}