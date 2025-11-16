import { NextRequest } from 'next/server'

// Mock user data for testing
export const mockUsers = {
  admin: {
    userId: 'user_admin_123',
    id: '1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'admin' as const,
  },
  teacher: {
    userId: 'user_teacher_456',
    id: '2',
    email: 'teacher@test.com',
    name: 'Teacher User',
    role: 'teacher' as const,
  },
  student: {
    userId: 'user_student_789',
    id: '3',
    email: 'student@test.com',
    name: 'Student User',
    role: 'student' as const,
  }
}

// Mock course data
export const mockCourses = {
  math: {
    id: 'course_math_1',
    title: 'GCSE Mathematics',
    description: 'Complete GCSE Mathematics course',
    subject: 'mathematics',
    level: 'gcse',
    status: 'published' as const,
    slug: 'gcse-mathematics',
    thumbnailUrl: 'https://example.com/math-thumb.jpg',
  },
  english: {
    id: 'course_english_1',
    title: 'GCSE English Literature',
    description: 'Complete GCSE English Literature course',
    subject: 'english',
    level: 'gcse',
    status: 'published' as const,
    slug: 'gcse-english-literature',
    thumbnailUrl: 'https://example.com/english-thumb.jpg',
  }
}

// Mock lesson data
export const mockLessons = {
  mathLesson1: {
    id: 'lesson_math_1',
    title: 'Introduction to Algebra',
    description: 'Basic algebra concepts',
    videoUrl: 'https://example.com/math-lesson-1.mp4',
    videoDurationSeconds: 1800, // 30 minutes
    position: 1,
    chapterId: 'chapter_math_1',
    muxAssetId: 'mux_asset_123',
    muxPlaybackId: 'mux_playback_123',
    muxUploadId: 'mux_upload_123',
    muxStatus: 'ready' as const,
  }
}

// Mock enrollment data
export const mockEnrollments = {
  studentMath: {
    id: 'enrollment_1',
    userId: '3',
    courseId: 'course_math_1',
    status: 'active' as const,
    progress: 25,
    enrolledAt: new Date('2024-01-15T10:00:00Z'),
  }
}

// Helper function to create mock NextRequest
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    userId?: string
  } = {}
): NextRequest {
  const { method = 'GET', body, headers = {}, userId } = options

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body) {
    requestInit.body = JSON.stringify(body)
  }

  const request = new NextRequest(url, requestInit)

  // Mock Clerk auth
  if (userId) {
    ;(request as any).auth = () => Promise.resolve({ userId })
  }

  return request
}

// Helper function to create mock API context
export function createMockContext(params?: Record<string, string>) {
  return {
    params: Promise.resolve(params || {}),
  }
}

// Helper to wait for async operations
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))