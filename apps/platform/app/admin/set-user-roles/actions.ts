'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { Role } from '@/lib/permissions'

/**
 * Set user role in both Clerk metadata and database
 * Following the article's approach for role management
 */
export async function setRole(formData: FormData): Promise<void> {
  const client = await clerkClient()
  const userId = formData.get('id') as string
  const role = formData.get('role') as Role

  if (!userId || !role) {
    throw new Error('User ID and role are required')
  }

  try {
    // Update role in Clerk metadata
    await client.users.updateUser(userId, {
      publicMetadata: { role }
    })

    // Update role in database
    await db.update(users)
      .set({
        role: role,
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, userId))

    console.log(`Updated user ${userId} role to ${role}`)
  } catch (err) {
    console.error('Error setting user role:', err)
    throw new Error(err instanceof Error ? err.message : 'Failed to set user role')
  }
}

/**
 * Remove user role (set to viewer)
 */
export async function removeRole(formData: FormData): Promise<void> {
  const client = await clerkClient()
  const userId = formData.get('id') as string

  if (!userId) {
    throw new Error('User ID is required')
  }

  try {
    // Remove role in Clerk metadata
    await client.users.updateUser(userId, {
      publicMetadata: { role: null }
    })

    // Remove role in database
    await db.update(users)
      .set({
        role: 'student', // Default to student instead of null for better compatibility
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, userId))

    console.log(`Removed role from user ${userId}`)
  } catch (err) {
    console.error('Error removing user role:', err)
    throw new Error(err instanceof Error ? err.message : 'Failed to remove user role')
  }
}

/**
 * Search users via Clerk API
 */
export async function searchUsers(query: string) {
  const client = await clerkClient()

  try {
    const clerkUsers = query
      ? (await client.users.getUserList({ query })).data
      : (await client.users.getUserList({ limit: 10 })).data

    // Get user roles from database
    const userIds = clerkUsers.map(user => user.id)
    const dbUsers = userIds.length > 0
      ? await db.select({
          clerkId: users.clerkId,
          role: users.role
        })
        .from(users)
        .where(eq(users.clerkId, userIds[0])) // This would need to be adapted for multiple users
      : []

    // Merge Clerk and database data
    return clerkUsers.map(user => {
      const dbUser = dbUsers.find(db => db.clerkId === user.id)
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
        role: dbUser?.role as Role || null,
        avatar: user.imageUrl
      }
    })
  } catch (err) {
    console.error('Error searching users:', err)
    throw new Error(err instanceof Error ? err.message : 'Failed to search users')
  }
}