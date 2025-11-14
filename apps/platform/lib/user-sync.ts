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
    // Get user info from Clerk
    const clerkUser = await auth().getUser();

    if (!clerkUser) {
      throw new Error('User not found in Clerk');
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      email => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      throw new Error('User has no email address');
    }

    // Create user in our database
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: primaryEmail.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown User',
        avatar: clerkUser.imageUrl,
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