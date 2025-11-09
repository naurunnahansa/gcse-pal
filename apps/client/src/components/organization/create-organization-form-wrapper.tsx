'use client';

import { CreateOrganizationForm } from '@/components/organization/create-organization-form';
import { useRouter } from 'next/navigation';

export function CreateOrganizationFormWrapper() {
  const router = useRouter();

  return (
    <CreateOrganizationForm
      onSuccess={(organization) => {
        console.log('Organization created successfully:', organization);
        // Redirect to dashboard after successful creation
        router.push('/dashboard');
      }}
      onError={(error) => {
        console.error('Organization creation error:', error);
        // TODO: Show error toast/notification
        alert(`Error: ${error}`);
      }}
    />
  );
}
