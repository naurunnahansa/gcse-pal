import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth'
import { updateUserRole } from '@/lib/clerk-helpers'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: Request) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can update roles
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { clerkId, role } = body

    if (!clerkId || !role) {
      return NextResponse.json(
        { error: 'clerkId and role are required' },
        { status: 400 }
      )
    }

    // Valid roles
    const validRoles = ['admin', 'teacher', 'pro_student', 'free_student']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Update role in Clerk
    const clerkResult = await updateUserRole(clerkId, role)
    if (!clerkResult.success) {
      return NextResponse.json(
        { error: 'Failed to update role in Clerk' },
        { status: 500 }
      )
    }

    // Update role in database
    await db
      .update(users)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.clerkId, clerkId))

    return NextResponse.json({
      success: true,
      message: 'Role updated successfully',
      clerkId,
      newRole: role,
    })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}