import { redirect } from 'next/navigation'
import { getCourse } from '@/lib/actions/courses'
import { getChapters } from '@/lib/actions/chapters'
import { enrollInCourse, checkEnrollment } from '@/lib/actions/enrollments'
import { getUserRole } from '@/lib/auth'
import Link from 'next/link'

async function EnrollButton({ courseId, isFree }: { courseId: string; isFree: boolean }) {
  async function handleEnroll() {
    'use server'
    const result = await enrollInCourse(courseId)
    if (result.success) {
      redirect(`/dashboard/learning/${courseId}`)
    }
  }

  const role = await getUserRole()
  const canAccess = role === 'admin' || role === 'teacher' ||
    role === 'pro_student' || (role === 'free_student' && isFree)

  if (!canAccess && !isFree) {
    return (
      <Link
        href="/dashboard/upgrade"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
      >
        Upgrade to Pro to Access
      </Link>
    )
  }

  return (
    <form action={handleEnroll}>
      <button
        type="submit"
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Enroll in Course
      </button>
    </form>
  )
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const courseResult = await getCourse(courseId)

  if (!courseResult.success || !courseResult.course) {
    redirect('/dashboard/courses')
  }

  const { course } = courseResult
  const chaptersResult = await getChapters(courseId)
  const chapters = chaptersResult.chapters || []

  const { isEnrolled } = await checkEnrollment(courseId)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href="/dashboard/courses"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to courses
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {/* Course Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                <div className="mt-2 flex items-center space-x-3">
                  {course.isFree ? (
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                      Free Course
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-purple-100 text-purple-800">
                      Pro Course
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {chapters.length} chapters
                  </span>
                </div>
              </div>
            </div>

            {course.description && (
              <p className="mt-4 text-gray-600">{course.description}</p>
            )}
          </div>

          {/* Enrollment Section */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            {isEnrolled ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    ✓ You are enrolled in this course
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Continue learning from where you left off
                  </p>
                </div>
                <Link
                  href={`/dashboard/learning/${courseId}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  Continue Learning →
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Ready to start learning?
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Enroll now to access all course content
                  </p>
                </div>
                <EnrollButton courseId={courseId} isFree={course.isFree} />
              </div>
            )}
          </div>

          {/* Course Content */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Course Content</h2>
            {chapters.length > 0 ? (
              <div className="space-y-3">
                {chapters.map((chapter: any, index: number) => (
                  <div
                    key={chapter.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 font-medium">
                            Chapter {index + 1}
                          </span>
                          {chapter.isFree && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Free Preview
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-medium text-gray-900 mt-1">
                          {chapter.title}
                        </h3>
                        {chapter.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {chapter.description}
                          </p>
                        )}
                      </div>
                      {isEnrolled && (
                        <Link
                          href={`/dashboard/learning/${courseId}/chapter/${chapter.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          Start →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Course content is being prepared...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}