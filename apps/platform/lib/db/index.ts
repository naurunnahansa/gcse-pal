import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema-new';

const connectionString = process.env.DATABASE_URL!;

// Create a single postgres client instance
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

// Re-export all schema items for convenience
export * from './schema-new';
export * from './queries';