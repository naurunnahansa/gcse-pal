import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getMyEnrollments, unenrollFromCourse } from '@/lib/actions/enrollments'

async function UnenrollButton({ courseId }: { courseId: string }) {
  async function handleUnenroll() {
    'use server'
    await unenrollFromCourse(courseId)
    redirect('/dashboard/my-courses')
  }

  return (
    <form action={handleUnenroll}>
      <button
        type="submit"
        className="text-sm text-red-600 hover:text-red-500"
      >
        Unenroll
      </button>
    </form>
  )
}

export default async function MyCoursesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const result = await getMyEnrollments({ includeCompleted: true })
  const enrollments = result.enrollments || []

  const activeEnrollments = enrollments.filter(e => !e.enrollment.completedAt)
  const completedEnrollments = enrollments.filter(e => e.enrollment.completedAt)

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Courses</h1>
        <p className="mt-1 text-sm text-gray-600">
          Track your learning progress and continue where you left off
        </p>
      </div>

      {/* Active Courses */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          In Progress ({activeEnrollments.length})
        </h2>

        {activeEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeEnrollments.map(({ enrollment, course, progress }) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {course.title}
                    </h3>
                    {course.isFree ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Free
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Pro
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {progress.completedPages}/{progress.totalPages} pages
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {progress.percentage}% complete
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <Link
                      href={`/dashboard/learning/${course.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Continue Learning →
                    </Link>
                    <UnenrollButton courseId={course.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't started any courses yet</p>
            <Link
              href="/dashboard/courses"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Browse courses →
            </Link>
          </div>
        )}
      </div>

      {/* Completed Courses */}
      {completedEnrollments.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Completed ({completedEnrollments.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedEnrollments.map(({ enrollment, course, progress }) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {course.title}
                    </h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✓ Completed
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {course.description || 'No description available'}
                  </p>

                  <p className="text-xs text-gray-500 mb-4">
                    Completed on {new Date(enrollment.completedAt!).toLocaleDateString()}
                  </p>

                  <Link
                    href={`/dashboard/learning/${course.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Review Course →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {enrollments.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet</p>
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  )
}