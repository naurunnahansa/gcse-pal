import { createCourse } from '@/lib/actions/courses'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default function NewCoursePage() {
  async function handleCreateCourse(formData: FormData) {
    'use server'

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const isFree = formData.get('isFree') === 'on'

    const result = await createCourse({
      title,
      description,
      isFree,
    })

    if (result.success && result.course) {
      redirect(`/dashboard/admin/courses/${result.course.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/courses"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to courses
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Create New Course
          </h1>

          <form action={handleCreateCourse} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Course Title *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g., Introduction to Web Development"
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
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                placeholder="Provide a brief description of what students will learn..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFree"
                id="isFree"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="isFree"
                className="ml-2 block text-sm text-gray-900"
              >
                Make this course free for all students
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/admin/courses"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Course
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}