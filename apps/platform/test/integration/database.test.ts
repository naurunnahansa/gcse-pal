import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { testPrisma, createTestUser, createTestCourse, createTestEnrollment } from '../setup'

describe('Database Integration Tests', () => {
  beforeEach(async () => {
    // Clean up before each test
    await testPrisma.progress.deleteMany()
    await testPrisma.studySession.deleteMany()
    await testPrisma.enrollment.deleteMany()
    await testPrisma.lesson.deleteMany()
    await testPrisma.chapter.deleteMany()
    await testPrisma.course.deleteMany()
    await testPrisma.userSettings.deleteMany()
    await testPrisma.user.deleteMany()
  })

  describe('User Management', () => {
    it('should create user with default settings', async () => {
      const user = await testPrisma.user.create({
        data: {
          clerkId: 'test_clerk_id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'student',
        },
      })

      const userSettings = await testPrisma.userSettings.create({
        data: {
          userId: user.id,
          theme: 'light',
          emailNotifications: true,
          pushNotifications: true,
          studyReminders: true,
          deadlineReminders: true,
          dailyGoal: 60,
          preferredStudyTime: 'evening',
          studyDays: JSON.stringify([1, 2, 3, 4, 5]),
        },
      })

      expect(user.id).toBeDefined()
      expect(user.clerkId).toBe('test_clerk_id')
      expect(user.email).toBe('test@example.com')
      expect(userSettings.userId).toBe(user.id)
      expect(userSettings.theme).toBe('light')
      expect(userSettings.dailyGoal).toBe(60)
    })

    it('should enforce unique clerkId constraint', async () => {
      await testPrisma.user.create({
        data: {
          clerkId: 'duplicate_clerk_id',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'student',
        },
      })

      await expect(
        testPrisma.user.create({
          data: {
            clerkId: 'duplicate_clerk_id',
            email: 'user2@example.com',
            name: 'User 2',
            role: 'student',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Course Management', () => {
    it('should create course with chapters and lessons', async () => {
      const course = await testPrisma.course.create({
        data: {
          title: 'Complete Mathematics Course',
          description: 'A comprehensive math course',
          subject: 'mathematics',
          level: 'gcse',
          instructor: 'Dr. Math',
          duration: 2400,
          difficulty: 'intermediate',
          topics: ['algebra', 'geometry'],
          price: 0,
          status: 'published',
          enrollmentCount: 0,
          rating: 0,
        },
      })

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Algebra Basics',
          description: 'Introduction to algebra',
          order: 1,
          duration: 600,
          isPublished: true,
        },
      })

      const lessons = await Promise.all([
        testPrisma.lesson.create({
          data: {
            chapterId: chapter.id,
            title: 'Variables and Expressions',
            description: 'Understanding variables',
            order: 1,
            duration: 120,
            hasVideo: true,
            hasMarkdown: true,
            isPublished: true,
            videoUrl: 'https://example.com/video1.mp4',
            markdownPath: '/content/lesson1.md',
          },
        }),
        testPrisma.lesson.create({
          data: {
            chapterId: chapter.id,
            title: 'Linear Equations',
            description: 'Solving linear equations',
            order: 2,
            duration: 180,
            hasVideo: true,
            hasMarkdown: true,
            isPublished: true,
            videoUrl: 'https://example.com/video2.mp4',
            markdownPath: '/content/lesson2.md',
          },
        }),
      ])

      expect(course.id).toBeDefined()
      expect(course.subject).toBe('mathematics')
      expect(chapter.courseId).toBe(course.id)
      expect(lessons).toHaveLength(2)
      expect(lessons[0].order).toBe(1)
      expect(lessons[1].order).toBe(2)
    })

    it('should cascade delete chapters and lessons when course is deleted', async () => {
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
          title: 'Test Lesson',
          order: 1,
          isPublished: true,
        },
      })

      // Verify records exist
      const foundLesson = await testPrisma.lesson.findUnique({ where: { id: lesson.id } })
      const foundChapter = await testPrisma.chapter.findUnique({ where: { id: chapter.id } })
      expect(foundLesson).toBeTruthy()
      expect(foundChapter).toBeTruthy()

      // Delete course
      await testPrisma.course.delete({ where: { id: course.id } })

      // Verify cascade deletion
      const deletedLesson = await testPrisma.lesson.findUnique({ where: { id: lesson.id } })
      const deletedChapter = await testPrisma.chapter.findUnique({ where: { id: chapter.id } })
      expect(deletedLesson).toBeNull()
      expect(deletedChapter).toBeNull()
    })
  })

  describe('Enrollment and Progress', () => {
    it('should create enrollment and track progress', async () => {
      const user = await createTestUser()
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
          title: 'Test Lesson',
          order: 1,
          isPublished: true,
        },
      })

      const enrollment = await testPrisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
          enrolledAt: new Date(),
          progress: 0,
          status: 'active',
        },
      })

      const progress = await testPrisma.progress.create({
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

      const studySession = await testPrisma.studySession.create({
        data: {
          userId: user.id,
          courseId: course.id,
          startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          endTime: new Date(),
          duration: 3600, // 1 hour
        },
      })

      expect(enrollment.userId).toBe(user.id)
      expect(enrollment.courseId).toBe(course.id)
      expect(progress.status).toBe('in_progress')
      expect(studySession.duration).toBe(3600)
    })

    it('should update enrollment progress based on lesson completion', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()

      const chapter = await testPrisma.chapter.create({
        data: {
          courseId: course.id,
          title: 'Test Chapter',
          order: 1,
          isPublished: true,
        },
      })

      // Create 3 lessons
      const lessons = await Promise.all([
        testPrisma.lesson.create({
          data: { chapterId: chapter.id, title: 'Lesson 1', order: 1, isPublished: true },
        }),
        testPrisma.lesson.create({
          data: { chapterId: chapter.id, title: 'Lesson 2', order: 2, isPublished: true },
        }),
        testPrisma.lesson.create({
          data: { chapterId: chapter.id, title: 'Lesson 3', order: 3, isPublished: true },
        }),
      ])

      const enrollment = await createTestEnrollment(user.id, course.id)

      // Complete 2 out of 3 lessons
      await Promise.all([
        testPrisma.progress.create({
          data: {
            userId: user.id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lessons[0].id,
            status: 'completed',
            timeSpent: 1200,
            score: 95,
            completedAt: new Date(),
          },
        }),
        testPrisma.progress.create({
          data: {
            userId: user.id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lessons[1].id,
            status: 'completed',
            timeSpent: 1500,
            score: 88,
            completedAt: new Date(),
          },
        }),
        testPrisma.progress.create({
          data: {
            userId: user.id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lessons[2].id,
            status: 'in_progress',
            timeSpent: 600,
            score: 0,
          },
        }),
      ])

      // Get updated enrollment
      const updatedEnrollment = await testPrisma.enrollment.findUnique({
        where: { id: enrollment.id },
      })

      // Calculate expected progress (2/3 = 66.67%)
      const expectedProgress = Math.round((2 / 3) * 100)
      expect(updatedEnrollment?.progress).toBe(expectedProgress)
    })
  })

  describe('Complex Queries and Relationships', () => {
    it('should handle complex user progress queries', async () => {
      const user = await createTestUser()
      const courses = await Promise.all([
        createTestCourse({ title: 'Math Course', subject: 'mathematics' }),
        createTestCourse({ title: 'English Course', subject: 'english' }),
      ])

      // Create enrollments
      await Promise.all([
        createTestEnrollment(user.id, courses[0].id),
        createTestEnrollment(user.id, courses[1].id),
      ])

      // Create chapters and lessons
      const chapters = await Promise.all([
        testPrisma.chapter.create({
          data: { courseId: courses[0].id, title: 'Math Chapter 1', order: 1, isPublished: true },
        }),
        testPrisma.chapter.create({
          data: { courseId: courses[1].id, title: 'English Chapter 1', order: 1, isPublished: true },
        }),
      ])

      const lessons = await Promise.all([
        testPrisma.lesson.create({
          data: { chapterId: chapters[0].id, title: 'Math Lesson 1', order: 1, isPublished: true },
        }),
        testPrisma.lesson.create({
          data: { chapterId: chapters[1].id, title: 'English Lesson 1', order: 1, isPublished: true },
        }),
      ])

      // Create progress records
      await Promise.all([
        testPrisma.progress.create({
          data: {
            userId: user.id,
            courseId: courses[0].id,
            chapterId: chapters[0].id,
            lessonId: lessons[0].id,
            status: 'completed',
            timeSpent: 1800,
            score: 92,
            completedAt: new Date(),
          },
        }),
        testPrisma.progress.create({
          data: {
            userId: user.id,
            courseId: courses[1].id,
            chapterId: chapters[1].id,
            lessonId: lessons[1].id,
            status: 'in_progress',
            timeSpent: 900,
            score: 0,
          },
        }),
      ])

      // Complex query: Get user's progress across all courses
      const userProgress = await testPrisma.user.findUnique({
        where: { id: user.id },
        include: {
          enrollments: {
            include: {
              course: true,
              progress: {
                include: {
                  chapter: true,
                  lesson: true,
                },
              },
            },
          },
        },
      })

      expect(userProgress?.enrollments).toHaveLength(2)
      expect(userProgress?.enrollments[0].progress).toHaveLength(1)
      expect(userProgress?.enrollments[1].progress).toHaveLength(1)
    })

    it('should handle aggregate queries for analytics', async () => {
      const users = await Promise.all([
        createTestUser({ clerkId: 'user1', email: 'user1@example.com' }),
        createTestUser({ clerkId: 'user2', email: 'user2@example.com' }),
        createTestUser({ clerkId: 'user3', email: 'user3@example.com' }),
      ])

      const course = await createTestCourse()

      // Create enrollments
      await Promise.all(users.map(user => createTestEnrollment(user.id, course.id)))

      const chapter = await testPrisma.chapter.create({
        data: { courseId: course.id, title: 'Analytics Chapter', order: 1, isPublished: true },
      })

      const lesson = await testPrisma.lesson.create({
        data: { chapterId: chapter.id, title: 'Analytics Lesson', order: 1, isPublished: true },
      })

      // Create varied progress data
      await Promise.all([
        testPrisma.progress.create({
          data: {
            userId: users[0].id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lesson.id,
            status: 'completed',
            timeSpent: 2000,
            score: 95,
            completedAt: new Date(),
          },
        }),
        testPrisma.progress.create({
          data: {
            userId: users[1].id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lesson.id,
            status: 'completed',
            timeSpent: 1500,
            score: 87,
            completedAt: new Date(),
          },
        }),
        testPrisma.progress.create({
          data: {
            userId: users[2].id,
            courseId: course.id,
            chapterId: chapter.id,
            lessonId: lesson.id,
            status: 'in_progress',
            timeSpent: 800,
            score: 0,
          },
        }),
      ])

      // Aggregate query
      const aggregateStats = await testPrisma.progress.aggregate({
        where: { courseId: course.id },
        _avg: { score: true, timeSpent: true },
        _count: { id: true },
        where: { status: 'completed' },
      })

      expect(aggregateStats._count.id).toBe(2)
      expect(aggregateStats._avg.score).toBe(91) // (95 + 87) / 2
      expect(aggregateStats._avg.timeSpent).toBe(1750) // (2000 + 1500) / 2

      // Course statistics
      const courseStats = await testPrisma.course.findUnique({
        where: { id: course.id },
        include: {
          _count: {
            select: {
              enrollments: true,
              chapters: {
                include: {
                  lessons: {
                    select: {
                      _count: {
                        select: {
                          progress: {
                            where: { status: 'completed' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
      })

      expect(courseStats?._count.enrollments).toBe(3)
    })
  })

  describe('Data Integrity and Constraints', () => {
    it('should enforce foreign key constraints', async () => {
      // Try to create progress with non-existent lesson
      await expect(
        testPrisma.progress.create({
          data: {
            userId: 'non-existent-user',
            courseId: 'non-existent-course',
            chapterId: 'non-existent-chapter',
            lessonId: 'non-existent-lesson',
            status: 'in_progress',
            timeSpent: 0,
            score: 0,
          },
        })
      ).rejects.toThrow()
    })

    it('should handle transaction rollback', async () => {
      const user = await createTestUser()
      const course = await createTestCourse()

      // Test transaction rollback on error
      await expect(
        testPrisma.$transaction(async (tx) => {
          // Create enrollment
          await tx.enrollment.create({
            data: {
              userId: user.id,
              courseId: course.id,
              status: 'active',
              progress: 0,
            },
          })

          // Try to create duplicate enrollment (should fail and rollback)
          await tx.enrollment.create({
            data: {
              userId: user.id,
              courseId: course.id,
              status: 'active',
              progress: 0,
            },
          })
        })
      ).rejects.toThrow()

      // Verify no enrollment was created due to rollback
      const enrollment = await testPrisma.enrollment.findFirst({
        where: { userId: user.id, courseId: course.id },
      })
      expect(enrollment).toBeNull()
    })
  })
})