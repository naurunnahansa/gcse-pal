import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Create connection pool
const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
  ssl:
    process.env["NODE_ENV"] === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Create Drizzle database instance
export const db = drizzle({ client: pool, schema });
// Export schema for use in other files
export * from "./schema";

// Export Drizzle ORM helpers
export { eq, and, or, not, sql } from "drizzle-orm";

// Export services
export * from "./services/agent-config-service";
export * from "./services/sync-service";
