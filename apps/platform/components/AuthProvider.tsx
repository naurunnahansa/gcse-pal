'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  primaryEmailAddressId?: string;
  hasImage?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; username?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user, isLoaded } = useUser();
  const clerk = useClerk();
  const [isUpdating, setIsUpdating] = useState(false);

  // Sync user with our database when they sign in
  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user && isLoaded) {
        try {
          // Call our auth sync endpoint to ensure user exists in database
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            console.error('Failed to sync user with database');
            // Don't throw error here, just log it since user can still use the app
          } else {
            const result = await response.json();
            console.log('User synced successfully:', result.data);
          }
        } catch (error) {
          console.error('Error syncing user:', error);
          // Don't block the user from using the app if sync fails
        }
      }
    };

    syncUser();
  }, [isSignedIn, user, isLoaded]);

  const updateUser = (clerkUser: any): User | null => {
    if (!clerkUser) return null;

    return {
      id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.firstName || clerkUser.username,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      avatar: clerkUser.imageUrl,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      username: clerkUser.username,
      primaryEmailAddressId: clerkUser.primaryEmailAddressId,
      hasImage: clerkUser.hasImage,
    };
  };

  const signOut = async () => {
    try {
      await clerk.signOut({ redirectUrl: '/auth/signin' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback redirect
      window.location.href = '/auth/signin';
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; username?: string }) => {
    if (!clerk.user || isUpdating) return;

    try {
      setIsUpdating(true);
      await clerk.user.update({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!clerk.user || isUpdating) return;

    try {
      setIsUpdating(true);

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be a JPEG, PNG, GIF, or WebP image');
      }

      await clerk.user.setProfileImage({
        file: file,
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!clerk.user || isUpdating) return;

    try {
      setIsUpdating(true);

      // Verify the current password and set the new one
      // Note: Clerk doesn't have a direct "verify current password" method in the client SDK
      // This would typically be handled through Clerk's built-in password reset flow
      // For now, we'll use the user's sign in method to verify

      await clerk.user.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const value: AuthContextType = {
    user: updateUser(user),
    isAuthenticated: isSignedIn || false,
    isLoading: !isLoaded || isUpdating,
    signOut,
    updateProfile,
    uploadAvatar,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}