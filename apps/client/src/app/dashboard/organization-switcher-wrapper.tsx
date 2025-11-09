'use client';

import { OrganizationSwitcher } from '@/components/organization/organization-switcher';

export function OrganizationSwitcherWrapper() {
  const handleOrganizationChange = (organizationId: string) => {
    // TODO: Update context/session with new organization
    console.log('Switched to organization:', organizationId);
  };

  return (
    <OrganizationSwitcher
      currentOrganizationId={undefined} // TODO: Get from context/session
      onOrganizationChange={handleOrganizationChange}
    />
  );
}
