import { auth, currentUser } from '@clerk/nextjs/server';
import { db, users } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';
import { Role, hasPermission, canManageUsers, canManageCourses, canManageQuizzes, canViewAllProgress, canAccessDashboard } from './permissions';

/**
 * Get the current authenticated user from Clerk
 *
 */
export async function getAuthenticatedUser() {
  try {
    const clerkUser = await auth();
    if (!clerkUser.userId) {
      return null;
    }

    // Get full user data from Clerk
    const clerkUserData = await currentUser();
    if (!clerkUserData) {
      return null;
    }

    return {
      userId: clerkUser.userId,
      email: clerkUserData.emailAddresses[0]?.emailAddress,
      name: `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim() || clerkUserData.username || 'User',
      avatar: clerkUserData.imageUrl,
      username: clerkUserData.username,
      firstName: clerkUserData.firstName,
      lastName: clerkUserData.lastName,
      // Include full Clerk user data for sync operations
      clerkUserData: clerkUserData,
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Sync or create a user in our database based on Clerk data
 */
export async function syncUserWithDatabase(clerkUserId: string, clerkUserData?: any) {
  try {
    // Use provided user data or fetch if not provided
    const userData = clerkUserData || await currentUser();
    if (!userData) {
      throw new Error('User not found in Clerk');
    }

    const email = userData.emailAddresses[0]?.emailAddress;
    const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.username || 'User';
    const avatar = userData.imageUrl;

    if (!email) {
      throw new Error('User email not found');
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    let user;
    if (existingUser.length > 0) {
      // Update existing user, preserving their role
      const currentUser = existingUser[0];
      const updatedUsers = await db.update(users)
        .set({
          email,
          name,
          avatar,
          // Preserve existing role - don't override it during sync
          role: currentUser.role,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkUserId))
        .returning();
      user = updatedUsers[0];
    } else {
      // Create new user
      const newUsers = await db.insert(users)
        .values({
          clerkId: clerkUserId,
          email,
          name,
          avatar,
          role: 'student', // Default role
        })
        .returning();
      user = newUsers[0];
    }

    // Note: userSettings table removed during schema simplification
    // User preferences can be added back later if needed

    return user;
  } catch (error) {
    console.error('Error syncing user with database:', error);
    throw error;
  }
}

/**
 * Get database user from Clerk user ID
 */
export async function getDbUserFromClerkId(clerkUserId: string) {
  try {
    const userResults = await db.select({
      id: users.id,
      clerkId: users.clerkId,
      email: users.email,
      name: users.name,
      avatar: users.avatar,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userResults.length === 0) {
      return null;
    }

    const user = userResults[0];

    return {
      ...user,
      // Note: userSettings removed during schema simplification
    };
  } catch (error) {
    console.error('Error getting database user:', error);
    return null;
  }
}

/**
 * Check if user has required role
 */
export async function hasUserRole(clerkUserId: string, requiredRoles: string[]) {
  try {
    const user = await getDbUserFromClerkId(clerkUserId);
    if (!user) {
      return false;
    }
    return requiredRoles.includes(user.role);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Middleware function to ensure user exists in database
 */
export async function ensureUserExists(clerkUserId: string) {
  try {
    const existingUser = await getDbUserFromClerkId(clerkUserId);
    if (!existingUser) {
      // Auto-sync user if they don't exist in our database
      await syncUserWithDatabase(clerkUserId);
    }
    return true;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return false;
  }
}

/**
 * Get user role from Clerk session metadata (following article approach)
 */
export async function getUserRole(): Promise<Role | null> {
  try {
    const session = await auth();
    return (session?.sessionClaims?.metadata?.role as Role) || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

/**
 * Check if current user has specific permission
 */
export async function checkPermission(permission: string): Promise<boolean> {
  try {
    const role = await getUserRole();
    return hasPermission(role, permission);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Check if current user has admin privileges
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const role = await getUserRole();
    return role === 'admin' || role === 'teacher';
  } catch (error) {
    console.error('Error checking admin access:', error);
    return false;
  }
}

/**
 * Check if current user has teacher privileges
 */
export async function checkTeacherAccess(): Promise<boolean> {
  try {
    const role = await getUserRole();
    return role === 'teacher' || role === 'admin';
  } catch (error) {
    console.error('Error checking teacher access:', error);
    return false;
  }
}

/**
 * Update user role in both Clerk metadata and database
 */
export async function updateUserRole(targetUserId: string, newRole: Role): Promise<boolean> {
  try {
    // Check if current user has permission to manage roles
    const currentRole = await getUserRole();
    if (!canManageUsers(currentRole)) {
      throw new Error('Insufficient permissions to manage user roles');
    }

    // Update role in Clerk metadata
    const { clerkClient } = await import('@clerk/nextjs/server');
    const client = await clerkClient();

    await client.users.updateUser(targetUserId, {
      publicMetadata: { role: newRole }
    });

    // Update role in database
    await db.update(users)
      .set({
        role: newRole,
        updatedAt: new Date()
      })
      .where(eq(users.clerkId, targetUserId));

    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

/**
 * Get user with role information from Clerk session
 */
export async function getCurrentUserWithRole() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    const role = clerkUser.publicMetadata?.role as Role || null;

    return {
      userId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'User',
      avatar: clerkUser.imageUrl,
      role: role,
      // Permission checks
      permissions: {
        canManageUsers: canManageUsers(role),
        canManageCourses: canManageCourses(role),
        canManageQuizzes: canManageQuizzes(role),
        canViewAllProgress: canViewAllProgress(role),
        canAccessDashboard: canAccessDashboard(role),
        isAdmin: role === 'admin',
        isTeacher: role === 'teacher' || role === 'admin',
        isStudent: role === 'student' || !role, // Treat no role as student
      }
    };
  } catch (error) {
    console.error('Error getting current user with role:', error);
    return null;
  }
}