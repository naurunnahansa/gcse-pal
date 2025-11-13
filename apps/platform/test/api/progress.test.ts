import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as trackProgress } from '@/app/api/progress/track/route'
import { GET as getAnalytics } from '@/app/api/progress/analytics/route'
import { testPrisma, createTestUser, createTestCourse, createTestEnrollment } from '../setup'

// Mock Clerk authentication
const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

describe('Progress Tracking API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/progress/track', () => {
    it('should create progress record for lesson completion', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const progressData = {
        courseId: course.id,
        chapterId: 'test-chapter-id',
        lessonId: 'test-lesson-id',
        status: 'completed',
        timeSpent: 1800, // 30 minutes
        score: 95,
      }

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify(progressData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await trackProgress(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.progress.status).toBe('completed')
      expect(data.progress.timeSpent).toBe(1800)
      expect(data.progress.score).toBe(95)

      // Verify progress record was created
      const progressRecord = await testPrisma.progress.findUnique({
        where: {
          userId_courseId_chapterId_lessonId: {
            userId: user.id,
            courseId: course.id,
            chapterId: 'test-chapter-id',
            lessonId: 'test-lesson-id',
          },
        },
      })

      expect(progressRecord).toBeTruthy()
      expect(progressRecord?.status).toBe('completed')
    })

    it('should update existing progress record', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      // Create initial progress record
      await testPrisma.progress.create({
        data: {
          userId: user.id,
          courseId: course.id,
          chapterId: 'test-chapter-id',
          lessonId: 'test-lesson-id',
          status: 'in_progress',
          timeSpent: 900, // 15 minutes
          score: 0,
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const progressData = {
        courseId: course.id,
        chapterId: 'test-chapter-id',
        lessonId: 'test-lesson-id',
        status: 'completed',
        timeSpent: 2400, // 40 minutes total
        score: 88,
      }

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify(progressData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await trackProgress(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.progress.status).toBe('completed')
      expect(data.progress.timeSpent).toBe(2400)
      expect(data.progress.score).toBe(88)
    })

    it('should create study session for progress tracking', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const progressData = {
        courseId: course.id,
        chapterId: 'test-chapter-id',
        lessonId: 'test-lesson-id',
        status: 'in_progress',
        timeSpent: 600, // 10 minutes
        sessionData: {
          startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 600,
        },
      }

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify(progressData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await trackProgress(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify study session was created
      const studySession = await testPrisma.studySession.findFirst({
        where: {
          userId: user.id,
          courseId: course.id,
        },
      })

      expect(studySession).toBeTruthy()
      expect(studySession?.duration).toBe(600)
    })

    it('should return 403 for user not enrolled in course', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      // Note: No enrollment created

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const progressData = {
        courseId: course.id,
        chapterId: 'test-chapter-id',
        lessonId: 'test-lesson-id',
        status: 'in_progress',
      }

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify(progressData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await trackProgress(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Not enrolled in this course')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await trackProgress(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should validate required fields', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const invalidData = {
        courseId: course.id,
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await trackProgress(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })

    it('should update enrollment progress percentage', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      const enrollment = await createTestEnrollment(user.id, course.id)

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      // Create multiple progress records
      const progressData = {
        courseId: course.id,
        chapterId: 'test-chapter-id',
        lessonId: 'test-lesson-id',
        status: 'completed',
        timeSpent: 1200,
        score: 90,
      }

      const request = new NextRequest('http://localhost:3000/api/progress/track', {
        method: 'POST',
        body: JSON.stringify(progressData),
        headers: { 'Content-Type': 'application/json' },
      })

      await trackProgress(request)

      // Check if enrollment progress was updated
      const updatedEnrollment = await testPrisma.enrollment.findUnique({
        where: { id: enrollment.id },
      })

      expect(updatedEnrollment?.progress).toBeGreaterThan(0)
    })
  })

  describe('GET /api/progress/analytics', () => {
    it('should return progress analytics for user', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      // Create some progress data
      await testPrisma.progress.create({
        data: {
          userId: user.id,
          courseId: course.id,
          chapterId: 'chapter-1',
          lessonId: 'lesson-1',
          status: 'completed',
          timeSpent: 1800,
          score: 95,
          completedAt: new Date(),
        },
      })

      await testPrisma.studySession.create({
        data: {
          userId: user.id,
          courseId: course.id,
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          endTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          duration: 3600, // 1 hour
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest('http://localhost:3000/api/progress/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analytics).toBeDefined()
      expect(data.analytics.totalStudyTime).toBe(3600)
      expect(data.analytics.completedLessons).toBe(1)
      expect(data.analytics.averageScore).toBe(95)
    })

    it('should return filtered analytics by course', async () => {
      const user = await createTestUser()
      const course1 = await createTestCourse({ title: 'Course 1' })
      const course2 = await createTestCourse({ title: 'Course 2' })

      await createTestEnrollment(user.id, course1.id)
      await createTestEnrollment(user.id, course2.id)

      // Create progress for course 1 only
      await testPrisma.progress.create({
        data: {
          userId: user.id,
          courseId: course1.id,
          chapterId: 'chapter-1',
          lessonId: 'lesson-1',
          status: 'completed',
          timeSpent: 1200,
          score: 85,
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/progress/analytics?courseId=${course1.id}`)
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalStudyTime).toBe(1200)
      expect(data.analytics.completedLessons).toBe(1)
    })

    it('should return date range filtered analytics', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      // Create study session within date range
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

      await testPrisma.studySession.create({
        data: {
          userId: user.id,
          courseId: course.id,
          startTime: twoDaysAgo,
          endTime: yesterday,
          duration: 3600,
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const startDate = twoDaysAgo.toISOString().split('T')[0]
      const endDate = yesterday.toISOString().split('T')[0]

      const request = new NextRequest(
        `http://localhost:3000/api/progress/analytics?startDate=${startDate}&endDate=${endDate}`
      )
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.totalStudyTime).toBe(3600)
    })

    it('should return study streak information', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      // Create study sessions for consecutive days
      const today = new Date()
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

      for (const date of [twoDaysAgo, yesterday, today]) {
        await testPrisma.studySession.create({
          data: {
            userId: user.id,
            courseId: course.id,
            startTime: new Date(date.setHours(9, 0, 0, 0)),
            endTime: new Date(date.setHours(10, 0, 0, 0)),
            duration: 3600,
          },
        })
      }

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest('http://localhost:3000/api/progress/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.analytics.studyStreak).toBeGreaterThanOrEqual(3)
    })

    it('should return empty analytics for new user', async () => {
      const user = await createTestUser()

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest('http://localhost:3000/api/progress/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analytics.totalStudyTime).toBe(0)
      expect(data.analytics.completedLessons).toBe(0)
      expect(data.analytics.studyStreak).toBe(0)
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/progress/analytics')
      const response = await getAnalytics(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })
})