import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../app/api/enrollments/my/route'
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
          limit: vi.fn().mockReturnValue({
            then: vi.fn().mockImplementation((callback) => callback([])),
          }),
        }),
      }),
    }),
  },
  users: {},
  enrollments: {},
  courses: {},
  chapters: {},
  lessons: {},
  lessonProgress: {},
}))

describe('/api/enrollments/my', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/enrollments/my', () => {
    it('should return error for unauthorized user', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: null })

      const request = createMockRequest('http://localhost:3000/api/enrollments/my')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return error for user not found in database', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock empty user result
      const { db, users } = await import('@/lib/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/enrollments/my', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('User not found')
    })

    it('should return user enrollments with progress', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock database responses
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUserEnrollments = [mockEnrollments.studentMath]
      const mockEnrolledCourses = [mockCourses.math]
      const mockCourseChapters = [
        {
          id: 'chapter_math_1',
          title: 'Algebra Basics',
          duration: 3600,
          position: 1,
          courseId: mockCourses.math.id,
        },
      ]
      const mockChapterLessons = [
        {
          id: 'lesson_math_1',
          chapterId: 'chapter_math_1',
          title: 'Introduction to Variables',
        },
      ]
      const mockUserProgress = [
        {
          courseId: mockCourses.math.id,
          lessonId: 'lesson_math_1',
          status: 'completed',
          lastAccessed: new Date(),
        },
      ]

      const { db, users, enrollments, courses, chapters, lessons, lessonProgress } = await import('@/lib/db')

      // Mock user query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      } as any)

      // Mock enrollments query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockUserEnrollments),
          }),
        }),
      } as any)

      // Mock courses query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            then: vi.fn().mockResolvedValue(mockEnrolledCourses),
          }),
        }),
      } as any)

      // Mock chapters query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockCourseChapters),
          }),
        }),
      } as any)

      // Mock lessons query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            then: vi.fn().mockResolvedValue(mockChapterLessons),
          }),
        }),
      } as any)

      // Mock progress query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            then: vi.fn().mockResolvedValue(mockUserProgress),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/enrollments/my', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('enrollments')
      expect(data.data).toHaveProperty('statistics')

      // Check enrollment structure
      expect(data.data.enrollments).toHaveLength(1)
      const enrollment = data.data.enrollments[0]
      expect(enrollment).toMatchObject({
        courseId: mockCourses.math.id,
        course: {
          id: mockCourses.math.id,
          title: mockCourses.math.title,
          subject: mockCourses.math.subject,
          level: mockCourses.math.level,
          thumbnailUrl: mockCourses.math.thumbnailUrl,
          slug: mockCourses.math.slug,
          status: mockCourses.math.status,
          chaptersCount: 1,
          totalLessons: 1,
        },
        progress: expect.any(Number),
        status: 'active',
      })

      // Check statistics
      expect(data.data.statistics).toMatchObject({
        totalEnrollments: 1,
        completedCourses: 0,
        inProgressCourses: 1,
        averageProgress: expect.any(Number),
      })
    })

    it('should return empty enrollments for user with no courses', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock database user but no enrollments
      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      // Mock empty enrollments query
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/enrollments/my', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.enrollments).toHaveLength(0)
      expect(data.data.statistics).toMatchObject({
        totalEnrollments: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        averageProgress: 0,
      })
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

      const request = createMockRequest('http://localhost:3000/api/enrollments/my', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
})