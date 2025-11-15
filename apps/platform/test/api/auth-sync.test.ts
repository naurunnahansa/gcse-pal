import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, GET } from '@/app/api/auth/sync/route'
import { NextRequest } from 'next/server'

// Mock Clerk authentication and helper functions
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))

vi.mock('@/lib/clerk-helper', () => ({
  getAuthenticatedUser: vi.fn(),
  syncUserWithDatabase: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

import { auth, currentUser } from '@clerk/nextjs/server'
import { getAuthenticatedUser, syncUserWithDatabase } from '@/lib/clerk-helper'
import { prisma } from '@/lib/db'

const mockAuth = vi.mocked(auth)
const mockCurrentUser = vi.mocked(currentUser)
const mockGetAuthenticatedUser = vi.mocked(getAuthenticatedUser)
const mockSyncUserWithDatabase = vi.mocked(syncUserWithDatabase)
const mockPrismaUser = vi.mocked(prisma.user)

describe('Auth Sync API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/auth/sync', () => {
    it('should sync user with database successfully', async () => {
      const clerkUser = {
        userId: 'clerk_123',
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }

      const syncedUser = {
        id: 'db_123',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        role: 'student',
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockSyncUserWithDatabase.mockResolvedValue(syncedUser)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('db_123')
      expect(data.data.clerkId).toBe('clerk_123')
      expect(data.data.email).toBe('test@example.com')
      expect(data.data.name).toBe('Test User')
      expect(data.data.username).toBe('testuser')
      expect(mockSyncUserWithDatabase).toHaveBeenCalledWith('clerk_123')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
      expect(mockSyncUserWithDatabase).not.toHaveBeenCalled()
    })

    it('should handle sync errors gracefully', async () => {
      const clerkUser = {
        userId: 'clerk_123',
        username: 'testuser',
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockSyncUserWithDatabase.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle user with avatar', async () => {
      const clerkUser = {
        userId: 'clerk_123',
        username: 'testuser',
        imageUrl: 'https://example.com/avatar.jpg',
      }

      const syncedUser = {
        id: 'db_123',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        role: 'student',
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockSyncUserWithDatabase.mockResolvedValue(syncedUser)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.avatar).toBe('https://example.com/avatar.jpg')
    })
  })

  describe('GET /api/auth/sync', () => {
    it('should return existing user data', async () => {
      const clerkUser = {
        userId: 'clerk_123',
        username: 'testuser',
      }

      const existingUser = {
        id: 'db_123',
        clerkId: 'clerk_123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        role: 'student',
        userSettings: {
          theme: 'light',
          emailNotifications: true,
          pushNotifications: false,
          studyReminders: true,
          deadlineReminders: true,
          dailyGoal: 60,
          preferredStudyTime: 'morning',
          studyDays: ['monday', 'wednesday', 'friday'],
        },
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockPrismaUser.findUnique.mockResolvedValue(existingUser)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('db_123')
      expect(data.data.username).toBe('testuser')
      expect(data.data.settings).toEqual({
        theme: 'light',
        emailNotifications: true,
        pushNotifications: false,
        studyReminders: true,
        deadlineReminders: true,
        dailyGoal: 60,
        preferredStudyTime: 'morning',
        studyDays: ['monday', 'wednesday', 'friday'],
      })
    })

    it('should create user if not exists in database', async () => {
      const clerkUser = {
        userId: 'clerk_new',
        username: 'newuser',
      }

      const newUser = {
        id: 'db_new',
        clerkId: 'clerk_new',
        email: 'new@example.com',
        name: 'New User',
        avatar: null,
        role: 'student',
        userSettings: {
          theme: 'dark',
          emailNotifications: false,
          pushNotifications: true,
          studyReminders: false,
          deadlineReminders: false,
          dailyGoal: 30,
          preferredStudyTime: 'evening',
          studyDays: ['tuesday', 'thursday'],
        },
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockSyncUserWithDatabase.mockResolvedValue(newUser)
      mockPrismaUser.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newUser)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('db_new')
      expect(mockSyncUserWithDatabase).toHaveBeenCalledWith('clerk_new')
    })

    it('should return 401 for unauthenticated user on GET', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 500 if user creation fails', async () => {
      const clerkUser = {
        userId: 'clerk_fail',
        username: 'failuser',
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockSyncUserWithDatabase.mockResolvedValue(null)
      mockPrismaUser.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create user')
    })

    it('should handle user without settings', async () => {
      const clerkUser = {
        userId: 'clerk_no_settings',
        username: 'nosettings',
      }

      const userWithoutSettings = {
        id: 'db_no_settings',
        clerkId: 'clerk_no_settings',
        email: 'nosettings@example.com',
        name: 'No Settings User',
        avatar: null,
        role: 'student',
        userSettings: null,
      }

      mockGetAuthenticatedUser.mockResolvedValue(clerkUser)
      mockPrismaUser.findUnique.mockResolvedValue(userWithoutSettings)

      const request = new NextRequest('http://localhost:3000/api/auth/sync', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.settings).toBeNull()
    })
  })
})