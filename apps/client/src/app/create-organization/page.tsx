import { withAuth } from '@workos-inc/authkit-nextjs';
import { CreateOrganizationFormWrapper } from '@/components/organization/create-organization-form-wrapper';
import Link from 'next/link';

export default async function CreateOrganizationPage() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-semibold text-gray-900">
                Answerpoint
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {user?.firstName && user?.lastName ? (
                  `${user.firstName} ${user.lastName}`
                ) : (
                  user?.email
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Create Your Organization
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Set up your organization to start collaborating with your team and managing your AI customer service agents.
            </p>
          </div>

          <CreateOrganizationFormWrapper />

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an organization?{' '}
              <Link
                href="/dashboard"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Go to Dashboard
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
