import { getCourses } from '@/lib/actions/courses'
import { getUserRole } from '@/lib/auth'
import Link from 'next/link'

export default async function BrowseCoursesPage() {
  const role = await getUserRole()
  const result = await getCourses({ onlyPublished: true })
  const courses = result.courses || []

  // Separate free and pro courses
  const freeCourses = courses.filter(c => c.isFree)
  const proCourses = courses.filter(c => !c.isFree)

  const canAccessPro = role === 'admin' || role === 'teacher' || role === 'pro_student'

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Browse Courses</h1>
        <p className="mt-1 text-sm text-gray-600">
          Explore our collection of courses and start learning today
        </p>
      </div>

      {/* Free Courses */}
      {freeCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Free Courses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeCourses.map((course) => (
              <Link
                key={course.id}
                href={`/dashboard/courses/${course.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                {course.thumbnailUrl && (
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {course.title}
                    </h3>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Free
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {course.description || 'No description available'}
                  </p>
                  <div className="mt-4">
                    <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                      View Course →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pro Courses */}
      {proCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Pro Courses</h2>
            {!canAccessPro && (
              <Link
                href="/dashboard/upgrade"
                className="text-sm text-purple-600 hover:text-purple-500 font-medium"
              >
                Upgrade to Pro →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proCourses.map((course) => (
              <div
                key={course.id}
                className={`block bg-white rounded-lg shadow ${
                  canAccessPro ? 'hover:shadow-md transition-shadow' : 'opacity-75'
                }`}
              >
                {canAccessPro ? (
                  <Link href={`/dashboard/courses/${course.id}`}>
                    <CourseCard course={course} />
                  </Link>
                ) : (
                  <div className="relative">
                    <CourseCard course={course} />
                    <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="text-center">
                        <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                          Pro Only
                        </span>
                        <p className="mt-2 text-sm text-gray-600">
                          Upgrade to access
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No courses available yet.</p>
        </div>
      )}
    </div>
  )
}

function CourseCard({ course }: { course: any }) {
  return (
    <>
      {course.thumbnailUrl && (
        <div className="h-48 bg-gray-200 rounded-t-lg"></div>
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-medium text-gray-900">
            {course.title}
          </h3>
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
            Pro
          </span>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">
          {course.description || 'No description available'}
        </p>
        <div className="mt-4">
          <span className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View Course →
          </span>
        </div>
      </div>
    </>
  )
}