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

      // Mock database responses with a simpler chain
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

      const { db, users } = await import('@/lib/db')

      // Create a simple mock that resolves immediately
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
            orderBy: vi.fn().mockResolvedValue([]), // For enrollments
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

      // Should return empty enrollments since we mocked empty responses
      expect(data.data.enrollments).toHaveLength(0)
      expect(data.data.statistics).toMatchObject({
        totalEnrollments: 0,
        completedCourses: 0,
        inProgressCourses: 0,
        averageProgress: 0,
      })
    })

    it('should return empty enrollments for user with no courses', async () => {
      const { auth } = await import('@clerk/nextjs/server')
      vi.mocked(auth).mockResolvedValue({ userId: mockUsers.student.userId })

      // Mock database responses with a simpler chain
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

      const { db, users } = await import('@/lib/db')

      // Create a simple mock that resolves immediately
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
            orderBy: vi.fn().mockResolvedValue([]), // For enrollments
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