import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCourse } from '@/lib/actions/courses'
import { getChapter } from '@/lib/actions/chapters'
import { getPage, markPageComplete } from '@/lib/actions/pages'
import { getPages } from '@/lib/actions/pages'
import { checkEnrollment } from '@/lib/actions/enrollments'
import { db } from '@/db'
import { pageProgress } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

async function MarkCompleteButton({
  pageId,
  isCompleted,
}: {
  pageId: string
  isCompleted: boolean
}) {
  async function handleToggleComplete() {
    'use server'
    await markPageComplete(pageId, !isCompleted)
  }

  return (
    <form action={handleToggleComplete}>
      <button
        type="submit"
        className={`px-4 py-2 text-sm font-medium rounded-md ${isCompleted
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-green-600 text-white hover:bg-green-700'
          }`}
      >
        {isCompleted ? 'Mark as Incomplete' : 'Mark as Complete'}
      </button>
    </form>
  )
}

export default async function PageViewerPage({
  params,
}: {
  params: Promise<{
    courseId: string
    chapterId: string
    pageId: string
  }>
}) {
  const { courseId, chapterId, pageId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Check enrollment
  const { isEnrolled } = await checkEnrollment(courseId)
  if (!isEnrolled) {
    redirect(`/dashboard/courses/${courseId}`)
  }

  // Get course, chapter, and page data
  const courseResult = await getCourse(courseId)
  const chapterResult = await getChapter(chapterId)
  const pageResult = await getPage(pageId)

  if (!courseResult.success || !courseResult.course ||
    !chapterResult.success || !chapterResult.chapter ||
    !pageResult.success || !pageResult.page) {
    redirect(`/dashboard/learning/${courseId}`)
  }

  const { course } = courseResult
  const { chapter } = chapterResult
  const { page, content } = pageResult

  // Get all pages in chapter for navigation
  const pagesResult = await getPages(chapterId)
  const pages = pagesResult.pages || []
  const currentIndex = pages.findIndex(p => p.id === pageId)
  const previousPage = currentIndex > 0 ? pages[currentIndex - 1] : null
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null

  // Check if page is completed
  const [progress] = await db
    .select()
    .from(pageProgress)
    .where(
      and(
        eq(pageProgress.clerkId, userId),
        eq(pageProgress.pageId, pageId)
      )
    )
    .limit(1)

  const isCompleted = progress?.isCompleted || false

  // Format markdown content for display
  function renderMarkdownAsHtml(markdown: string) {
    // Very basic markdown to HTML conversion
    // In production, use a proper markdown parser like react-markdown
    return markdown
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded p-4 my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^- (.+)$/gm, '<li class="ml-6 mb-1">• $1</li>')
      .replace(/(<li.*<\/li>\n?)+/g, '<ul class="my-4">$&</ul>')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/dashboard/learning/${courseId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to course
        </Link>
        <div className="text-sm text-gray-500">
          Page {currentIndex + 1} of {pages.length}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">
              {course.title} / Chapter: {chapter.title}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
            <div className="mt-2 flex items-center space-x-3">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                {page.pageType}
              </span>
              {isCompleted && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                  ✓ Completed
                </span>
              )}
            </div>
          </div>

          {/* Content Display */}
          <div className="prose max-w-none">
            {page.pageType === 'markdown' && content ? (
              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: `<p class="mb-4">${renderMarkdownAsHtml(content.content)}</p>`
                }}
              />
            ) : page.pageType === 'video' ? (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  Video content will be available after Mux integration (Phase 3)
                </p>
              </div>
            ) : page.pageType === 'quiz' ? (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  Quiz functionality will be available in Phase 6
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                <p className="text-gray-600">No content available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation and Progress Controls */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {previousPage ? (
                <Link
                  href={`/dashboard/learning/${courseId}/chapter/${chapterId}/page/${previousPage.id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ← Previous
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
                >
                  ← Previous
                </button>
              )}
            </div>

            <MarkCompleteButton pageId={pageId} isCompleted={isCompleted} />

            <div className="flex items-center space-x-3">
              {nextPage ? (
                <Link
                  href={`/dashboard/learning/${courseId}/chapter/${chapterId}/page/${nextPage.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Next →
                </Link>
              ) : (
                <Link
                  href={`/dashboard/learning/${courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Back to Course
                </Link>
              )}
            </div>
          </div>

          {/* Progress Hint */}
          {!isCompleted && (
            <p className="mt-4 text-center text-sm text-gray-500">
              Mark this page as complete to track your progress
            </p>
          )}
        </div>
      </div>
    </div>
  )
}