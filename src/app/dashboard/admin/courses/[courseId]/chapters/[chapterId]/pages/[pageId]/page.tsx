import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getPage, updatePage, updateMarkdownContent } from '@/lib/actions/pages'
import { getChapter } from '@/lib/actions/chapters'

export default async function PageEditPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string; pageId: string }>
}) {
  const { courseId, chapterId, pageId } = await params
  const result = await getPage(pageId)
  const chapterResult = await getChapter(chapterId)

  if (!result.success || !result.page) {
    redirect(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`)
  }

  const { page, markdownContent } = result
  const chapter = chapterResult.chapter

  async function handleUpdatePage(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const pageContent = formData.get('content') as string

    await updatePage(pageId, {
      title,
    })

    // Update markdown content separately if it's a markdown page
    if (page.pageType === 'markdown' && pageContent) {
      await updateMarkdownContent(pageId, pageContent)
    }

    revalidatePath(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`)
    revalidatePath(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}/pages/${pageId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 space-y-2">
        <Link
          href={`/dashboard/admin/courses/${courseId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to course
        </Link>
        <div>
          <Link
            href={`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to chapter: {chapter?.title || 'Chapter'}
          </Link>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Edit Page
          </h2>

          <form action={handleUpdatePage} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                defaultValue={page.title}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page Type
              </label>
              <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                {page.pageType}
              </span>
            </div>

            {page.pageType === 'markdown' && (
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700"
                >
                  Content (Markdown)
                </label>
                <textarea
                  name="content"
                  id="content"
                  rows={20}
                  defaultValue={markdownContent?.content || ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border font-mono"
                  placeholder="# Welcome to the lesson

Write your content in markdown format...

## Section 1
- Point 1
- Point 2

**Bold text** and *italic text*

```javascript
// Code blocks are supported
console.log('Hello, LMS!')
```"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Supports markdown formatting: headers, lists, bold, italic, code blocks, etc.
                </p>
              </div>
            )}

            {page.pageType === 'video' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Video integration will be available in Phase 3 (Mux Integration)
                </p>
              </div>
            )}

            {page.pageType === 'quiz' && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Quiz functionality will be available in Phase 6
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <Link
                href={`/dashboard/learning/${courseId}/chapter/${chapterId}/page/${pageId}`}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Preview as Student
              </Link>
              <div className="space-x-3">
                <Link
                  href={`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}