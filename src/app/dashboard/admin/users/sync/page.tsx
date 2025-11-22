import { redirect } from 'next/navigation'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { getUserRole } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

async function syncUsers() {
  'use server'

  // Get the clerk client instance
  const clerk = await clerkClient()

  // Get all users from Clerk
  const response = await clerk.users.getUserList({ limit: 100 })

  // The response contains a data property with the users array
  const clerkUsers = response.data || []

  let synced = 0
  let created = 0
  let updated = 0
  let errors = 0

  for (const clerkUser of clerkUsers) {
    try {
      // Check if user exists in database
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUser.id))
        .limit(1)

      const userData = {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || null,
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null,
        role: (clerkUser.publicMetadata?.role as string) || 'free_student',
      }

      if (existingUser) {
        // Update existing user
        await db
          .update(users)
          .set({
            ...userData,
            updatedAt: new Date()
          })
          .where(eq(users.clerkId, clerkUser.id))
        updated++
      } else {
        // Create new user
        await db.insert(users).values(userData)
        created++
      }
      synced++
    } catch (error) {
      console.error(`Error syncing user ${clerkUser.id}:`, error)
      errors++
    }
  }

  redirect(`/dashboard/admin/users?synced=${synced}&created=${created}&updated=${updated}&errors=${errors}`)
}

export default async function UserSyncPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const role = await getUserRole()
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <Link
          href="/dashboard/admin/users"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to users
        </Link>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sync Users from Clerk
          </h2>

          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Important:</strong> This will sync all users from Clerk to the database.
              Existing users will be updated, new users will be created.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">What this does:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Fetches all users from Clerk (up to 100)</li>
                <li>Creates database records for new users</li>
                <li>Updates existing user information</li>
                <li>Syncs roles from Clerk metadata</li>
              </ul>
            </div>

            <form action={syncUsers}>
              <button
                type="submit"
                className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Sync
              </button>
            </form>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Alternative: Webhook Setup</h3>
              <p className="text-sm text-gray-600">
                For automatic syncing, ensure the Clerk webhook is configured at:
              </p>
              <code className="block mt-2 text-xs bg-gray-100 p-2 rounded">
                {process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/clerk-webhooks
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Webhook events: user.created, user.updated, user.deleted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}