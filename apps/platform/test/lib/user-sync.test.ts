import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureUserExists, hasUserRole, getCurrentUser } from '@/lib/user-sync'
import { testPrisma, createTestUser } from '../setup'

// Mock Clerk authentication
const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/db', () => ({
  prisma: testPrisma,
}))

describe('User Sync Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ensureUserExists', () => {
    it('should return existing user from database', async () => {
      const existingUser = await createTestUser()
      mockAuth.mockResolvedValue({ userId: existingUser.clerkId })

      const result = await ensureUserExists()

      expect(result).toEqual({
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatar: existingUser.avatar || undefined,
      })
      expect(mockAuth).toHaveBeenCalled()
      expect(testPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: existingUser.clerkId },
      })
    })

    it('should create new user if not exists', async () => {
      const clerkUserId = 'new_clerk_user_123'
      mockAuth.mockResolvedValue({ userId: clerkUserId })

      testPrisma.user.findUnique = vi.fn().mockResolvedValue(null)
      testPrisma.user.create = vi.fn().mockResolvedValue({
        id: 'new_db_user_id',
        clerkId: clerkUserId,
        email: `user-${clerkUserId.slice(0, 8)}@example.com`,
        name: 'Test User',
        role: 'student',
        avatar: null,
      })

      testPrisma.userSettings.create = vi.fn().mockResolvedValue({
        userId: 'new_db_user_id',
        dailyGoal: 60,
        emailNotifications: true,
        pushNotifications: true,
        studyReminders: true,
        deadlineReminders: true,
        preferredStudyTime: 'evening',
        studyDays: JSON.stringify([1, 2, 3, 4, 5]),
        theme: 'light',
      })

      const result = await ensureUserExists()

      expect(result.email).toBe(`user-${clerkUserId.slice(0, 8)}@example.com`)
      expect(result.name).toBe('Test User')
      expect(testPrisma.user.create).toHaveBeenCalledWith({
        data: {
          clerkId: clerkUserId,
          email: `user-${clerkUserId.slice(0, 8)}@example.com`,
          name: 'Test User',
          role: 'student',
        },
      })
      expect(testPrisma.userSettings.create).toHaveBeenCalled()
    })

    it('should throw error if no userId found', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      await expect(ensureUserExists()).rejects.toThrow('Unauthorized: No user ID found')
      expect(mockAuth).toHaveBeenCalled()
    })

    it('should throw error if user creation fails', async () => {
      const clerkUserId = 'failing_user_123'
      mockAuth.mockResolvedValue({ userId: clerkUserId })

      testPrisma.user.findUnique = vi.fn().mockResolvedValue(null)
      testPrisma.user.create = vi.fn().mockRejectedValue(new Error('Database error'))

      await expect(ensureUserExists()).rejects.toThrow('Failed to create user in database')
    })

    it('should handle user with avatar', async () => {
      const userWithAvatar = await createTestUser({ avatar: 'https://example.com/avatar.jpg' })
      mockAuth.mockResolvedValue({ userId: userWithAvatar.clerkId })

      const result = await ensureUserExists()

      expect(result.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('should handle user with null avatar', async () => {
      const userWithoutAvatar = await createTestUser({ avatar: null })
      mockAuth.mockResolvedValue({ userId: userWithoutAvatar.clerkId })

      const result = await ensureUserExists()

      expect(result.avatar).toBeUndefined()
    })
  })

  describe('hasUserRole', () => {
    it('should return true for user with required role', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      const result = await hasUserRole(adminUser.clerkId, ['admin', 'teacher'])

      expect(result).toBe(true)
      expect(testPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: adminUser.clerkId },
        select: { role: true },
      })
    })

    it('should return true for user with teacher role when teacher is required', async () => {
      const teacherUser = await createTestUser({ role: 'teacher' })

      const result = await hasUserRole(teacherUser.clerkId, ['admin', 'teacher'])

      expect(result).toBe(true)
    })

    it('should return false for user without required role', async () => {
      const studentUser = await createTestUser({ role: 'student' })

      const result = await hasUserRole(studentUser.clerkId, ['admin', 'teacher'])

      expect(result).toBe(false)
    })

    it('should return false for non-existent user', async () => {
      testPrisma.user.findUnique = vi.fn().mockResolvedValue(null)

      const result = await hasUserRole('non_existent_clerk_id', ['admin'])

      expect(result).toBe(false)
    })

    it('should return false on database error', async () => {
      testPrisma.user.findUnique = vi.fn().mockRejectedValue(new Error('Database error'))

      const result = await hasUserRole('clerk_id', ['admin'])

      expect(result).toBe(false)
    })

    it('should handle single role requirement', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      const result = await hasUserRole(adminUser.clerkId, ['admin'])

      expect(result).toBe(true)
    })

    it('should handle empty roles array', async () => {
      const user = await createTestUser({ role: 'student' })

      const result = await hasUserRole(user.clerkId, [])

      expect(result).toBe(false)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const result = await getCurrentUser()

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || undefined,
      })
    })

    it('should call ensureUserExists', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      await getCurrentUser()

      expect(mockAuth).toHaveBeenCalled()
      expect(testPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: user.clerkId },
      })
    })
  })
})