import { beforeEach, afterEach, vi } from 'vitest'

// Global test setup - focusing on mocking instead of real database
beforeEach(async () => {
  // Clear all mocks before each test
  vi.clearAllMocks()

  // Set up test environment
  process.env.NODE_ENV = 'test'

  console.log('Setting up test environment')
})

afterEach(async () => {
  // Clean up after each test
  vi.restoreAllMocks()

  console.log('Cleaning up test environment')
})

// Export mock utilities for tests
export const mockDatabase = {
  users: [],
  courses: [],
  lessons: [],
  enrollments: [],
  lessonProgress: [],
  chapters: [],
  answers: [],
  videos: [],
}

export const resetMockDatabase = () => {
  mockDatabase.users = []
  mockDatabase.courses = []
  mockDatabase.lessons = []
  mockDatabase.enrollments = []
  mockDatabase.lessonProgress = []
  mockDatabase.chapters = []
  mockDatabase.answers = []
  mockDatabase.videos = []
}