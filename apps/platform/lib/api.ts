import type { NextRequest } from 'next/server';

// Configuration
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use the current origin to avoid CORS issues
    return window.location.origin;
  }
  // Server-side: use environment-specific base URL
  return process.env.NODE_ENV === 'production'
    ? 'https://gcse-pal.vercel.app'
    : 'http://localhost:3000';
};

// Default headers
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Error types
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request/Response types
export interface APIOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  retries?: number;
  timeout?: number;
  skipAuth?: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Retry logic with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;

    // Only retry on network errors or 5xx server errors
    if (error instanceof APIError && error.status && error.status < 500) {
      throw error;
    }

    await sleep(delay);
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

// Main API client
export const api = {
  // Base request method
  request: async <T = any>(
    path: string,
    options: APIOptions = {}
  ): Promise<APIResponse<T>> => {
    const {
      body,
      retries = 2,
      timeout = 30000,
      skipAuth = false,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${getApiBase()}/api${path}`;

    // Debug logging for CORS issues
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request: ${url} (Origin: ${window.location.origin})`);
    }

    // Prepare headers
    const requestHeaders: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...headers,
    };

    // Add auth header if not skipped and we're on the client
    if (typeof window !== 'undefined' && !skipAuth) {
      // You can add custom auth logic here
      // For cookie-based auth, Next.js handles it automatically
      // For token-based auth, you might get it from localStorage or a context
      const token = localStorage.getItem('auth-token');
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    // Prepare request body
    const requestBody = body ? JSON.stringify(body) : undefined;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const executeRequest = async (): Promise<APIResponse<T>> => {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
        credentials: 'include', // Include cookies for authentication
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // If response is not JSON, use status text
        }

        throw new APIError(errorMessage, response.status, response);
      }

      // Parse response
      const data = await response.json();

      // Handle API-level errors
      if (!data.success && data.error) {
        throw new APIError(data.error, response.status, response);
      }

      return data;
    };

    try {
      return await retryWithBackoff(executeRequest, retries);
    } catch (error) {
      // Re-throw API errors as-is
      if (error instanceof APIError) {
        throw error;
      }

      // Wrap other errors
      throw new APIError(
        error instanceof Error ? error.message : 'Request failed',
        undefined,
        undefined
      );
    }
  },

  // HTTP methods
  get: <T = any>(path: string, options: Omit<APIOptions, 'body' | 'method'> = {}) =>
    api.request<T>(path, { ...options, method: 'GET' }),

  post: <T = any>(path: string, body?: any, options: Omit<APIOptions, 'body' | 'method'> = {}) =>
    api.request<T>(path, { ...options, method: 'POST', body }),

  put: <T = any>(path: string, body?: any, options: Omit<APIOptions, 'body' | 'method'> = {}) =>
    api.request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T = any>(path: string, body?: any, options: Omit<APIOptions, 'body' | 'method'> = {}) =>
    api.request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T = any>(path: string, options: Omit<APIOptions, 'body' | 'method'> = {}) =>
    api.request<T>(path, { ...options, method: 'DELETE' }),

  // Utility methods
  postForm: <T = any>(path: string, formData: FormData, options: Omit<APIOptions, 'body' | 'method'> = {}) =>
    api.request<T>(path, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData - browser sets it with boundary
      }
    }),

  // Server-side fetch helper (for SSR/SSG)
  server: {
    get: <T = any>(path: string, options: Omit<APIOptions, 'body' | 'method' | 'credentials'> = {}) =>
      api.request<T>(path, {
        ...options,
        method: 'GET',
        credentials: undefined, // No credentials on server
      }),

    post: <T = any>(path: string, body?: any, options: Omit<APIOptions, 'body' | 'method' | 'credentials'> = {}) =>
      api.request<T>(path, {
        ...options,
        method: 'POST',
        body,
        credentials: undefined, // No credentials on server
      }),
  },

  // Auth helpers
  auth: {
    // Set authentication token (for token-based auth)
    setToken: (token: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth-token', token);
      }
    },

    // Clear authentication token
    clearToken: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
      }
    },

    // Get current authentication token
    getToken: () => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('auth-token');
      }
      return null;
    },
  },
};

// Export types
export type { APIOptions, APIResponse };

// Export a simple fetcher for SWR/React Query
export const fetcher = (url: string) => api.get(url).then(res => res.data);

// Default export
export default api;