import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/auth'
import { migrateRoles } from '@/lib/clerk-helpers'

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can migrate roles
  const adminAccess = await isAdmin()
  if (!adminAccess) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const result = await migrateRoles()
    return NextResponse.json({
      success: true,
      message: 'Role migration completed',
      ...result,
    })
  } catch (error) {
    console.error('Error migrating roles:', error)
    return NextResponse.json(
      { error: 'Failed to migrate roles' },
      { status: 500 }
    )
  }
}