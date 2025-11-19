import { db } from './db/index';
import { sql } from 'drizzle-orm';

// Export the Drizzle database instance and schema
export { db };
export * from './db/schema';
export * from './db/queries';

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
    await db.execute(sql`SELECT 1`)
    return true
  } catch (error) {
    console.error('Database connection check failed:', error)
    return false
  }
}

