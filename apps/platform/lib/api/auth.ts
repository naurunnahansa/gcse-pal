import { api } from '../api';

export interface AuthSyncResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    name?: string;
    role: 'student' | 'admin' | 'teacher';
    avatar?: string;
  };
  error?: string;
}

export class AuthAPI {
  private static basePath = '/auth';

  static async syncUser(): Promise<AuthSyncResponse> {
    try {
      return await api.post<AuthSyncResponse>(`${this.basePath}/sync`);
    } catch (error) {
      // Handle various error scenarios
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        // CORS or network errors
        if (errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network error') ||
            errorMessage.includes('cors')) {
          console.warn('⚠️ Auth sync unavailable - check CORS or network connectivity');
          return {
            success: false,
            error: 'Auth sync temporarily unavailable'
          };
        }

        // Server errors
        if (errorMessage.includes('http 5')) {
          console.warn('⚠️ Auth sync server error');
          return {
            success: false,
            error: 'Server temporarily unavailable'
          };
        }
      }

      console.warn('⚠️ Auth sync failed:', error);
      return {
        success: false,
        error: 'Auth sync unavailable'
      };
    }
  }

  static async signOut(): Promise<void> {
    try {
      await api.post(`${this.basePath}/signout`);
    } catch (error) {
      // Don't throw errors during sign out - just log them
      console.warn('⚠️ Sign out API unavailable:', error);
    }
  }
}