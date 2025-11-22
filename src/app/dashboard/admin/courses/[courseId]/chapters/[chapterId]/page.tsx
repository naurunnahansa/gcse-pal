import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getChapter, updateChapter } from '@/lib/actions/chapters'
import { createPage, deletePage, updatePage, getPage } from '@/lib/actions/pages'

async function PageItem({
  page,
  courseId,
  chapterId,
}: {
  page: any
  courseId: string
  chapterId: string
}) {
  async function handleDelete() {
    'use server'
    await deletePage(page.id)
    redirect(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`)
  }

  return (
    <li className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">#{page.orderIndex + 1}</span>
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {page.title}
          </h4>
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            {page.pageType}
          </span>
        </div>
      </div>
      <div className="flex space-x-2">
        <Link
          href={`/dashboard/admin/courses/${courseId}/chapters/${chapterId}/pages/${page.id}`}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </Link>
        <form action={handleDelete}>
          <button
            type="submit"
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </form>
      </div>
    </li>
  )
}

export default async function ChapterEditPage({
  params,
}: {
  params: Promise<{ courseId: string; chapterId: string }>
}) {
  const { courseId, chapterId } = await params
  const result = await getChapter(chapterId)

  if (!result.success || !result.chapter) {
    redirect(`/dashboard/admin/courses/${courseId}`)
  }

  const { chapter, pages } = result

  async function handleUpdateChapter(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const isFree = formData.get('isFree') === 'on'

    await updateChapter(chapterId, {
      title,
      description,
      isFree,
    })

    redirect(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`)
  }

  async function handleCreatePage(formData: FormData) {
    'use server'

    const title = formData.get('pageTitle') as string
    const pageType = formData.get('pageType') as 'markdown' | 'video' | 'quiz'
    const content = formData.get('content') as string

    await createPage({
      chapterId: chapterId,
      title,
      pageType,
      content: pageType === 'markdown' ? content : undefined,
    })

    redirect(`/dashboard/admin/courses/${courseId}/chapters/${chapterId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/dashboard/admin/courses/${courseId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to course
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Chapter Details
          </h2>

          <form action={handleUpdateChapter} className="space-y-4">
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
                defaultValue={chapter.title}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                defaultValue={chapter.description || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFree"
                id="isFree"
                defaultChecked={chapter.isFree}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isFree"
                className="ml-2 block text-sm text-gray-900"
              >
                Free preview chapter
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pages Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pages</h2>

          {/* Page List */}
          {pages && pages.length > 0 ? (
            <ul className="border rounded-lg divide-y divide-gray-200 mb-4">
              {pages.map((page: any) => (
                <PageItem
                  key={page.id}
                  page={page}
                  courseId={courseId}
                  chapterId={chapterId}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              No pages yet. Add your first page below.
            </p>
          )}

          {/* Add Page Form */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Add New Page
            </h3>
            <form action={handleCreatePage} className="space-y-3">
              <div className="flex space-x-3">
                <input
                  type="text"
                  name="pageTitle"
                  placeholder="Page title"
                  required
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <select
                  name="pageType"
                  className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                  required
                >
                  <option value="markdown">Markdown</option>
                  <option value="video">Video</option>
                  <option value="quiz">Quiz</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Initial Content (for Markdown pages)
                </label>
                <textarea
                  name="content"
                  id="content"
                  rows={4}
                  placeholder="Enter markdown content..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Add Page
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}