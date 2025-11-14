import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';

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
export async function ensureUserExists(): Promise<ClerkUser> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized: No user ID found');
  }

  // Check if user exists in our database
  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    // Create a minimal user record for testing
    // In a real app with proper Clerk setup, you'd fetch user details from Clerk
    try {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: `user-${userId.slice(0, 8)}@example.com`, // Generate unique email
          name: 'Test User',
          role: 'student', // Default role
        },
      });

      // Create user settings with defaults
      await prisma.userSettings.create({
        data: {
          userId: user.id,
          dailyGoal: 60, // 60 minutes per day
          notificationsEnabled: true,
          theme: 'light',
        },
      });

      console.log(`Created user: ${user.id} for Clerk ID: ${userId}`);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error('Failed to create user in database');
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar || undefined,
  };
}

/**
 * Gets user info from Clerk and our database
 */
export async function getCurrentUser(): Promise<ClerkUser> {
  return await ensureUserExists();
}