import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getUserRole,
  isAdmin,
  isTeacher,
  isStudent,
  requireProAccess,
  ensureUserInDatabase
} from '@/lib/auth'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Ensure user exists in database
    const user = await ensureUserInDatabase(userId)

    // Get role information
    const role = await getUserRole()
    const adminAccess = await isAdmin()
    const teacherAccess = await isTeacher()
    const studentAccess = await isStudent()
    const proAccess = await requireProAccess()

    return NextResponse.json({
      success: true,
      user: {
        clerkId: userId,
        databaseUser: user,
        role,
      },
      access: {
        isAdmin: adminAccess,
        isTeacher: teacherAccess,
        isStudent: studentAccess,
        hasProAccess: proAccess,
      },
      routes: {
        canAccessAdmin: role === 'admin',
        canAccessTeacher: role === 'admin' || role === 'teacher',
        canAccessStudent: !!role,
        canAccessPro: role === 'admin' || role === 'teacher' || role === 'pro_student',
      },
    })
  } catch (error) {
    console.error('Error testing role:', error)
    return NextResponse.json(
      { error: 'Failed to test role access' },
      { status: 500 }
    )
  }
}