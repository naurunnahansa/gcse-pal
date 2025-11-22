import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from '@/db'
import { users, courseEnrollments, teacherCourseAssignments, courses } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export type UserRole = 'admin' | 'teacher' | 'pro_student' | 'free_student'

/**
 * Get the user's role from Clerk metadata or database
 */
export async function getUserRole(clerkId?: string): Promise<UserRole | null> {
  try {
    const { userId, sessionClaims } = await auth()
    const userIdToCheck = clerkId || userId

    if (!userIdToCheck) return null

    // First check session claims for role (faster)
    if (!clerkId && sessionClaims?.metadata?.role) {
      return sessionClaims.metadata.role as UserRole
    }

    // Fallback to database
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.clerkId, userIdToCheck))
      .limit(1)

    return (user?.role as UserRole) || 'free_student'
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Check if a user can access a specific course
 */
export async function canAccessCourse(
  clerkId: string,
  courseId: string
): Promise<boolean> {
  try {
    const role = await getUserRole(clerkId)

    // Admins can access all courses
    if (role === 'admin') return true

    // Check if course exists and get its details
    const [course] = await db
      .select({ isPublished: courses.isPublished, isFree: courses.isFree })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) return false

    // Unpublished courses can only be accessed by admins and assigned teachers
    if (!course.isPublished) {
      if (role === 'teacher') {
        // Check if teacher is assigned to this course
        const [assignment] = await db
          .select()
          .from(teacherCourseAssignments)
          .where(
            and(
              eq(teacherCourseAssignments.teacherClerkId, clerkId),
              eq(teacherCourseAssignments.courseId, courseId)
            )
          )
          .limit(1)

        return !!assignment
      }
      return false
    }

    // Published courses
    if (role === 'teacher') {
      // Teachers can access any published course
      return true
    }

    // Students need to be enrolled
    const [enrollment] = await db
      .select()
      .from(courseEnrollments)
      .where(
        and(
          eq(courseEnrollments.clerkId, clerkId),
          eq(courseEnrollments.courseId, courseId)
        )
      )
      .limit(1)

    if (!enrollment) return false

    // Free students can only access free courses
    if (role === 'free_student' && !course.isFree) {
      return false
    }

    return true
  } catch (error) {
    console.error('Error checking course access:', error)
    return false
  }
}

/**
 * Check if a user can edit a specific course
 */
export async function canEditCourse(
  clerkId: string,
  courseId: string
): Promise<boolean> {
  try {
    const role = await getUserRole(clerkId)

    // Only admins and teachers can edit courses
    if (role !== 'admin' && role !== 'teacher') return false

    // Admins can edit all courses
    if (role === 'admin') return true

    // Teachers can only edit courses they created or are assigned to
    const [course] = await db
      .select({ createdByClerkId: courses.createdByClerkId })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) return false

    // Check if teacher created the course
    if (course.createdByClerkId === clerkId) return true

    // Check if teacher is assigned to the course
    const [assignment] = await db
      .select()
      .from(teacherCourseAssignments)
      .where(
        and(
          eq(teacherCourseAssignments.teacherClerkId, clerkId),
          eq(teacherCourseAssignments.courseId, courseId)
        )
      )
      .limit(1)

    return !!assignment
  } catch (error) {
    console.error('Error checking course edit permissions:', error)
    return false
  }
}

/**
 * Middleware helper to require specific roles
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ authorized: boolean; role: UserRole | null }> {
  const { userId } = await auth()

  if (!userId) {
    return { authorized: false, role: null }
  }

  const role = await getUserRole()

  if (!role || !allowedRoles.includes(role)) {
    return { authorized: false, role }
  }

  return { authorized: true, role }
}

/**
 * Check if user has Pro access
 */
export async function requireProAccess(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin' || role === 'teacher' || role === 'pro_student'
}

/**
 * Get current user with role
 */
export async function getCurrentUserWithRole() {
  const user = await currentUser()
  if (!user) return null

  const role = await getUserRole(user.id)

  return {
    ...user,
    role,
  }
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin'
}

/**
 * Check if user is teacher
 */
export async function isTeacher(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'teacher'
}

/**
 * Check if user is student (any type)
 */
export async function isStudent(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'pro_student' || role === 'free_student'
}

/**
 * Ensure user exists in database (for sync issues)
 */
export async function ensureUserInDatabase(clerkId: string) {
  try {
    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1)

    if (existingUser) return existingUser

    // Get user from Clerk
    const { sessionClaims } = await auth()
    const clerkUser = await currentUser()

    if (!clerkUser || clerkUser.id !== clerkId) {
      console.error('Could not fetch Clerk user')
      return null
    }

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' '),
        role: (sessionClaims?.metadata?.role as UserRole) || 'free_student',
      })
      .returning()

    return newUser
  } catch (error) {
    console.error('Error ensuring user in database:', error)
    return null
  }
}