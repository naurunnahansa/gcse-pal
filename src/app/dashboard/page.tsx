import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth'
import { getMyEnrollments } from '@/lib/actions/enrollments'
import { getCourses } from '@/lib/actions/courses'
import Link from 'next/link'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  const enrollmentsResult = await getMyEnrollments()
  const enrollments = enrollmentsResult.enrollments || []

  // Get recent published courses
  const coursesResult = await getCourses({ onlyPublished: true })
  const recentCourses = (coursesResult.courses || []).slice(0, 3)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">
            {role === 'admin' && 'Admin Dashboard - Manage all courses and users'}
            {role === 'teacher' && 'Teacher Dashboard - Create and manage your courses'}
            {role === 'pro_student' && 'Pro Student Dashboard - Access all courses'}
            {role === 'free_student' && 'Student Dashboard - Access free courses'}
          </p>
        </div>
        {(role === 'admin' || role === 'teacher') && (
          <div className="flex gap-3">
            <Link
              href="/dashboard/admin/courses/new"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              Create Course
            </Link>
            <Link
              href="/dashboard/admin/courses"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-background border border-input hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
            >
              Manage Courses
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
              <h3 className="text-2xl font-bold">{enrollments.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <h3 className="text-2xl font-bold">{enrollments.filter(e => !e.enrollment.completedAt).length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <h3 className="text-2xl font-bold">{enrollments.filter(e => e.enrollment.completedAt).length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* My Courses */}
      {enrollments.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold tracking-tight">My Courses</h2>
            <Link
              href="/dashboard/my-courses"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {enrollments.slice(0, 3).map(({ enrollment, course, progress }) => (
              <Link
                key={enrollment.id}
                href={`/dashboard/learning/${course.id}`}
                className="group block bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {course.description}
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Courses */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold tracking-tight">
            {enrollments.length > 0 ? 'Explore More Courses' : 'Get Started'}
          </h2>
          <Link
            href="/dashboard/courses"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Browse all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentCourses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="group block bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">{course.title}</h3>
                  {course.isFree ? (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary">
                      Pro
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {course.description}
                </p>
                <span className="text-sm font-medium text-primary group-hover:underline decoration-2 underline-offset-4">
                  Learn more
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}