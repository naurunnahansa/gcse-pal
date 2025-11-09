import { db } from '../index';
import { agentConfigs, type AgentConfig, type NewAgentConfig } from '../schema';
import { eq } from 'drizzle-orm';

export class AgentConfigService {
  /**
   * Create a new agent configuration for a tenant
   */
  async create(config: NewAgentConfig): Promise<AgentConfig> {
    const [created] = await db.insert(agentConfigs).values(config).returning();
    return created;
  }

  /**
   * Get agent configuration by tenant ID
   */
  async getByTenantId(tenantId: string): Promise<AgentConfig | null> {
    const [config] = await db
      .select()
      .from(agentConfigs)
      .where(eq(agentConfigs.tenantId, tenantId));
    
    return config || null;
  }

  /**
   * Update agent configuration for a tenant
   */
  async update(tenantId: string, updates: Partial<Omit<AgentConfig, 'id' | 'tenantId' | 'createdAt'>>): Promise<AgentConfig | null> {
    const [updated] = await db
      .update(agentConfigs)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(agentConfigs.tenantId, tenantId))
      .returning();
    
    return updated || null;
  }

  /**
   * Delete agent configuration for a tenant
   */
  async delete(tenantId: string): Promise<boolean> {
    const result = await db
      .delete(agentConfigs)
      .where(eq(agentConfigs.tenantId, tenantId));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get or create default agent configuration for a tenant
   */
  async getOrCreate(tenantId: string, defaults?: Partial<NewAgentConfig>): Promise<AgentConfig> {
    const existing = await this.getByTenantId(tenantId);
    
    if (existing) {
      return existing;
    }

    return this.create({
      tenantId,
      agentName: defaults?.agentName || 'Customer Service Agent',
      agentIdentity: defaults?.agentIdentity || 'A helpful AI assistant for customer support',
      systemPrompt: defaults?.systemPrompt || 'You are a helpful customer service agent. Provide accurate, friendly, and professional assistance.',
      personality: defaults?.personality || 'professional',
      enabledDomains: defaults?.enabledDomains || ['public', 'product', 'customer', 'operational'],
      features: defaults?.features || {},
      mcpServers: defaults?.mcpServers || [],
      metadata: defaults?.metadata || {},
    });
  }
}

