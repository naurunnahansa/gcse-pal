import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as newSchema from './apps/platform/lib/db/schema-new';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

/**
 * Generate Drizzle migration files for the new schema
 */

// Connection string - replace with your actual database
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/gcse_pal";

const client = postgres(connectionString);
const db = drizzle(client);

async function generateMigration() {
  console.log('🔧 Generating Drizzle migration for new simplified schema...');

  try {
    // This will generate migration files comparing the new schema to current database
    await migrate(db, { migrationsFolder: './apps/platform/lib/db/migrations' });

    console.log('✅ Migration files generated successfully!');
    console.log('📁 Migration files location: ./apps/platform/lib/db/migrations');

  } catch (error) {
    console.error('❌ Failed to generate migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  generateMigration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { generateMigration };