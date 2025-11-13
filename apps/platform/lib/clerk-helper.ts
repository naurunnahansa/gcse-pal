import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

/**
 * Get the current authenticated user from Clerk
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
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Sync or create a user in our database based on Clerk data
 */
export async function syncUserWithDatabase(clerkUserId: string) {
  try {
    const clerkUserData = await currentUser();
    if (!clerkUserData) {
      throw new Error('User not found in Clerk');
    }

    const email = clerkUserData.emailAddresses[0]?.emailAddress;
    const name = `${clerkUserData.firstName || ''} ${clerkUserData.lastName || ''}`.trim() || clerkUserData.username || 'User';
    const avatar = clerkUserData.imageUrl;

    if (!email) {
      throw new Error('User email not found');
    }

    // Upsert user in our database
    const user = await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: {
        email,
        name,
        avatar,
      },
      create: {
        clerkId: clerkUserId,
        email,
        name,
        avatar,
        role: 'student', // Default role
      },
    });

    // Create default user settings if they don't exist
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        studyReminders: true,
        deadlineReminders: true,
        dailyGoal: 60, // 60 minutes default
        preferredStudyTime: 'evening',
        studyDays: JSON.stringify([1, 2, 3, 4, 5]), // Monday to Friday
      },
    });

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
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      include: {
        userSettings: true,
      },
    });
    return user;
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