import neo4j, { Driver, Session } from 'neo4j-driver';
import { z } from 'zod';

// Configuration schema
export const Neo4jConfigSchema = z.object({
  uri: z.string().url(),
  username: z.string(),
  password: z.string(),
  database: z.string().default('neo4j'),
});

export type Neo4jConfig = z.infer<typeof Neo4jConfigSchema>;

export class KnowledgeClient {
  private driver: Driver;
  private config: Neo4jConfig;

  constructor(config: Neo4jConfig) {
    this.config = Neo4jConfigSchema.parse(config);
    this.driver = neo4j.driver(
      this.config.uri,
      neo4j.auth.basic(this.config.username, this.config.password)
    );
  }

  async connect(): Promise<void> {
    try {
      await this.verifyConnectivity();
      console.log('Connected to Neo4j database');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  getSession(): Session {
    return this.driver.session({ database: this.config.database });
  }

  async executeQuery<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const session = this.getSession();
    try {
      const result = await session.executeRead(tx => tx.run(query, parameters));
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  async executeWriteQuery<T = any>(
    query: string,
    parameters?: Record<string, any>
  ): Promise<T[]> {
    const session = this.getSession();
    try {
      const result = await session.executeWrite(tx => tx.run(query, parameters));
      return result.records.map(record => record.toObject());
    } finally {
      await session.close();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.verifyConnectivity();
      return true;
    } catch {
      return false;
    }
  }

  private async verifyConnectivity(): Promise<void> {
    const session = this.getSession();
    await session.run('RETURN 1');
    await session.close();
  }
}
