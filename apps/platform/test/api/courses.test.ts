import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getCourses, POST as createCourse } from '@/app/api/courses/route'
import { GET as getCourse, POST as enrollInCourse } from '@/app/api/courses/[id]/route'
import { testPrisma, createTestUser, createTestCourse, createTestEnrollment } from '../setup'

// Mock Clerk authentication
const mockAuth = vi.fn()
vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

describe('Courses API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/courses', () => {
    it('should return courses list for authenticated user', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const courses = [
        await createTestCourse({ title: 'Math Course', subject: 'mathematics' }),
        await createTestCourse({ title: 'English Course', subject: 'english' }),
      ]

      const request = new NextRequest('http://localhost:3000/api/courses')
      const response = await getCourses(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.courses).toHaveLength(2)
      expect(data.courses[0].title).toBe('Math Course')
      expect(data.courses[1].title).toBe('English Course')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/courses')
      const response = await getCourses(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
    })

    it('should filter courses by subject', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      await createTestCourse({ title: 'Math Course', subject: 'mathematics' })
      await createTestCourse({ title: 'English Course', subject: 'english' })

      const request = new NextRequest('http://localhost:3000/api/courses?subject=mathematics')
      const response = await getCourses(request)
      const data = await response.json()

      expect(data.courses).toHaveLength(1)
      expect(data.courses[0].subject).toBe('mathematics')
    })

    it('should filter courses by difficulty', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      await createTestCourse({ title: 'Beginner Course', difficulty: 'beginner' })
      await createTestCourse({ title: 'Advanced Course', difficulty: 'advanced' })

      const request = new NextRequest('http://localhost:3000/api/courses?difficulty=beginner')
      const response = await getCourses(request)
      const data = await response.json()

      expect(data.courses).toHaveLength(1)
      expect(data.courses[0].difficulty).toBe('beginner')
    })

    it('should search courses by title and description', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      await createTestCourse({
        title: 'Algebra Fundamentals',
        description: 'Learn basic algebra'
      })
      await createTestCourse({
        title: 'Geometry Basics',
        description: 'Learn geometry'
      })

      const request = new NextRequest('http://localhost:3000/api/courses?search=algebra')
      const response = await getCourses(request)
      const data = await response.json()

      expect(data.courses).toHaveLength(1)
      expect(data.courses[0].title).toBe('Algebra Fundamentals')
    })
  })

  describe('POST /api/courses', () => {
    it('should create course for admin user', async () => {
      const adminUser = await createTestUser({ role: 'admin' })
      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })

      const courseData = {
        title: 'New Course',
        description: 'A new test course',
        subject: 'science',
        level: 'gcse',
        instructor: 'Dr. Test',
        duration: 1800,
        difficulty: 'intermediate',
        topics: ['physics', 'chemistry'],
        price: 0,
        status: 'published',
      }

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createCourse(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.title).toBe('New Course')
      expect(data.course.subject).toBe('science')
    })

    it('should create course for teacher user', async () => {
      const teacherUser = await createTestUser({ role: 'teacher' })
      mockAuth.mockResolvedValue({ userId: teacherUser.clerkId })

      const courseData = {
        title: 'Teacher Course',
        description: 'A teacher-created course',
        subject: 'history',
        level: 'gcse',
        instructor: 'Mr. Teacher',
        duration: 1200,
        difficulty: 'beginner',
        topics: ['world-history'],
        price: 0,
        status: 'published',
      }

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createCourse(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.title).toBe('Teacher Course')
    })

    it('should return 403 for student user', async () => {
      const studentUser = await createTestUser({ role: 'student' })
      mockAuth.mockResolvedValue({ userId: studentUser.clerkId })

      const courseData = {
        title: 'Student Course',
        description: 'Should not be allowed',
        subject: 'mathematics',
        level: 'gcse',
      }

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createCourse(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Forbidden: Admin or teacher access required')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createCourse(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })

    it('should validate required fields', async () => {
      const adminUser = await createTestUser({ role: 'admin' })
      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })

      const invalidData = {
        title: 'Incomplete Course',
        // Missing required fields
      }

      const request = new NextRequest('http://localhost:3000/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createCourse(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('required')
    })
  })

  describe('GET /api/courses/[id]', () => {
    it('should return course details for enrolled user', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/courses/${course.id}`)
      const response = await getCourse(request, { params: { id: course.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.id).toBe(course.id)
      expect(data.course.title).toBe(course.title)
      expect(data.userProgress).toBeDefined()
      expect(data.enrolled).toBe(true)
    })

    it('should return course details for non-enrolled user', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/courses/${course.id}`)
      const response = await getCourse(request, { params: { id: course.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.course.id).toBe(course.id)
      expect(data.enrolled).toBe(false)
    })

    it('should return 404 for non-existent course', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const fakeId = 'non-existent-course-id'
      const request = new NextRequest(`http://localhost:3000/api/courses/${fakeId}`)
      const response = await getCourse(request, { params: { id: fakeId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Course not found')
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const course = await createTestCourse()
      const request = new NextRequest(`http://localhost:3000/api/courses/${course.id}`)
      const response = await getCourse(request, { params: { id: course.id } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/courses/[id] (enrollment)', () => {
    it('should enroll user in course', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/courses/${course.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'enroll' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await enrollInCourse(request, { params: { id: course.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Successfully enrolled in course')

      // Verify enrollment was created
      const enrollment = await testPrisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      })

      expect(enrollment).toBeTruthy()
      expect(enrollment?.status).toBe('active')

      // Verify course enrollment count was updated
      const updatedCourse = await testPrisma.course.findUnique({
        where: { id: course.id },
      })
      expect(updatedCourse?.enrollmentCount).toBe(1)
    })

    it('should not enroll user twice in same course', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()
      await createTestEnrollment(user.id, course.id)

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/courses/${course.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'enroll' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await enrollInCourse(request, { params: { id: course.id } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Already enrolled in this course')
    })

    it('should return 404 for non-existent course', async () => {
      const user = await createTestUser()
      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const fakeId = 'non-existent-course-id'
      const request = new NextRequest(`http://localhost:3000/api/courses/${fakeId}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'enroll' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await enrollInCourse(request, { params: { id: fakeId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })

    it('should handle invalid action', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()

      mockAuth.mockResolvedValue({ userId: user.clerkId })

      const request = new NextRequest(`http://localhost:3000/api/courses/${course.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'invalid' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await enrollInCourse(request, { params: { id: course.id } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid action')
    })
  })
})