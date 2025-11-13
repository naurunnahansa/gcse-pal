import { PrismaClient } from './generated/prisma'

// Global variable to store Prisma Client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Export Prisma Client instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Prevent creating new instances during hot reload in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Helper function for database operations with error handling
export async function withDatabase<T>(
  operation: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    console.error('Database operation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database operation failed'
    }
  }
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

// Graceful shutdown function
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Failed to disconnect from database:', error)
  }
}