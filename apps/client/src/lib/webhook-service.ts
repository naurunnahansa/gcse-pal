import { WorkOS } from "@workos-inc/node";
import { SyncService, db, users, eq } from "@answerpoint/db";

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  createdAt: string;
}

/**
 * Service for processing WorkOS webhook events and syncing to database
 */
export class WebhookService {
  /**
   * Process incoming webhook events from WorkOS
   */
  async processEvent(webhook: WebhookEvent): Promise<void> {
    console.log(`Processing webhook event: ${webhook.type}`);

    try {
      switch (webhook.type) {
        case "user.created":
          await this.handleUserCreated(webhook.data);
          break;

        case "user.deleted":
          await this.handleUserDeleted(webhook.data);
          break;

        case "user.updated":
          await this.handleUserUpdated(webhook.data);
          break;

        case "organization.created":
          await this.handleOrganizationCreated(webhook.data);
          break;

        case "organization.deleted":
          await this.handleOrganizationDeleted(webhook.data);
          break;

        case "organization.updated":
          await this.handleOrganizationUpdated(webhook.data);
          break;

        case "organization_membership.created":
          await this.handleOrganizationMembershipCreated(webhook.data);
          break;

        case "organization_membership.deleted":
          await this.handleOrganizationMembershipDeleted(webhook.data);
          break;

        case "organization_membership.updated":
          await this.handleOrganizationMembershipUpdated(webhook.data);
          break;

        default:
          console.log(`Unhandled webhook event type: ${webhook.type}`);
          break;
      }
    } catch (error) {
      console.error(`Error processing webhook event ${webhook.type}:`, error);
      throw error;
    }
  }

  /**
   * Handle user.created events
   * Creates user record immediately without tenantId
   * tenantId will be set when organization_membership.created event arrives
   */
  private async handleUserCreated(userData: any): Promise<void> {
    console.log("User created:", {
      userId: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
    });

    try {
      // Sync user without tenantId (will be set when membership is created)
      const syncedUser = await SyncService.syncUserFromWorkOS(
        {
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
        },
        null // tenantId initially null
      );

      console.log("User synced to database:", {
        localUserId: syncedUser.id,
        workosUserId: syncedUser.workosUserId,
        email: syncedUser.email,
        tenantId: syncedUser.tenantId, // Will be null initially
      });
    } catch (error) {
      console.error("Failed to sync user:", error);
      // Don't throw - user will be created/synced when membership event arrives
      console.warn("User sync failed, will be synced when membership event arrives");
    }
  }

  /**
   * Handle user.deleted events
   * Soft deletes the user by setting deletedAt timestamp
   */
  private async handleUserDeleted(userData: any): Promise<void> {
    console.log("User deleted:", {
      userId: userData.id,
    });

    try {
      const deletedUser = await SyncService.softDeleteUser(userData.id);

      if (deletedUser) {
        console.log("User soft deleted in database:", {
          localUserId: deletedUser.id,
          workosUserId: deletedUser.workosUserId,
          deletedAt: deletedUser.deletedAt,
        });
      } else {
        console.log("User not found or already deleted");
      }
    } catch (error) {
      console.error("Failed to soft delete user:", error);
      // Don't throw - user might already be deleted
      console.warn("User deletion failed, may already be removed");
    }
  }

