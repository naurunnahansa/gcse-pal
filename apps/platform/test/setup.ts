import { PrismaClient } from '@/lib/generated/prisma'
import { execSync } from 'child_process'

// Mock Clerk authentication
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
  authMiddleware: vi.fn(() => (req: any, res: any, next: any) => next()),
  redirectToSignIn: vi.fn(() => new Response('Redirect to sign in')),
}))

// Test database setup
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

// Global test setup
beforeAll(async () => {
  // Ensure test database is clean and migrated
  try {
    await testPrisma.$connect()

    // Run migrations if needed
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL }
    })
  } catch (error) {
    console.error('Test database setup failed:', error)
    throw error
  }
})

// Global test teardown
afterAll(async () => {
  await testPrisma.$disconnect()
})

// Clean up database after each test
afterEach(async () => {
  const tablenames = await testPrisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  for (const { tablename } of tablenames as { tablename: string }[]) {
    if (tablename !== '_prisma_migrations') {
      try {
        await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
      } catch (error) {
        console.log(`Note: ${tablename} doesn't exist, skipping`)
      }
    }
  }
})

// Helper function to create test user
export async function createTestUser(overrides: Partial<any> = {}) {
  return await testPrisma.user.create({
    data: {
      clerkId: 'test_clerk_id_' + Math.random().toString(36).substring(7),
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      avatar: null,
      ...overrides,
    },
    include: {
      userSettings: true,
    },
  })
}

// Helper function to create test course
export async function createTestCourse(overrides: Partial<any> = {}) {
  return await testPrisma.course.create({
    data: {
      title: 'Test Course',
      description: 'A test course for testing',
      subject: 'mathematics',
      level: 'gcse',
      instructor: 'Test Instructor',
      duration: 1200,
      difficulty: 'beginner',
      topics: ['test-topic'],
      price: 0,
      status: 'published',
      enrollmentCount: 0,
      rating: 0,
      ...overrides,
    },
  })
}

// Helper function to create test enrollment
export async function createTestEnrollment(userId: string, courseId: string, overrides: Partial<any> = {}) {
  return await testPrisma.enrollment.create({
    data: {
      userId,
      courseId,
      enrolledAt: new Date(),
      progress: 0,
      status: 'active',
      ...overrides,
    },
  })
}