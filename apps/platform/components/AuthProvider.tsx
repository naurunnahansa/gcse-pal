'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { mockAuth, AuthState } from '@/lib/auth-mock';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = React.useState<AuthState>(mockAuth.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = mockAuth.subscribe(() => {
      setAuthState(mockAuth.getState());
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    ...authState,
    signIn: mockAuth.signIn,
    signUp: mockAuth.signUp,
    signOut: mockAuth.signOut,
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