  /**
   * Handle user.updated events
   */
  private async handleUserUpdated(userData: any): Promise<void> {
    console.log("User updated:", {
      userId: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
    });

    try {
      const user = await SyncService.updateUser({
        id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
      });

      console.log("User updated in database:", {
        localUserId: user.id,
        workosUserId: user.workosUserId,
        email: user.email,
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      // Don't throw - user might not exist yet if events arrive out of order
      console.warn(
        "User update failed, will be created when membership event arrives",
      );
    }
  }

  /**
   * Handle organization.created events
   */
  private async handleOrganizationCreated(orgData: any): Promise<void> {
    console.log("Organization created:", {
      organizationId: orgData.id,
      name: orgData.name,
      domain: orgData.domain,
    });

    try {
      const tenant = await SyncService.syncTenantFromWorkOS({
        id: orgData.id,
        name: orgData.name,
        domain: orgData.domain,
        allow_profiles_outside_organization:
          orgData.allow_profiles_outside_organization,
      });

      console.log("Organization synced to database:", {
        localTenantId: tenant.id,
        workosOrgId: tenant.workosOrganizationId,
        name: tenant.name,
      });
    } catch (error) {
      console.error("Failed to sync organization:", error);
      throw error;
    }
  }

  /**
   * Handle organization.deleted events
   * Soft deletes the tenant by setting deletedAt timestamp
   * NOTE: This does NOT cascade to child records - they remain accessible
   */
  private async handleOrganizationDeleted(orgData: any): Promise<void> {
    console.log("Organization deleted:", {
      organizationId: orgData.id,
    });

    try {
      const deletedTenant = await SyncService.softDeleteTenant(orgData.id);

      if (deletedTenant) {
        console.log("Organization soft deleted in database:", {
          localTenantId: deletedTenant.id,
          workosOrgId: deletedTenant.workosOrganizationId,
          deletedAt: deletedTenant.deletedAt,
        });
        console.warn(
          "Tenant soft deleted. Child records (users, products, customers) remain in database.",
        );
        console.warn(
          "Consider implementing archival or cleanup process for deleted tenants.",
        );
      } else {
        console.log("Organization not found or already deleted");
      }
    } catch (error) {
      console.error("Failed to soft delete organization:", error);
      // Don't throw - organization might already be deleted
      console.warn("Organization deletion failed, may already be removed");
    }
  }

  /**
   * Handle organization.updated events
   */
  private async handleOrganizationUpdated(orgData: any): Promise<void> {
    console.log("Organization updated:", {
      organizationId: orgData.id,
      name: orgData.name,
      domain: orgData.domain,
    });

    try {
      const tenant = await SyncService.updateTenant({
        id: orgData.id,
        name: orgData.name,
        domain: orgData.domain,
      });

      console.log("Organization updated in database:", {
        localTenantId: tenant.id,
        workosOrgId: tenant.workosOrganizationId,
        name: tenant.name,
      });
    } catch (error) {
      console.error("Failed to update organization:", error);
      throw error;
    }
  }

  /**
   * Handle organization_membership.created events
   * This is a critical handler that ensures users are created with proper tenant association
   */
  private async handleOrganizationMembershipCreated(
    membershipData: any,
  ): Promise<void> {
    console.log("Organization membership created:", {
      membershipId: membershipData.id,
      userId: membershipData.user_id,
      organizationId: membershipData.organization_id,
      role: membershipData.role,
    });

    try {
      // Initialize WorkOS client to fetch full user and organization data if needed
      const workos = new WorkOS(process.env.WORKOS_API_KEY);

      // First, ensure the organization exists in our database
      let tenantId = await SyncService.getLocalTenantIdFromWorkOS(
        membershipData.organization_id,
      );

      if (!tenantId) {
        console.log("Organization not found, fetching from WorkOS API...");
        const org = await workos.organizations.getOrganization(
          membershipData.organization_id,
        );
        const tenant = await SyncService.syncTenantFromWorkOS({
          id: org.id,
          name: org.name,
          domain: org.domains?.[0]?.domain,
        });
        tenantId = tenant.id;
      }

      // Then, ensure the user exists in our database
      let userId = await SyncService.getLocalUserIdFromWorkOS(
        membershipData.user_id,
      );

      if (!userId) {
        console.log("User not found, fetching from WorkOS API...");
        const user = await workos.userManagement.getUser(
          membershipData.user_id,
        );
        const syncedUser = await SyncService.syncUserFromWorkOS(
          {
            id: user.id,
            email: user.email,
            first_name: user.firstName ?? undefined,
            last_name: user.lastName ?? undefined,
          },
          tenantId,
        );
        userId = syncedUser.id;
      } else {
        // User exists - check if they need tenantId updated (in case user.created arrived first)
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (existingUser && !existingUser.tenantId) {
          console.log(
            "User exists without tenantId, updating with organization membership tenant"
          );
          await db.update(users).set({ tenantId }).where(eq(users.id, userId));
        }
      }

      // Finally, create the membership
      const membership = await SyncService.syncMembershipFromWorkOS({
        id: membershipData.id,
        user_id: membershipData.user_id,
        organization_id: membershipData.organization_id,
        role: membershipData.role,
        status: membershipData.status,
      });

      console.log("Membership synced to database:", {
        localMembershipId: membership.id,
        userId: membership.userId,
        organizationId: membership.organizationId,
        role: membership.role,
      });
    } catch (error) {
      console.error("Failed to sync membership:", error);
      throw error;
    }
  }

  /**
   * Handle organization_membership.deleted events
   */
  private async handleOrganizationMembershipDeleted(
    membershipData: any,
  ): Promise<void> {
    console.log("Organization membership deleted:", {
      membershipId: membershipData.id,
      userId: membershipData.user_id,
      organizationId: membershipData.organization_id,
    });

    try {
      const membership = await SyncService.removeMembership(
        membershipData.user_id,
        membershipData.organization_id,
      );

      if (membership) {
        console.log("Membership soft deleted in database:", {
          localMembershipId: membership.id,
          status: membership.status,
        });
      } else {
        console.log("Membership already removed or not found");
      }
    } catch (error) {
      console.error("Failed to delete membership:", error);
      // Don't throw - membership might already be deleted
      console.warn("Membership deletion failed, may already be removed");
    }
  }

  /**
   * Handle organization_membership.updated events
   */
  private async handleOrganizationMembershipUpdated(
    membershipData: any,
  ): Promise<void> {
    console.log("Organization membership updated:", {
      membershipId: membershipData.id,
      userId: membershipData.user_id,
      organizationId: membershipData.organization_id,
      role: membershipData.role,
    });

    try {
      const membership = await SyncService.updateMembership(
        membershipData.user_id,
        membershipData.organization_id,
        membershipData.role,
      );

      console.log("Membership updated in database:", {
        localMembershipId: membership.id,
        role: membership.role,
      });
    } catch (error) {
      console.error("Failed to update membership:", error);
      throw error;
    }
  }
}
