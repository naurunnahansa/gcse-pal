import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/auth'
import { getCourse } from '@/lib/actions/courses'
import { db } from '@/db'
import { courseEnrollments, pageProgress, chapters, pages, users } from '@/db/schema'
import { eq, and, count, sql, desc } from 'drizzle-orm'

export default async function CourseStatsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  if (role !== 'admin' && role !== 'teacher') {
    redirect('/dashboard')
  }

  const courseResult = await getCourse(courseId)
  if (!courseResult.success || !courseResult.course) {
    redirect('/dashboard/admin/courses')
  }

  const { course } = courseResult

  // Get enrollment stats
  const [enrollmentStats] = await db
    .select({
      totalEnrollments: count(),
    })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.courseId, courseId))

  // Get active students (those who completed at least one page)
  const activeStudents = await db
    .selectDistinct({
      clerkId: pageProgress.clerkId,
    })
    .from(pageProgress)
    .innerJoin(pages, eq(pages.id, pageProgress.pageId))
    .innerJoin(chapters, eq(chapters.id, pages.chapterId))
    .where(
      and(
        eq(chapters.courseId, courseId),
        eq(pageProgress.isCompleted, true)
      )
    )

  // Get total pages in course
  const [totalPagesResult] = await db
    .select({
      totalPages: count(),
    })
    .from(pages)
    .innerJoin(chapters, eq(chapters.id, pages.chapterId))
    .where(eq(chapters.courseId, courseId))

  // Get completion stats per student
  const studentProgress = await db
    .select({
      clerkId: courseEnrollments.clerkId,
      completedPages: sql<number>`
        COALESCE(
          (SELECT COUNT(*)
           FROM ${pageProgress}
           INNER JOIN ${pages} ON ${pages.id} = ${pageProgress.pageId}
           INNER JOIN ${chapters} ON ${chapters.id} = ${pages.chapterId}
           WHERE ${chapters.courseId} = ${courseId}
             AND ${pageProgress.clerkId} = ${courseEnrollments.clerkId}
             AND ${pageProgress.isCompleted} = true
          ), 0
        )
      `,
    })
    .from(courseEnrollments)
    .where(eq(courseEnrollments.courseId, courseId))
    .orderBy(desc(sql`completedPages`))

  // Get user details for enrolled students
  const enrolledUserIds = studentProgress.map(sp => sp.clerkId)
  const enrolledUsers = enrolledUserIds.length > 0
    ? await db
      .select({
        clerkId: users.clerkId,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(sql`${users.clerkId} = ANY(${enrolledUserIds})`)
    : []

  // Map user details to progress
  const studentProgressWithDetails = studentProgress.map(sp => {
    const user = enrolledUsers.find(u => u.clerkId === sp.clerkId)
    return {
      ...sp,
      name: user?.name || 'Unknown',
      email: user?.email || '',
      completionRate: totalPagesResult.totalPages > 0
        ? Math.round((Number(sp.completedPages) / totalPagesResult.totalPages) * 100)
        : 0,
    }
  })

  // Calculate average completion rate
  const avgCompletionRate = studentProgressWithDetails.length > 0
    ? Math.round(
      studentProgressWithDetails.reduce((sum, sp) => sum + sp.completionRate, 0) /
      studentProgressWithDetails.length
    )
    : 0

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/admin/courses/${courseId}`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to course
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">
            Course Statistics: {course.title}
          </h1>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Total Enrollments
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {enrollmentStats.totalEnrollments}
          </dd>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Active Students
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {activeStudents.length}
          </dd>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Total Pages
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {totalPagesResult.totalPages}
          </dd>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Avg Completion
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {avgCompletionRate}%
          </dd>
        </div>
      </div>

      {/* Student Progress Table */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Student Progress
          </h2>
          {studentProgressWithDetails.length > 0 ? (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pages Completed
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {studentProgressWithDetails.map((student) => (
                    <tr key={student.clerkId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {student.completedPages} / {totalPagesResult.totalPages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-900 mr-2">
                            {student.completionRate}%
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${student.completionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {student.completionRate === 100 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : student.completionRate > 0 ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Not Started
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No students enrolled yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
}