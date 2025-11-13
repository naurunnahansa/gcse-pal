import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getLesson, POST as updateLesson } from '@/app/api/lessons/[id]/route'
import { testPrisma, createTestUser, createTestCourse, createTestEnrollment } from '../setup'

// Mock Clerk authentication
const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

describe('Lessons API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/lessons/[id]', () => {
    it('should return lesson details for enrolled user', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      // Create chapter and lesson
      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          description: 'A test chapter',
          order: 1,
          duration: 600,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Test Lesson',
          description: 'A test lesson',
          order: 1,
          duration: 120,
          hasVideo: true,
          hasMarkdown: true,
          isPublished: true,
          videoUrl: 'https://example.com/video.mp4',
          markdownPath: '/content/test.md',
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`)
      const response = await getLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lesson.id).toBe(lesson.id)
      expect(data.lesson.title).toBe('Test Lesson')
      expect(data.lesson.chapter.title).toBe('Test Chapter')
      expect(data.lesson.chapter.course.title).toBe(course.title)
      expect(data.lesson.navigation).toBeDefined()
      expect(data.lesson.navigation.previous).toBeNull()
      expect(data.lesson.navigation.next).toBeNull()
      expect(data.lesson.userProgress).toBeNull()
    })

    it('should include user progress if it exists', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          description: 'A test chapter',
          order: 1,
          duration: 600,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Test Lesson',
          description: 'A test lesson',
          order: 1,
          duration: 120,
          hasVideo: true,
          isPublished: true,
        },
      })

      // Create progress record
      await testPrisma.progress.create({
        data: {
          userId: user.id,
          courseId: course.id,
          chapterId: chapter.id,
          lessonId: lesson.id,
          status: 'in_progress',
          timeSpent: 600,
          score: 0,
          startedAt: new Date(),
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`)
      const response = await getLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lesson.userProgress).toBeTruthy()
      expect(data.lesson.userProgress.status).toBe('in_progress')
      expect(data.lesson.userProgress.timeSpent).toBe(600)
    })

    it('should provide navigation to previous and next lessons', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          description: 'A test chapter',
          order: 1,
          duration: 600,
          isPublished: true,
        },
      })

      // Create multiple lessons
      const lesson1 = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Lesson 1',
          description: 'First lesson',
          order: 1,
          duration: 120,
          isPublished: true,
        },
      })

      const lesson2 = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Lesson 2',
          description: 'Second lesson',
          order: 2,
          duration: 120,
          isPublished: true,
        },
      })

      const lesson3 = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Lesson 3',
          description: 'Third lesson',
          order: 3,
          duration: 120,
          isPublished: true,
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      // Get middle lesson
      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson2.id}`)
      const response = await getLesson(request, { params: { id: lesson2.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lesson.navigation.previous.id).toBe(lesson1.id)
      expect(data.lesson.navigation.next.id).toBe(lesson3.id)
    })

    it('should return completion count for lesson', async () => {
      const user1 = await createTestUser({ clerkId: 'user1_clerk_id' })
      const user2 = await createTestUser({ clerkId: 'user2_clerk_id' })
      const user3 = await createTestUser({ clerkId: 'user3_clerk_id' })

      const course = await createTestCourse()
      await createTestEnrollment(user1.id, course.id)
      await createTestEnrollment(user2.id, course.id)
      await createTestEnrollment(user3.id, course.id)

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Test Lesson',
          order: 1,
          isPublished: true,
        },
      })

      // Create completed progress for 2 users
      for (const user of [user1, user2]) {
        await testPrisma.progress.create({
          data: {
            userId: user.id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lesson.id,
            status: 'completed',
            timeSpent: 1200,
            score: 90,
            completedAt: new Date(),
          },
        })
      }

      // Create in-progress for 1 user
      await testPrisma.progress.create({
        data: {
          userId: user3.id,
          courseId: course.id,
          chapterId: chapter.id,
          lessonId: lesson.id,
          status: 'in_progress',
          timeSpent: 600,
          score: 0,
        },
      })

      mockAuth.mockResolvedValue({ userId: user1.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`)
      const response = await getLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lesson.completionCount).toBe(2)
    })

    it('should return 403 for user not enrolled in course', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      // Note: No enrollment created

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Test Lesson',
          order: 1,
          isPublished: true,
        },
      })

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`)
      const response = await getLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Not enrolled in this course')
    })

    it('should return 404 for non-existent lesson', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const fakeId = 'non-existent-lesson-id'
      const request = new NextRequest(`http://localhost:3000/api/lessons/${fakeId}`)
      const response = await getLesson(request, { params: { id: fakeId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Lesson not found')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/lessons/test-id')
      const response = await getLesson(request, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/lessons/[id] (content update)', () => {
    it('should allow admin to update lesson content', async () => {
      const adminUser = await createTestUser({ role: 'admin' })
      const course = await createTestCourse({ instructorId: adminUser.id })

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Original Lesson',
          order: 1,
          isPublished: true,
          hasVideo: false,
          hasMarkdown: false,
        },
      })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })

      const updateData = {
        content: 'Updated lesson content with markdown',
        videoUrl: 'https://example.com/new-video.mp4',
        videoDuration: 1800,
        isPublished: true,
      }

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lesson.content).toBe('Updated lesson content with markdown')
      expect(data.lesson.videoUrl).toBe('https://example.com/new-video.mp4')
      expect(data.lesson.videoDuration).toBe(1800)
      expect(data.lesson.hasVideo).toBe(true)
      expect(data.lesson.hasMarkdown).toBe(true)
    })

    it('should allow teacher who is course instructor to update lesson', async () => {
      const teacherUser = await createTestUser({ role: 'teacher' })
      const course = await createTestCourse({ instructorId: teacherUser.id })

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Teacher Lesson',
          order: 1,
          isPublished: true,
        },
      })

      mockAuth.mockResolvedValue({ userId: teacherUser.clerkId })

      const updateData = {
        content: 'Teacher updated content',
        markdownPath: '/content/teacher-lesson.md',
      }

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lesson.content).toBe('Teacher updated content')
      expect(data.lesson.markdownPath).toBe('/content/teacher-lesson.md')
    })

    it('should prevent teacher who is not course instructor from updating lesson', async () => {
      const teacherUser = await createTestUser({ role: 'teacher' })
      const anotherTeacher = await createTestUser({ role: 'teacher', clerkId: 'another_teacher' })
      const course = await createTestCourse({ instructorId: anotherTeacher.id })

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Restricted Lesson',
          order: 1,
          isPublished: true,
        },
      })

      mockAuth.mockResolvedValue({ userId: teacherUser.clerkId })

      const updateData = {
        content: 'Should not be allowed',
      }

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Forbidden: Only course instructor or admin can edit lessons')
    })

    it('should prevent student from updating lesson content', async () => {
      const studentUser = await createTestUser({ role: 'student' })
      const course = await createTestCourse()

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Student Restricted Lesson',
          order: 1,
          isPublished: true,
        },
      })

      mockAuth.mockResolvedValue({ userId: studentUser.clerkId })

      const updateData = {
        content: 'Student should not be able to do this',
      }

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Forbidden: Admin or teacher access required')
    })

    it('should return 404 for non-existent lesson', async () => {
      const adminUser = await createTestUser({ role: 'admin' })
      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })

      const fakeId = 'non-existent-lesson-id'
      const updateData = { content: 'Updated content' }

      const request = new NextRequest(`http://localhost:3000/api/lessons/${fakeId}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: fakeId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Lesson not found')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/lessons/test-id', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: 'test-id' } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should update only provided fields', async () => {
      const adminUser = await createTestUser({ role: 'admin' })
      const course = await createTestCourse({ instructorId: adminUser.id })

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      const lesson = await testPrisma.lesson.create({
        data: {
          chapterId: chapter.id,
          title: 'Original Title',
          description: 'Original description',
          order: 1,
          isPublished: true,
          hasVideo: true,
          hasMarkdown: true,
          videoUrl: 'https://example.com/original.mp4',
          markdownPath: '/content/original.md',
        },
      })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })

      // Update only content
      const updateData = {
        content: 'New content only',
      }

      const request = new NextRequest(`http://localhost:3000/api/lessons/${lesson.id}`, {
        method: 'POST',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await updateLesson(request, { params: { id: lesson.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.lesson.content).toBe('New content only')
      expect(data.lesson.title).toBe('Original Title') // Unchanged
      expect(data.lesson.description).toBe('Original description') // Unchanged
      expect(data.lesson.videoUrl).toBe('https://example.com/original.mp4') // Unchanged
    })
  })
})