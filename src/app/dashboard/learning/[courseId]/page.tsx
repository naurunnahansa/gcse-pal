import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCourse } from '@/lib/actions/courses'
import { getChapters } from '@/lib/actions/chapters'
import { getPages } from '@/lib/actions/pages'
import { checkEnrollment, calculateCourseProgress } from '@/lib/actions/enrollments'

export default async function LearningCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  // Check enrollment
  const { isEnrolled } = await checkEnrollment(courseId)
  if (!isEnrolled) {
    redirect(`/dashboard/courses/${courseId}`)
  }

  const courseResult = await getCourse(courseId)
  if (!courseResult.success || !courseResult.course) {
    redirect('/dashboard/courses')
  }

  const { course } = courseResult
  const chaptersResult = await getChapters(courseId)
  const chapters = chaptersResult.chapters || []

  // Calculate progress
  const progress = await calculateCourseProgress(userId, courseId)

  // Get first page of first chapter for quick start
  let firstPageUrl = null
  if (chapters.length > 0) {
    const firstChapter = chapters[0]
    const pagesResult = await getPages(firstChapter.id)
    if (pagesResult.pages && pagesResult.pages.length > 0) {
      firstPageUrl = `/dashboard/learning/${courseId}/chapter/${firstChapter.id}/page/${pagesResult.pages[0].id}`
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/my-courses"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to my courses
        </Link>
      </div>

      {/* Course Overview */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
              {course.description && (
                <p className="mt-2 text-gray-600">{course.description}</p>
              )}
            </div>
            {firstPageUrl && (
              <Link
                href={firstPageUrl}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Continue Learning →
              </Link>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">
                {progress.completedPages} of {progress.totalPages} pages completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">{progress.percentage}% complete</p>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>

          {chapters.length > 0 ? (
            <div className="space-y-4">
              {chapters.map((chapter: any, chapterIndex: number) => (
                <ChapterSection
                  key={chapter.id}
                  chapter={chapter}
                  chapterIndex={chapterIndex}
                  courseId={courseId}
                  userId={userId}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No content available yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

async function ChapterSection({
  chapter,
  chapterIndex,
  courseId,
  userId,
}: {
  chapter: any
  chapterIndex: number
  courseId: string
  userId: string
}) {
  const pagesResult = await getPages(chapter.id)
  const pages = pagesResult.pages || []

  // Get completion status for pages
  const { pageProgress } = await import('@/db/schema')
  const { db } = await import('@/db')
  const { eq, and, inArray } = await import('drizzle-orm')

  const pageIds = pages.map(p => p.id)
  const completedPages = pageIds.length > 0
    ? await db
      .select({ pageId: pageProgress.pageId })
      .from(pageProgress)
      .where(
        and(
          eq(pageProgress.clerkId, userId),
          inArray(pageProgress.pageId, pageIds),
          eq(pageProgress.isCompleted, true)
        )
      )
    : []

  const completedPageIds = new Set(completedPages.map(p => p.pageId))
  const chapterProgress = pages.length > 0
    ? Math.round((completedPageIds.size / pages.length) * 100)
    : 0

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-500">
              Chapter {chapterIndex + 1}
            </span>
            <h3 className="text-base font-medium text-gray-900">{chapter.title}</h3>
            {chapter.isFree && (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                Free
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{chapterProgress}%</span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${chapterProgress}%` }}
              />
            </div>
          </div>
        </div>
        {chapter.description && (
          <p className="mt-2 text-sm text-gray-600">{chapter.description}</p>
        )}
      </div>

      {pages.length > 0 && (
        <div className="divide-y divide-gray-200">
          {pages.map((page: any, pageIndex: number) => (
            <Link
              key={page.id}
              href={`/dashboard/learning/${courseId}/chapter/${chapter.id}/page/${page.id}`}
              className="block px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0">
                    {completedPageIds.has(page.id) ? (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                        <span className="text-green-600 text-sm">✓</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full border-2 border-gray-300">
                        <span className="text-gray-500 text-xs">{pageIndex + 1}</span>
                      </span>
                    )}
                  </span>
                  <span className={`text-sm ${completedPageIds.has(page.id) ? 'text-gray-600' : 'text-gray-900'}`}>
                    {page.title}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
                    {page.pageType}
                  </span>
                </div>
                <span className="text-sm text-indigo-600 hover:text-indigo-500">
                  {completedPageIds.has(page.id) ? 'Review' : 'Start'} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}