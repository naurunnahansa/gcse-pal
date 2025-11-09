import { withAuth } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { CreateOrganizationForm } from '@/components/onboarding/create-organization-form';
import { getUserActiveOrganization } from '@/lib/user-helpers';

export default async function OnboardingPage() {
  // Require authentication (RSC pattern)
  const { user } = await withAuth();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user already has an organization (prevent re-onboarding)
  const membership = await getUserActiveOrganization(user.id);

  if (membership) {
    // Already has organization, redirect to dashboard
    console.log('User already has organization, redirecting to dashboard');
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AP</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Answerpoint</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user.firstName || user.email}!
          </h1>
          <p className="text-lg text-gray-600">
            Let's set up your organization to get started
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">
                What's an organization?
              </h3>
              <div className="mt-2 text-sm text-blue-800">
                <p>
                  An organization represents your company or team workspace. It contains your
                  products, customers, knowledge base, and team members all in one place.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <CreateOrganizationForm />
        </div>

        {/* Progress Indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
            <span className="font-medium text-blue-600">Step 1 of 1</span>
            <span>•</span>
            <span>Create Organization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
