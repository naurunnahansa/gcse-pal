'use server';

import { WorkOS, DomainDataState } from '@workos-inc/node';
import { revalidatePath } from 'next/cache';
import { createOrganizationSchema } from '@/lib/schemas/organization';
import { authActionClient } from '@/lib/safe-action';

/**
 * Server Action: Create organization in WorkOS and add user as admin
 */
export const createOrganizationAction = authActionClient
  .inputSchema(createOrganizationSchema)
  .action(async ({ parsedInput: data, ctx: { user } }) => {
    // Initialize WorkOS
    const workos = new WorkOS(process.env.WORKOS_API_KEY);

    // Create organization in WorkOS
    const workosOrg = await workos.organizations.createOrganization({
      name: data.name,
      domainData: data.domain
        ? [{ domain: data.domain, state: DomainDataState.Pending }]
        : undefined,
    });

    console.log('Organization created in WorkOS:', {
      orgId: workosOrg.id,
      name: workosOrg.name,
    });

    // Create organization membership for the user (make them admin)
    await workos.userManagement.createOrganizationMembership({
      userId: user.id,
      organizationId: workosOrg.id,
      roleSlug: 'admin', // First user is always admin
    });

    console.log('Organization membership created:', {
      userId: user.id,
      organizationId: workosOrg.id,
      role: 'admin',
    });

    // Wait briefly for webhooks to process
    // WorkOS webhooks are async, give them time to sync to database
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Revalidate paths that depend on organization data
    revalidatePath('/dashboard');
    revalidatePath('/onboarding');

    return {
      organizationId: workosOrg.id,
      organizationName: workosOrg.name,
    };
  });