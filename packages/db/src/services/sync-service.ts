import { db } from "../index";
import {
  tenants,
  users,
  organizationMemberships,
  agentConfigs,
  eq,
  and,
} from "../index";

// Type definitions for role and status enums
type OrganizationRole = "admin" | "member" | "viewer";
type MembershipStatus = "active" | "inactive" | "pending";

/**
 * WorkOS User data structure
 */
export interface WorkOSUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
}

/**
 * WorkOS Organization data structure
 */
export interface WorkOSOrganization {
  id: string;
  name: string;
  domain?: string;
  allow_profiles_outside_organization?: boolean;
}

/**
 * WorkOS Organization Membership data structure
 */
export interface WorkOSMembership {
  id: string;
  user_id: string;
  organization_id: string;
  role?: { slug: string };
  status?: string;
}

/**
 * Service for syncing WorkOS data to local database
 * Handles upserts, deletions, and maintains data consistency
 */
export class SyncService {
  /**
   * Sync a WorkOS user to the local database
   * Creates or updates user record based on workosUserId
   *
   * @param workosUser - WorkOS user data
   * @param tenantId - Local tenant ID (can be null if user created before organization membership)
   * @returns The synced user record
   */
  static async syncUserFromWorkOS(workosUser: WorkOSUser, tenantId: string | null) {
    return await db.transaction(async (tx) => {
      // Check if user exists
      const existingUser = await tx
        .select()
        .from(users)
        .where(eq(users.workosUserId, workosUser.id))
        .limit(1);

      if (existingUser.length > 0) {
        // Update existing user
        const updateData: any = {
          email: workosUser.email,
          firstName: workosUser.first_name || null,
          lastName: workosUser.last_name || null,
        };

        // Only update tenantId if provided (don't overwrite existing with null)
        if (tenantId) {
          updateData.tenantId = tenantId;
        }

        const [updated] = await tx
          .update(users)
          .set(updateData)
          .where(eq(users.workosUserId, workosUser.id))
          .returning();

        return updated;
      } else {
        // Insert new user
        const [created] = await tx
          .insert(users)
          .values({
            tenantId: tenantId || undefined,
            email: workosUser.email,
            workosUserId: workosUser.id,
            firstName: workosUser.first_name || null,
            lastName: workosUser.last_name || null,
          })
          .returning();

        return created;
      }
    });
  }

