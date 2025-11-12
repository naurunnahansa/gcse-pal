'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';

interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user, isLoaded } = useUser();

  const value: AuthContextType = {
    user: isSignedIn && user ? {
      id: user.id,
      name: user.fullName || user.firstName || user.username,
      email: user.primaryEmailAddress?.emailAddress,
      avatar: user.imageUrl,
    } : null,
    isAuthenticated: isSignedIn || false,
    isLoading: !isLoaded,
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