import { auth } from '@clerk/nextjs/server';
import { db, users, userSettings } from './db/queries';
import { eq } from 'drizzle-orm';

export interface ClerkUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

/**
 * Ensures a user exists in our database by creating them if they don't exist.
 * This should be called in API routes that require authenticated users.
 */
export async function ensureUserExists(userId?: string): Promise<ClerkUser> {
  // Get userId from Clerk if not provided
  if (!userId) {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      throw new Error('Unauthorized: No user ID found');
    }
    userId = clerkUserId;
  }

  // Check if user exists in our database
  const userResults = await db.select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (userResults.length === 0) {
    // Create a minimal user record for testing
    // In a real app with proper Clerk setup, you'd fetch user details from Clerk
    try {
      const newUsers = await db.insert(users)
        .values({
          clerkId: userId,
          email: `user-${userId.slice(0, 8)}@example.com`, // Generate unique email
          name: 'Test User',
          role: 'student', // Default role
        })
        .returning();

      const user = newUsers[0];

      // Create user settings with defaults
      await db.insert(userSettings)
        .values({
          userId: user.id,
          dailyGoal: 60, // 60 minutes per day
          emailNotifications: true,
          pushNotifications: true,
          studyReminders: true,
          deadlineReminders: true,
          preferredStudyTime: 'evening',
          studyDays: JSON.stringify([1, 2, 3, 4, 5]), // Monday-Friday
          theme: 'light',
        });

      console.log(`Created user: ${user.id} for Clerk ID: ${userId}`);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || undefined,
      };
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user in database');
    }
  }

  const user = userResults[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || undefined,
  };
}

/**
 * Check if user has required role
 */
export async function hasUserRole(clerkUserId: string, requiredRoles: string[]) {
  try {
    const userResults = await db.select({
      role: users.role,
    })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userResults.length === 0) {
      return false;
    }

    return requiredRoles.includes(userResults[0].role);
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Gets user info from Clerk and our database
 */
export async function getCurrentUser(): Promise<ClerkUser> {
  return await ensureUserExists();
}