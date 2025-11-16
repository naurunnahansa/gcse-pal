import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../../app/api/progress/track/route'
import { mockUsers, mockCourses, mockEnrollments, createMockRequest } from '../lib/test-utils'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
  users: {},
  lessonProgress: {},
  courseProgress: {},
  enrollments: {},
  courses: {},
  chapters: {},
  lessons: {},
}))

describe('/api/progress/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/progress/track', () => {
    it('should return error for unauthorized user', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null })

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: { lessonId: 'lesson_123', action: 'start' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return error for missing required fields', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: {}, // Missing lessonId and action
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing required fields: lessonId, action')
    })

    it('should return error for invalid action', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: { lessonId: 'lesson_123', action: 'invalid' },
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid action')
    })

    it('should start lesson progress successfully', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock user
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      // Mock enrollment
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUsers.student.id,
        courseId: mockCourses.math.id,
      }

      const { db, users, enrollments } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock enrollment query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEnrollment]),
          }),
        }),
      } as any)

      // Mock progress update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'progress_1' }]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: {
          lessonId: 'lesson_math_1',
          action: 'start',
          timeSpentSeconds: 0,
          videoPositionSeconds: 0,
        },
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        message: 'Progress tracked successfully',
        action: 'start',
        lessonId: 'lesson_math_1',
        courseId: mockCourses.math.id,
      })
    })

    it('should complete lesson progress successfully', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock user
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      // Mock enrollment
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUsers.student.id,
        courseId: mockCourses.math.id,
      }

      const { db, users, enrollments } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock enrollment query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEnrollment]),
          }),
        }),
      } as any)

      // Mock progress update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'progress_1', status: 'completed' }]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: {
          lessonId: 'lesson_math_1',
          action: 'complete',
          timeSpentSeconds: 1800, // 30 minutes
          videoPositionSeconds: 1795, // Near end
        },
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        message: 'Progress tracked successfully',
        action: 'complete',
        lessonId: 'lesson_math_1',
        courseId: mockCourses.math.id,
      })
    })

    it('should update lesson progress successfully', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock user
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      // Mock enrollment
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUsers.student.id,
        courseId: mockCourses.math.id,
      }

      const { db, users, enrollments } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock enrollment query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEnrollment]),
          }),
        }),
      } as any)

      // Mock progress update
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'progress_1', status: 'in_progress' }]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: {
          lessonId: 'lesson_math_1',
          action: 'update',
          timeSpentSeconds: 900, // 15 minutes
          videoPositionSeconds: 600, // 10 minutes in
        },
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        message: 'Progress tracked successfully',
        action: 'update',
        lessonId: 'lesson_math_1',
        courseId: mockCourses.math.id,
      })
    })

    it('should return error for user with no enrollments', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock user
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      const { db, users, enrollments } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock empty enrollment query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: {
          lessonId: 'lesson_math_1',
          action: 'start',
        },
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('User has no enrollments')
    })

    it('should handle database errors gracefully', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock database error
      const { db } = await import('@/lib/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: {
          lessonId: 'lesson_math_1',
          action: 'start',
        },
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/progress/track', () => {
    it('should return error for unauthorized user', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null })

      const request = createMockRequest('http://localhost:3000/api/progress/track?lessonId=lesson_123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return error for missing lessonId parameter', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      const request = createMockRequest('http://localhost:3000/api/progress/track', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Missing lessonId parameter')
    })

    it('should return lesson progress for authenticated user', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock user
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      // Mock enrollment
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUsers.student.id,
        courseId: mockCourses.math.id,
      }

      // Mock progress records
      const mockProgress = [
        {
          id: 'progress_1',
          enrollmentId: 'enrollment_1',
          lessonId: 'lesson_math_1',
          status: 'in_progress',
          timeSpentSeconds: 900,
          videoPositionSeconds: 600,
          updatedAt: new Date(),
        },
        {
          id: 'progress_2',
          enrollmentId: 'enrollment_1',
          lessonId: 'lesson_math_1',
          status: 'completed',
          timeSpentSeconds: 1800,
          videoPositionSeconds: 1795,
          updatedAt: new Date(Date.now() + 60000), // More recent
        },
      ]

      const { db, users, enrollments, lessonProgress } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock enrollment query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEnrollment]),
          }),
        }),
      } as any)

      // Mock progress query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockProgress),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track?lessonId=lesson_math_1', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)

      // Should be ordered by updatedAt (most recent first)
      expect(data.data[0]).toMatchObject({
        id: 'progress_2',
        lessonId: 'lesson_math_1',
        status: 'completed',
        timeSpentSeconds: 1800,
        videoPositionSeconds: 1795,
      })

      expect(data.data[1]).toMatchObject({
        id: 'progress_1',
        lessonId: 'lesson_math_1',
        status: 'in_progress',
        timeSpentSeconds: 900,
        videoPositionSeconds: 600,
      })
    })

    it('should return empty array for lesson with no progress', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock user
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      // Mock enrollment
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUsers.student.id,
        courseId: mockCourses.math.id,
      }

      const { db, users, enrollments, lessonProgress } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock enrollment query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockEnrollment]),
          }),
        }),
      } as any)

      // Mock empty progress query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/progress/track?lessonId=lesson_new', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(0)
    })
  })
})