  /**
   * Sync a WorkOS organization to the local database
   * Creates or updates tenant record based on workosOrganizationId
   * Also creates default agent config if new tenant
   *
   * @param workosOrg - WorkOS organization data
   * @returns The synced tenant record
   */
  static async syncTenantFromWorkOS(workosOrg: WorkOSOrganization) {
    return await db.transaction(async (tx) => {
      // Check if tenant exists
      const existingTenant = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.workosOrganizationId, workosOrg.id))
        .limit(1);

      if (existingTenant.length > 0) {
        // Update existing tenant
        const [updated] = await tx
          .update(tenants)
          .set({
            name: workosOrg.name,
            domain: workosOrg.domain || null,
          })
          .where(eq(tenants.workosOrganizationId, workosOrg.id))
          .returning();

        return updated;
      } else {
        // Insert new tenant
        const [created] = await tx
          .insert(tenants)
          .values({
            name: workosOrg.name,
            workosOrganizationId: workosOrg.id,
            domain: workosOrg.domain || null,
          })
          .returning();

        // Create default agent config for new tenant
        await tx.insert(agentConfigs).values({
          tenantId: created.id,
          agentName: `${workosOrg.name} Assistant`,
          agentIdentity: `I am an AI assistant for ${workosOrg.name}.`,
          systemPrompt: "You are a helpful AI assistant.",
          personality: "professional",
          enabledDomains: ["public", "product", "customer", "operational"],
          features: {},
          mcpServers: [],
          metadata: {},
        });

        return created;
      }
    });
  }

  /**
   * Sync a WorkOS organization membership to the local database
   * Handles user and tenant lookup, creates membership record
   *
   * @param membership - WorkOS membership data
   * @returns The synced membership record
   */
  static async syncMembershipFromWorkOS(membership: WorkOSMembership) {
    return await db.transaction(async (tx) => {
      // Resolve WorkOS user ID to local user ID
      const [localUser] = await tx
        .select()
        .from(users)
        .where(eq(users.workosUserId, membership.user_id))
        .limit(1);

      if (!localUser) {
        throw new Error(
          `User with WorkOS ID ${membership.user_id} not found in database. ` +
            "Ensure user.created webhook is processed before membership.created.",
        );
      }

      // Resolve WorkOS organization ID to local tenant ID
      const [localTenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.workosOrganizationId, membership.organization_id))
        .limit(1);

      if (!localTenant) {
        throw new Error(
          `Tenant with WorkOS organization ID ${membership.organization_id} not found. ` +
            "Ensure organization.created webhook is processed before membership.created.",
        );
      }

      // Map WorkOS role to local role enum
      const role = this.mapWorkOSRoleToLocal(membership.role);
      const status: MembershipStatus =
        membership.status === "inactive" ? "inactive" : "active";

      // Check if membership already exists
      const existingMembership = await tx
        .select()
        .from(organizationMemberships)
        .where(
          and(
            eq(organizationMemberships.userId, localUser.id),
            eq(organizationMemberships.organizationId, localTenant.id),
          ),
        )
        .limit(1);

      if (existingMembership.length > 0) {
        // Update existing membership
        const [updated] = await tx
          .update(organizationMemberships)
          .set({
            role: role,
            status: status,
          })
          .where(
            and(
              eq(organizationMemberships.userId, localUser.id),
              eq(organizationMemberships.organizationId, localTenant.id),
            ),
          )
          .returning();

        return updated;
      } else {
        // Insert new membership
        const [created] = await tx
          .insert(organizationMemberships)
          .values({
            userId: localUser.id,
            organizationId: localTenant.id,
            role: role,
            status: status,
          })
          .returning();

        return created;
      }
    });
  }

  /**
   * Update an existing membership (typically role change)
   *
   * @param workosUserId - WorkOS user ID
   * @param workosOrgId - WorkOS organization ID
   * @param newRole - New role to assign as { slug: string }
   * @returns Updated membership record
   */
  static async updateMembership(
    workosUserId: string,
    workosOrgId: string,
    newRole?: { slug: string },
  ) {
    return await db.transaction(async (tx) => {
      // Resolve IDs
      const [localUser] = await tx
        .select()
        .from(users)
        .where(eq(users.workosUserId, workosUserId))
        .limit(1);

      const [localTenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.workosOrganizationId, workosOrgId))
        .limit(1);

      if (!localUser || !localTenant) {
        throw new Error("User or tenant not found for membership update");
      }

      const role = this.mapWorkOSRoleToLocal(newRole);

      const [updated] = await tx
        .update(organizationMemberships)
        .set({
          role: role,
        })
        .where(
          and(
            eq(organizationMemberships.userId, localUser.id),
            eq(organizationMemberships.organizationId, localTenant.id),
          ),
        )
        .returning();

      return updated;
    });
  }

  /**
   * Soft delete a membership (set status to inactive)
   * Preferred over hard delete for audit trail
   *
   * @param workosUserId - WorkOS user ID
   * @param workosOrgId - WorkOS organization ID
   * @returns Updated membership record
   */
  static async removeMembership(workosUserId: string, workosOrgId: string) {
    return await db.transaction(async (tx) => {
      // Resolve IDs
      const [localUser] = await tx
        .select()
        .from(users)
        .where(eq(users.workosUserId, workosUserId))
        .limit(1);

      const [localTenant] = await tx
        .select()
        .from(tenants)
        .where(eq(tenants.workosOrganizationId, workosOrgId))
        .limit(1);

      if (!localUser || !localTenant) {
        // Membership may already be deleted, return gracefully
        console.warn(
          `User ${workosUserId} or tenant ${workosOrgId} not found for membership deletion`,
        );
        return null;
      }

      const [updated] = await tx
        .update(organizationMemberships)
        .set({
          status: "inactive",
        })
        .where(
          and(
            eq(organizationMemberships.userId, localUser.id),
            eq(organizationMemberships.organizationId, localTenant.id),
          ),
        )
        .returning();

      return updated;
    });
  }

  /**
   * Update user details from WorkOS
   *
   * @param workosUser - WorkOS user data
   * @returns Updated user record
   */
  static async updateUser(workosUser: WorkOSUser) {
    const [updated] = await db
      .update(users)
      .set({
        email: workosUser.email,
        firstName: workosUser.first_name || null,
        lastName: workosUser.last_name || null,
        updatedAt: new Date(),
      })
      .where(eq(users.workosUserId, workosUser.id))
      .returning();

    if (!updated) {
      throw new Error(`User with WorkOS ID ${workosUser.id} not found`);
    }

    return updated;
  }

  /**
   * Update tenant details from WorkOS
   *
   * @param workosOrg - WorkOS organization data
   * @returns Updated tenant record
   */
  static async updateTenant(workosOrg: WorkOSOrganization) {
    const [updated] = await db
      .update(tenants)
      .set({
        name: workosOrg.name,
        domain: workosOrg.domain || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.workosOrganizationId, workosOrg.id))
      .returning();

    if (!updated) {
      throw new Error(
        `Tenant with WorkOS organization ID ${workosOrg.id} not found`,
      );
    }

    return updated;
  }

  /**
   * Map WorkOS role to local organization_role enum
   *
   * @param workosRole - Role from WorkOS as { slug: string }
   * @returns Local role enum value
   */
  private static mapWorkOSRoleToLocal(workosRole?: { slug: string }): OrganizationRole {
    if (!workosRole?.slug) {
      return "member"; // Default role
    }

    const roleLower = workosRole.slug.toLowerCase();

    if (roleLower === "admin" || roleLower === "owner") {
      return "admin";
    } else if (roleLower === "viewer" || roleLower === "guest") {
      return "viewer";
    } else {
      return "member";
    }
  }

  /**
   * Get local user ID from WorkOS user ID
   *
   * @param workosUserId - WorkOS user ID
   * @returns Local user ID or null if not found
   */
  static async getLocalUserIdFromWorkOS(
    workosUserId: string,
  ): Promise<string | null> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.workosUserId, workosUserId))
      .limit(1);

    return user?.id || null;
  }

  /**
   * Get local tenant ID from WorkOS organization ID
   *
   * @param workosOrgId - WorkOS organization ID
   * @returns Local tenant ID or null if not found
   */
  static async getLocalTenantIdFromWorkOS(
    workosOrgId: string,
  ): Promise<string | null> {
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.workosOrganizationId, workosOrgId))
      .limit(1);

    return tenant?.id || null;
  }

  /**
   * Soft delete a user (set deletedAt timestamp)
   * Preferred over hard delete to maintain referential integrity and audit trail
   *
   * @param workosUserId - WorkOS user ID
   * @returns Updated user record or null if not found
   */
  static async softDeleteUser(workosUserId: string) {
    const [deleted] = await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.workosUserId, workosUserId))
      .returning();

    return deleted || null;
  }

  /**
   * Soft delete a tenant (set deletedAt timestamp)
   * WARNING: This doesn't cascade - consider implications for related data
   * Preferred over hard delete to prevent accidental data loss
   *
   * @param workosOrgId - WorkOS organization ID
   * @returns Updated tenant record or null if not found
   */
  static async softDeleteTenant(workosOrgId: string) {
    const [deleted] = await db
      .update(tenants)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tenants.workosOrganizationId, workosOrgId))
      .returning();

    return deleted || null;
  }
}
