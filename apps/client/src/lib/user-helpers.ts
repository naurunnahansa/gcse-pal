import { db, users, organizationMemberships, tenants, eq, and } from '@answerpoint/db';

/**
 * RSC helper - Get user's active organization membership
 * Returns null if user doesn't exist or has no active memberships
 */
export async function getUserActiveOrganization(workosUserId: string) {
  // Get local user from WorkOS ID
  const [localUser] = await db
    .select()
    .from(users)
    .where(eq(users.workosUserId, workosUserId))
    .limit(1);

  if (!localUser) {
    return null;
  }

  // Get first active membership with tenant details
  const [membership] = await db
    .select({
      id: organizationMemberships.id,
      userId: organizationMemberships.userId,
      organizationId: organizationMemberships.organizationId,
      role: organizationMemberships.role,
      status: organizationMemberships.status,
      tenantName: tenants.name,
      tenantDomain: tenants.domain,
    })
    .from(organizationMemberships)
    .innerJoin(tenants, eq(organizationMemberships.organizationId, tenants.id))
    .where(
      and(
        eq(organizationMemberships.userId, localUser.id),
        eq(organizationMemberships.status, 'active')
      )
    )
    .limit(1);

  return membership || null;
}
