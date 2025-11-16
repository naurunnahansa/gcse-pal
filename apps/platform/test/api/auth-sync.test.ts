import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'
import { GET, POST } from '../../app/api/auth/sync/route'
import { mockUsers, createMockRequest } from '../lib/test-utils'

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
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
  },
  users: {},
}))

// Mock clerk helper
vi.mock('@/lib/clerk-helper', () => ({
  getAuthenticatedUser: vi.fn(),
  syncUserWithDatabase: vi.fn(),
}))

describe('/api/auth/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/sync', () => {
    it('should return error for unauthorized user', async () => {
      // Mock unauthenticated user
      const { getAuthenticatedUser } = await import('@/lib/clerk-helper')
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should sync user successfully', async () => {
      // Mock authenticated user
      const { getAuthenticatedUser, syncUserWithDatabase } = await import('@/lib/clerk-helper')
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        userId: mockUsers.student.userId,
        username: 'student_user',
      })

      const mockUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
      }

      vi.mocked(syncUserWithDatabase).mockResolvedValue(mockUser)

      const request = createMockRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Check the main fields are present
      expect(data.data.id).toBe(mockUsers.student.id)
      expect(data.data.clerkId).toBe(mockUsers.student.userId)
      expect(data.data.email).toBe(mockUsers.student.email)
      expect(data.data.name).toBe(mockUsers.student.name)
      expect(data.data.role).toBe(mockUsers.student.role)
      expect(data.data.username).toBe('student_user')

      // Check that avatar field exists (even if null)
      expect(data.data).toHaveProperty('avatar')

      expect(getAuthenticatedUser).toHaveBeenCalled()
      expect(syncUserWithDatabase).toHaveBeenCalledWith(mockUsers.student.userId)
    })

    it('should handle database errors gracefully', async () => {
      // Mock authenticated user
      const { getAuthenticatedUser } = await import('@/lib/clerk-helper')
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        userId: mockUsers.student.userId,
      })

      // Mock database error
      const { syncUserWithDatabase } = await import('@/lib/clerk-helper')
      vi.mocked(syncUserWithDatabase).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        userId: mockUsers.student.userId,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('GET /api/auth/sync', () => {
    it('should return error for unauthorized user', async () => {
      // Mock unauthenticated user
      const { getAuthenticatedUser } = await import('@/lib/clerk-helper')
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/auth/sync')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return user data for authenticated user', async () => {
      // Mock authenticated user
      const { getAuthenticatedUser } = await import('@/lib/clerk-helper')
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        userId: mockUsers.student.userId,
        username: 'student_user',
      })

      // Mock database user
      const mockDbUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const { db } = await import('@/lib/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDbUser]),
          }),
        }),
      } as any)

      const request = createMockRequest('http://localhost:3000/api/auth/sync', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Check the main fields are present
      expect(data.data.id).toBe(mockUsers.student.id)
      expect(data.data.clerkId).toBe(mockUsers.student.userId)
      expect(data.data.email).toBe(mockUsers.student.email)
      expect(data.data.name).toBe(mockUsers.student.name)
      expect(data.data.role).toBe(mockUsers.student.role)
      expect(data.data.username).toBe('student_user')

      // Check that avatar field exists (even if null)
      expect(data.data).toHaveProperty('avatar')
    })

    it('should handle user not found in database', async () => {
      // Mock authenticated user
      const { getAuthenticatedUser, syncUserWithDatabase } = await import('@/lib/clerk-helper')
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        userId: mockUsers.student.userId,
        username: 'student_user',
      })

      // Mock empty database result for first call, but return user for second call
      const mockDbUser = {
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        email: mockUsers.student.email,
        name: mockUsers.student.name,
        avatar: null,
        role: mockUsers.student.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const { db } = await import('@/lib/db')

      // Mock the first database call (returns empty)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

      // Mock the second database call (returns the created user)
      vi.mocked(db.select).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockDbUser]),
          }),
        }),
      } as any)

      // Mock user sync
      vi.mocked(syncUserWithDatabase).mockResolvedValue(mockDbUser)

      const request = createMockRequest('http://localhost:3000/api/auth/sync', {
        userId: mockUsers.student.userId,
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        id: mockUsers.student.id,
        clerkId: mockUsers.student.userId,
        username: 'student_user',
        settings: null,
      })

      expect(syncUserWithDatabase).toHaveBeenCalledWith(mockUsers.student.userId)
    })
  })
})