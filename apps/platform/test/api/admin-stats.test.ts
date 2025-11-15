import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/stats/route'
import { testPrisma, createTestUser, createTestCourse, createTestEnrollment } from '../setup'

// Mock Clerk authentication and user role checking
const mockAuth = vi.fn()
const mockHasUserRole = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
}))

vi.mock('@/lib/user-sync', () => ({
  hasUserRole: mockHasUserRole,
}))

vi.mock('@/lib/db', () => ({
  prisma: testPrisma,
}))

describe('Admin Stats API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics for admin user', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      // Create test data
      const studentUser = await createTestUser({ role: 'student' })
      const teacherUser = await createTestUser({ role: 'teacher', clerkId: 'teacher_clerk' })
      const course = await createTestCourse({ status: 'published' })
      await createTestEnrollment(studentUser.id, course.id)

      // Mock prisma queries
      testPrisma.user.count = vi.fn()
        .mockResolvedValueOnce(1) // totalStudents
        .mockResolvedValueOnce(1) // publishedCourses (through course.count())
        .mockResolvedValueOnce(2) // totalStudents (second call)
        .mockResolvedValueOnce(1) // totalTeachers

      testPrisma.course.count = vi.fn()
        .mockResolvedValueOnce(1) // totalCourses
        .mockResolvedValueOnce(1) // publishedCourses

      testPrisma.enrollment.count = vi.fn()
        .mockResolvedValueOnce(1) // totalEnrollments
        .mockResolvedValueOnce(1) // recentEnrollments

      testPrisma.enrollment.findMany = vi.fn().mockResolvedValue([]) // activeCourses

      testPrisma.course.findMany = vi.fn().mockResolvedValue([{
        id: course.id,
        title: course.title,
        description: course.description,
        subject: course.subject,
        difficulty: course.difficulty,
        status: course.status,
        instructor: course.instructor,
        createdAt: course.createdAt || new Date(),
        duration: course.duration,
        thumbnail: null,
        level: course.level,
        enrollmentCount: course.enrollmentCount,
        rating: course.rating,
        _count: {
          chapters: 5,
          enrollments: 1
        }
      }])

      testPrisma.enrollment.groupBy = vi.fn().mockResolvedValue([
        { status: 'active', _count: 1 }
      ])

      testPrisma.studySession.aggregate = vi.fn().mockResolvedValue({
        _count: 10,
        _sum: { duration: 3600 }
      })

      testPrisma.enrollment.aggregate = vi.fn().mockResolvedValue({
        _avg: { progress: 75 }
      })

      testPrisma.user.findMany = vi.fn().mockResolvedValue([{
        id: studentUser.id,
        name: studentUser.name,
        email: studentUser.email,
        avatar: studentUser.avatar,
        createdAt: studentUser.createdAt || new Date(),
        enrollments: [{
          progress: 50,
          enrolledAt: new Date(),
          lastActivityAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          course: {
            title: course.title
          }
        }]
      }])

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.platformStats).toHaveLength(4)
      expect(data.data.courses).toHaveLength(1)
      expect(data.data.students).toHaveLength(1)
      expect(data.data.summary).toBeDefined()
      expect(mockHasUserRole).toHaveBeenCalledWith(adminUser.clerkId, ['admin', 'teacher'])
    })

    it('should return admin statistics for teacher user', async () => {
      const teacherUser = await createTestUser({ role: 'teacher' })

      mockAuth.mockResolvedValue({ userId: teacherUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      // Mock minimal responses
      testPrisma.user.count = vi.fn().mockResolvedValue(0)
      testPrisma.course.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.findMany = vi.fn().mockResolvedValue([])
      testPrisma.course.findMany = vi.fn().mockResolvedValue([])
      testPrisma.enrollment.groupBy = vi.fn().mockResolvedValue([])
      testPrisma.studySession.aggregate = vi.fn().mockResolvedValue({ _count: 0, _sum: { duration: 0 } })
      testPrisma.enrollment.aggregate = vi.fn().mockResolvedValue({ _avg: { progress: 0 } })
      testPrisma.user.findMany = vi.fn().mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockHasUserRole).toHaveBeenCalledWith(teacherUser.clerkId, ['admin', 'teacher'])
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Unauthorized')
      expect(mockHasUserRole).not.toHaveBeenCalled()
    })

    it('should return 403 for user without admin or teacher role', async () => {
      const studentUser = await createTestUser({ role: 'student' })

      mockAuth.mockResolvedValue({ userId: studentUser.clerkId })
      mockHasUserRole.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Forbidden: Admin access required')
    })

    it('should handle database errors gracefully', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      // Mock database error
      testPrisma.user.count = vi.fn().mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should format platform stats correctly', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      // Mock responses with specific numbers
      testPrisma.user.count = vi.fn()
        .mockResolvedValueOnce(150) // totalStudents
        .mockResolvedValueOnce(25)  // totalCourses
        .mockResolvedValueOnce(20)  // publishedCourses
        .mockResolvedValueOnce(150) // totalStudents (second call)
        .mockResolvedValueOnce(10)  // totalTeachers

      testPrisma.course.count = vi.fn()
        .mockResolvedValueOnce(25)  // totalCourses
        .mockResolvedValueOnce(20)  // publishedCourses

      testPrisma.enrollment.count = vi.fn()
        .mockResolvedValueOnce(300) // totalEnrollments
        .mockResolvedValueOnce(15)  // recentEnrollments

      testPrisma.enrollment.findMany = vi.fn().mockResolvedValue([{ courseId: '1' }, { courseId: '2' }]) // 2 active courses
      testPrisma.course.findMany = vi.fn().mockResolvedValue([])
      testPrisma.enrollment.groupBy = vi.fn().mockResolvedValue([])
      testPrisma.studySession.aggregate = vi.fn().mockResolvedValue({ _count: 0, _sum: { duration: 0 } })
      testPrisma.enrollment.aggregate = vi.fn().mockResolvedValue({ _avg: { progress: 65 } })
      testPrisma.user.findMany = vi.fn().mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.platformStats).toEqual([
        {
          title: "Total Students",
          value: "150",
          change: "+15",
          icon: "Users",
          color: "text-blue-600"
        },
        {
          title: "Active Courses",
          value: "20",
          change: "+2",
          icon: "BookOpen",
          color: "text-green-600"
        },
        {
          title: "Avg Completion",
          value: "65%",
          change: "+5%",
          icon: "Target",
          color: "text-purple-600"
        },
        {
          title: "Total Teachers",
          value: "10",
          change: "+2",
          icon: "Award",
          color: "text-orange-600"
        }
      ])
    })

    it('should format course data correctly', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      const mockCourse = {
        id: 'course_1',
        title: 'Test Course',
        description: 'A test course',
        subject: 'mathematics',
        difficulty: 'intermediate',
        status: 'published',
        instructor: 'Dr. Test',
        createdAt: new Date('2024-01-01'),
        duration: 1200,
        thumbnail: 'https://example.com/thumb.jpg',
        level: 'gcse',
        enrollmentCount: 25,
        rating: 4.5,
        _count: {
          chapters: 8,
          enrollments: 25
        }
      }

      testPrisma.user.count = vi.fn().mockResolvedValue(0)
      testPrisma.course.count = vi.fn().mockResolvedValue(1)
      testPrisma.enrollment.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.findMany = vi.fn().mockResolvedValue([])
      testPrisma.course.findMany = vi.fn().mockResolvedValue([mockCourse])
      testPrisma.enrollment.groupBy = vi.fn().mockResolvedValue([])
      testPrisma.studySession.aggregate = vi.fn().mockResolvedValue({ _count: 0, _sum: { duration: 0 } })
      testPrisma.enrollment.aggregate = vi.fn().mockResolvedValue({ _avg: { progress: 0 } })
      testPrisma.user.findMany = vi.fn().mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.courses).toHaveLength(1)
      expect(data.data.courses[0]).toEqual({
        id: 'course_1',
        title: 'Test Course',
        description: 'A test course',
        subject: 'mathematics',
        difficulty: 'intermediate',
        status: 'published',
        students: 25,
        avgScore: 4.5,
        completion: expect.any(Number), // Random number between 0-100
        author: 'Dr. Test',
        createdAt: '2024-01-01',
        duration: 1200,
        thumbnail: 'https://example.com/thumb.jpg',
        level: 'gcse',
        chaptersCount: 8
      })
    })

    it('should format student data correctly', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      const mockStudent = {
        id: 'student_1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: null,
        createdAt: new Date(),
        enrollments: [{
          progress: 75,
          enrolledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          lastActivityAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          course: {
            title: 'Mathematics 101'
          }
        }]
      }

      testPrisma.user.count = vi.fn().mockResolvedValue(0)
      testPrisma.course.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.findMany = vi.fn().mockResolvedValue([])
      testPrisma.course.findMany = vi.fn().mockResolvedValue([])
      testPrisma.enrollment.groupBy = vi.fn().mockResolvedValue([])
      testPrisma.studySession.aggregate = vi.fn().mockResolvedValue({ _count: 0, _sum: { duration: 0 } })
      testPrisma.enrollment.aggregate = vi.fn().mockResolvedValue({ _avg: { progress: 0 } })
      testPrisma.user.findMany = vi.fn().mockResolvedValue([mockStudent])

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.students).toHaveLength(1)
      expect(data.data.students[0]).toEqual({
        id: 'student_1',
        name: 'John Doe',
        email: 'john@example.com',
        enrolled: 1,
        progress: 75,
        lastActive: '30 minutes ago'
      })
    })

    it('should handle students with no enrollments', async () => {
      const adminUser = await createTestUser({ role: 'admin' })

      mockAuth.mockResolvedValue({ userId: adminUser.clerkId })
      mockHasUserRole.mockResolvedValue(true)

      const mockStudentNoEnrollments = {
        id: 'student_2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: null,
        createdAt: new Date(),
        enrollments: [] // No enrollments
      }

      testPrisma.user.count = vi.fn().mockResolvedValue(0)
      testPrisma.course.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.count = vi.fn().mockResolvedValue(0)
      testPrisma.enrollment.findMany = vi.fn().mockResolvedValue([])
      testPrisma.course.findMany = vi.fn().mockResolvedValue([])
      testPrisma.enrollment.groupBy = vi.fn().mockResolvedValue([])
      testPrisma.studySession.aggregate = vi.fn().mockResolvedValue({ _count: 0, _sum: { duration: 0 } })
      testPrisma.enrollment.aggregate = vi.fn().mockResolvedValue({ _avg: { progress: 0 } })
      testPrisma.user.findMany = vi.fn().mockResolvedValue([mockStudentNoEnrollments])

      const request = new NextRequest('http://localhost:3000/api/admin/stats', {
        method: 'GET',
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.students[0]).toEqual({
        id: 'student_2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        enrolled: 0,
        progress: 0,
        lastActive: 'Never'
      })
    })
  })
})