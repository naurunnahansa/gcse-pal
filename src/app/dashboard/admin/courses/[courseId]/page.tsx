import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCourse, updateCourse } from '@/lib/actions/courses'
import { createChapter, deleteChapter, toggleChapterPublishStatus } from '@/lib/actions/chapters'

async function ChapterItem({
  chapter,
  courseId,
}: {
  chapter: any
  courseId: string
}) {
  async function handleDelete() {
    'use server'
    await deleteChapter(chapter.id)
    revalidatePath(`/dashboard/admin/courses/${courseId}`)
  }

  async function handleTogglePublish() {
    'use server'
    await toggleChapterPublishStatus(chapter.id)
    revalidatePath(`/dashboard/admin/courses/${courseId}`)
  }

  return (
    <li className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">#{chapter.orderIndex + 1}</span>
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {chapter.title}
          </h4>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${chapter.isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
              }`}
          >
            {chapter.isPublished ? 'Published' : 'Draft'}
          </span>
          {chapter.isFree && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              Free Preview
            </span>
          )}
        </div>
        {chapter.description && (
          <p className="mt-1 text-xs text-gray-600">{chapter.description}</p>
        )}
      </div>
      <div className="flex space-x-2">
        <Link
          href={`/dashboard/admin/courses/${courseId}/chapters/${chapter.id}`}
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Edit
        </Link>
        <form action={handleTogglePublish}>
          <button
            type="submit"
            className={`px-2 py-1 text-xs rounded ${chapter.isPublished
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-green-500 text-white hover:bg-green-600'
              }`}
          >
            {chapter.isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </form>
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

export default async function CourseEditPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const result = await getCourse(courseId)

  if (!result.success || !result.course) {
    redirect('/dashboard/admin/courses')
  }

  const { course, chapters } = result

  async function handleUpdateCourse(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const isFree = formData.get('isFree') === 'on'

    await updateCourse(courseId, {
      title,
      description,
      isFree,
    })

    revalidatePath(`/dashboard/admin/courses/${courseId}`)
  }

  async function handleCreateChapter(formData: FormData) {
    'use server'

    const title = formData.get('chapterTitle') as string
    const description = formData.get('chapterDescription') as string
    const isFree = formData.get('chapterIsFree') === 'on'

    await createChapter({
      courseId: courseId,
      title,
      description,
      isFree,
    })

    revalidatePath(`/dashboard/admin/courses/${courseId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/admin/courses"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to courses
        </Link>
        <Link
          href={`/dashboard/admin/courses/${courseId}/stats`}
          className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          View Statistics
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Course Details
          </h2>

          <form action={handleUpdateCourse} className="space-y-4">
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
                defaultValue={course.title}
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
                defaultValue={course.description || ''}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFree"
                id="isFree"
                defaultChecked={course.isFree}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isFree"
                className="ml-2 block text-sm text-gray-900"
              >
                Free course
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

      {/* Chapters Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Chapters
          </h2>

          {/* Chapter List */}
          {chapters && chapters.length > 0 ? (
            <ul className="border rounded-lg divide-y divide-gray-200 mb-4">
              {chapters.map((chapter: any) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  courseId={courseId}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-4">
              No chapters yet. Add your first chapter below.
            </p>
          )}

          {/* Add Chapter Form */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Add New Chapter
            </h3>
            <form action={handleCreateChapter} className="space-y-3">
              <div className="flex space-x-3">
                <input
                  type="text"
                  name="chapterTitle"
                  placeholder="Chapter title"
                  required
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <input
                  type="text"
                  name="chapterDescription"
                  placeholder="Description (optional)"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="chapterIsFree"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm text-gray-700">Free preview</span>
                </label>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Add Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}