'use client';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

let authState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const listeners: Set<() => void> = new Set();

export const mockAuth = {
  // Get current auth state
  getState: (): AuthState => ({ ...authState }),

  // Subscribe to auth state changes
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Notify all listeners
  notify: () => {
    listeners.forEach(listener => listener());
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Mock validation
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // Mock authentication logic (accept any email/password with basic validation)
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    // Create mock user
    const user: User = {
      id: 'user_' + Date.now(),
      email,
      name: email.split('@')[0], // Extract name from email
    };

    // Update auth state
    authState = {
      user,
      isAuthenticated: true,
    };

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockAuthState', JSON.stringify(authState));
    }

    // Notify listeners
    mockAuth.notify();

    return { success: true };
  },

  // Sign up with name, email, and password
  signUp: async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Mock validation
    if (!name || !email || !password) {
      return { success: false, error: 'All fields are required' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    // Create mock user
    const user: User = {
      id: 'user_' + Date.now(),
      email,
      name,
    };

    // Update auth state
    authState = {
      user,
      isAuthenticated: true,
    };

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockAuthState', JSON.stringify(authState));
    }

    // Notify listeners
    mockAuth.notify();

    return { success: true };
  },

  // Sign out
  signOut: async (): Promise<void> => {
    authState = {
      user: null,
      isAuthenticated: false,
    };

    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockAuthState');
    }

    // Notify listeners
    mockAuth.notify();
  },

  // Initialize auth state from localStorage
  init: (): void => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('mockAuthState');
        if (stored) {
          authState = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to parse stored auth state:', error);
      }
    }
  },
};

// Initialize auth state on module load
if (typeof window !== 'undefined') {
  mockAuth.init();
}