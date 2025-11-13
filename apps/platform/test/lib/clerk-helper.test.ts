import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAuthenticatedUser,
  syncUserWithDatabase,
  getDbUserFromClerkId,
  hasUserRole,
  ensureUserExists
} from '@/lib/clerk-helper'
import { testPrisma, createTestUser } from '../setup'

// Mock Clerk functions
const mockAuth = vi.fn()
const mockCurrentUser = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}))

describe('Clerk Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthenticatedUser', () => {
    it('should return authenticated user data when user is logged in', async () => {
      // Mock Clerk auth and currentUser
      mockAuth.mockResolvedValue({ userId: 'test_clerk_id' })
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        imageUrl: 'https://example.com/avatar.jpg',
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual({
        userId: 'test_clerk_id',
        email: 'test@example.com',
        name: 'John Doe',
        avatar: 'https://example.com/avatar.jpg',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
      })
    })

    it('should return null when user is not authenticated', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should return null when currentUser returns null', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_clerk_id' })
      mockCurrentUser.mockResolvedValue(null)

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })

    it('should handle user with no email address', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_clerk_id' })
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [],
        firstName: 'John',
        lastName: 'Doe',
      })

      const result = await getAuthenticatedUser()

      expect(result).toEqual({
        userId: 'test_clerk_id',
        email: undefined,
        name: 'John Doe',
        avatar: undefined,
        username: undefined,
        firstName: 'John',
        lastName: 'Doe',
      })
    })

    it('should use username as fallback for name when firstName and lastName are missing', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_clerk_id' })
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        username: 'johndoe',
      })

      const result = await getAuthenticatedUser()

      expect(result?.name).toBe('johndoe')
    })

    it('should use "User" as final fallback for name', async () => {
      mockAuth.mockResolvedValue({ userId: 'test_clerk_id' })
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      })

      const result = await getAuthenticatedUser()

      expect(result?.name).toBe('User')
    })

    it('should handle errors gracefully', async () => {
      mockAuth.mockRejectedValue(new Error('Clerk auth error'))

      const result = await getAuthenticatedUser()

      expect(result).toBeNull()
    })
  })

  describe('syncUserWithDatabase', () => {
    it('should create new user in database when user does not exist', async () => {
      const clerkUserId = 'new_clerk_id'

      mockCurrentUser.mockResolvedValue({
        emailAddresses: [{ emailAddress: 'newuser@example.com' }],
        firstName: 'New',
        lastName: 'User',
        imageUrl: 'https://example.com/newavatar.jpg',
      })

      const result = await syncUserWithDatabase(clerkUserId)

      expect(result).toEqual({
        id: expect.any(String),
        clerkId: clerkUserId,
        email: 'newuser@example.com',
        name: 'New User',
        avatar: 'https://example.com/newavatar.jpg',
        role: 'student',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })

      // Check that user settings were also created
      const userSettings = await testPrisma.userSettings.findUnique({
        where: { userId: result.id },
      })

      expect(userSettings).toBeTruthy()
      expect(userSettings?.theme).toBe('light')
      expect(userSettings?.emailNotifications).toBe(true)
    })

    it('should update existing user in database', async () => {
      // Create existing user
      const existingUser = await createTestUser({
        clerkId: 'existing_clerk_id',
        email: 'old@example.com',
        name: 'Old Name',
      })

      mockCurrentUser.mockResolvedValue({
        emailAddresses: [{ emailAddress: 'updated@example.com' }],
        firstName: 'Updated',
        lastName: 'Name',
        imageUrl: 'https://example.com/updated.jpg',
      })

      const result = await syncUserWithDatabase('existing_clerk_id')

      expect(result.email).toBe('updated@example.com')
      expect(result.name).toBe('Updated Name')
      expect(result.avatar).toBe('https://example.com/updated.jpg')
      expect(result.id).toBe(existingUser.id) // Same user ID
    })

    it('should throw error when user not found in Clerk', async () => {
      mockCurrentUser.mockResolvedValue(null)

      await expect(syncUserWithDatabase('nonexistent_clerk_id')).rejects.toThrow(
        'User not found in Clerk'
      )
    })

    it('should throw error when user email is missing', async () => {
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [],
        firstName: 'No',
        lastName: 'Email',
      })

      await expect(syncUserWithDatabase('no_email_clerk_id')).rejects.toThrow(
        'User email not found'
      )
    })
  })

  describe('getDbUserFromClerkId', () => {
    it('should return user from database when found', async () => {
      const testUser = await createTestUser({
        clerkId: 'findable_clerk_id',
      })

      const result = await getDbUserFromClerkId('findable_clerk_id')

      expect(result).toEqual({
        id: testUser.id,
        clerkId: testUser.clerkId,
        email: testUser.email,
        name: testUser.name,
        avatar: testUser.avatar,
        role: testUser.role,
        createdAt: testUser.createdAt,
        updatedAt: testUser.updatedAt,
        userSettings: expect.any(Object),
      })
    })

    it('should return null when user not found', async () => {
      const result = await getDbUserFromClerkId('nonexistent_clerk_id')

      expect(result).toBeNull()
    })

    it('should handle database errors gracefully', async () => {
      // Mock prisma to throw an error
      vi.spyOn(testPrisma.user, 'findUnique').mockRejectedValue(new Error('Database error'))

      const result = await getDbUserFromClerkId('error_clerk_id')

      expect(result).toBeNull()
    })
  })

  describe('hasUserRole', () => {
    it('should return true when user has required role', async () => {
      await createTestUser({
        clerkId: 'admin_clerk_id',
        role: 'admin',
      })

      const result = await hasUserRole('admin_clerk_id', ['admin', 'teacher'])

      expect(result).toBe(true)
    })

    it('should return false when user does not have required role', async () => {
      await createTestUser({
        clerkId: 'student_clerk_id',
        role: 'student',
      })

      const result = await hasUserRole('student_clerk_id', ['admin', 'teacher'])

      expect(result).toBe(false)
    })

    it('should return false when user not found', async () => {
      const result = await hasUserRole('nonexistent_clerk_id', ['admin'])

      expect(result).toBe(false)
    })

    it('should handle multiple required roles', async () => {
      await createTestUser({
        clerkId: 'teacher_clerk_id',
        role: 'teacher',
      })

      const result = await hasUserRole('teacher_clerk_id', ['admin', 'teacher', 'student'])

      expect(result).toBe(true)
    })
  })

  describe('ensureUserExists', () => {
    it('should return true when user exists in database', async () => {
      await createTestUser({
        clerkId: 'existing_db_user_clerk_id',
      })

      const result = await ensureUserExists('existing_db_user_clerk_id')

      expect(result).toBe(true)
    })

    it('should sync user when they do not exist in database', async () => {
      mockCurrentUser.mockResolvedValue({
        emailAddresses: [{ emailAddress: 'auto@example.com' }],
        firstName: 'Auto',
        lastName: 'Sync',
      })

      const result = await ensureUserExists('auto_sync_clerk_id')

      expect(result).toBe(true)

      // Verify user was created
      const user = await getDbUserFromClerkId('auto_sync_clerk_id')
      expect(user).toBeTruthy()
      expect(user?.email).toBe('auto@example.com')
    })

    it('should handle sync errors gracefully', async () => {
      mockCurrentUser.mockResolvedValue(null) // This will cause sync to fail

      const result = await ensureUserExists('sync_error_clerk_id')

      expect(result).toBe(false)
    })
  })
})