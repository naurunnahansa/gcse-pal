import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { updateUserRole } from '@/lib/clerk-helpers'
import { revalidatePath } from 'next/cache'

async function UserRoleForm({ user }: { user: any }) {
  async function updateRole(formData: FormData) {
    'use server'

    const newRole = formData.get('role') as string

    // Update in Clerk
    await updateUserRole(user.clerkId, newRole as any)

    // Update in database
    await db
      .update(users)
      .set({
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, user.clerkId))

    revalidatePath('/dashboard/admin/users')
  }

  return (
    <form action={updateRole} className="flex items-center space-x-2">
      <select
        name="role"
        defaultValue={user.role}
        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="free_student">Free Student</option>
        <option value="pro_student">Pro Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Update
      </button>
    </form>
  )
}

export default async function UsersPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all users from database
  const userList = await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage user roles and permissions
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <p className="text-sm text-gray-500">
            Total users: <span className="font-medium">{userList.length}</span>
          </p>
          <Link
            href="/dashboard/admin/users/sync"
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Sync from Clerk
          </Link>
        </div>
      </div>

      {userList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found in database.</p>
          <p className="text-sm text-gray-400 mt-2">
            Users will appear here after they sign in and are synced via webhooks.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {userList.map((user) => (
              <li key={user.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name || 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-800'
                              : user.role === 'teacher'
                              ? 'bg-blue-100 text-blue-800'
                              : user.role === 'pro_student'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        Clerk ID: {user.clerkId} | Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      {user.clerkId !== userId ? (
                        <UserRoleForm user={user} />
                      ) : (
                        <p className="text-sm text-gray-400">Current user</p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Role Descriptions</h3>
        <div className="space-y-1 text-sm text-blue-700">
          <p><strong>Admin:</strong> Full system access, can manage all users and content</p>
          <p><strong>Teacher:</strong> Can create and manage courses, view enrollment stats</p>
          <p><strong>Pro Student:</strong> Access to all courses including pro content</p>
          <p><strong>Free Student:</strong> Access to free courses only</p>
        </div>
      </div>
    </div>
  )
}