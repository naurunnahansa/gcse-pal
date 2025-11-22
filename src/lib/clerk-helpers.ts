import { clerkClient } from '@clerk/nextjs/server'
import { UserRole } from './auth'

/**
 * Update a user's role in Clerk
 * This updates the public metadata which is accessible in the frontend
 */
export async function updateUserRole(clerkId: string, role: UserRole) {
  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role,
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating user role in Clerk:', error)
    return { success: false, error: 'Failed to update role' }
  }
}

/**
 * Bulk update user roles (useful for migration)
 */
export async function bulkUpdateUserRoles(
  updates: Array<{ clerkId: string; role: UserRole }>
) {
  const results = await Promise.allSettled(
    updates.map(({ clerkId, role }) => updateUserRole(clerkId, role))
  )

  const successful = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return {
    successful,
    failed,
    total: updates.length,
  }
}

/**
 * Get all users with their roles from Clerk
 */
export async function getAllUsersWithRoles() {
  try {
    const clerk = await clerkClient()
    const response = await clerk.users.getUserList({ limit: 100 })
    const users = response.data || []

    return users.map((user) => ({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      role: (user.publicMetadata?.role as UserRole) || 'free_student',
    }))
  } catch (error) {
    console.error('Error fetching users from Clerk:', error)
    return []
  }
}

/**
 * Migrate existing roles from old system to new LMS roles
 */
export async function migrateRoles() {
  const roleMapping: Record<string, UserRole> = {
    admin: 'admin',
    moderator: 'teacher',
    contributor: 'teacher',
    viewer: 'free_student',
  }

  try {
    const clerk = await clerkClient()
    const response = await clerk.users.getUserList({ limit: 100 })
    const users = response.data || []
    const updates: Array<{ clerkId: string; role: UserRole }> = []

    for (const user of users) {
      const currentRole = user.publicMetadata?.role as string

      if (currentRole && roleMapping[currentRole]) {
        const newRole = roleMapping[currentRole]
        if (newRole !== currentRole) {
          updates.push({ clerkId: user.id, role: newRole })
        }
      } else if (!currentRole) {
        // Default role for users without a role
        updates.push({ clerkId: user.id, role: 'free_student' })
      }
    }

    if (updates.length > 0) {
      const result = await bulkUpdateUserRoles(updates)
      console.log('Role migration completed:', result)
      return result
    }

    return { successful: 0, failed: 0, total: 0 }
  } catch (error) {
    console.error('Error during role migration:', error)
    return { successful: 0, failed: 0, total: 0, error }
  }
}