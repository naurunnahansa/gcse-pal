import { withAuth } from '@workos-inc/authkit-nextjs';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { getUserActiveOrganization } from '@/lib/user-helpers';
import { redirect } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await withAuth({ ensureSignedIn: true });

  // Get user's active organization
  const membership = await getUserActiveOrganization(user.id);

  if (!membership) {
    redirect('/onboarding');
  }

  return (
    <SidebarProvider>
      <AppSidebar
        tenantName={membership.tenantName}
        tenantDomain={membership.tenantDomain}
        role={membership.role}
        user={{
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
        }}
      />
      <SidebarInset>
        <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-white">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span className="text-sm font-medium text-gray-700">{membership.tenantName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
