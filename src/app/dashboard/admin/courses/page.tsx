import Link from 'next/link'
import { getCourses, deleteCourse, toggleCoursePublishStatus } from '@/lib/actions/courses'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/auth'

async function CourseActions({ courseId, isPublished }: { courseId: string; isPublished: boolean }) {
  async function handleDelete() {
    'use server'
    await deleteCourse(courseId)
    revalidatePath('/dashboard/admin/courses')
  }

  async function handleTogglePublish() {
    'use server'
    await toggleCoursePublishStatus(courseId)
    revalidatePath('/dashboard/admin/courses')
  }

  return (
    <div className="flex space-x-2">
      <Link
        href={`/dashboard/admin/courses/${courseId}`}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Edit
      </Link>
      <form action={handleTogglePublish}>
        <button
          type="submit"
          className={`px-3 py-1 text-sm rounded ${isPublished
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-green-500 text-white hover:bg-green-600'
            }`}
        >
          {isPublished ? 'Unpublish' : 'Publish'}
        </button>
      </form>
      <form action={handleDelete}>
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          Delete
        </button>
      </form>
    </div>
  )
}

export default async function CoursesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  const isTeacher = role === 'teacher'

  const result = await getCourses({
    onlyMyCourses: isTeacher,
  })

  const courses = result.courses || []

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Courses</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your courses, chapters, and content
          </p>
        </div>
        <Link
          href="/dashboard/admin/courses/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses yet.</p>
          <Link
            href="/dashboard/admin/courses/new"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Create your first course
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {courses.map((course) => (
              <li key={course.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {course.title}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${course.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                      {course.isFree && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Free
                        </span>
                      )}
                    </div>
                    {course.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <CourseActions courseId={course.id} isPublished={course.isPublished} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}