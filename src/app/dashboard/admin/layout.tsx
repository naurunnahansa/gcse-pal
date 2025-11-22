import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserRole } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  if (role !== 'admin' && role !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8 items-center">
              <Link href="/dashboard" className="text-lg font-semibold">
                LMS Admin
              </Link>
              <Link
                href="/dashboard/admin/courses"
                className="text-gray-600 hover:text-gray-900"
              >
                Courses
              </Link>
              <Link
                href="/dashboard/admin/users"
                className="text-gray-600 hover:text-gray-900"
              >
                Users
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Role: <span className="font-medium">{role}</span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}