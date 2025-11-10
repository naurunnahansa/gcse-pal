'use client';

import React from 'react';
import { AuthProvider } from '@/components/AuthProvider';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  return React.createElement(AuthProvider, null, children);
}