import { UnifiedLayout } from "@/components/layouts/UnifiedLayout";
import { AdminProtection } from "@/components/AdminProtection";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtection>
      <UnifiedLayout userRole="admin">
        {children}
      </UnifiedLayout>
    </AdminProtection>
  );
}